/**
 * useMeridianLock — axis-lock state for Meridian instrument.
 * Uses position, heading, accuracy, speed; returns lock state, alignment, speedFactor.
 */

import { useRef, useMemo } from 'react';
import { CITY_AXES, getAxisArrondissementSequence } from '../data/axes';
import { ARR_CENTER } from '../data/arrondissement-centers';
import {
  distancePointToPolylineMeters,
  nearestSegmentBearingDeg,
  angleDiffDeg,
  type LatLng,
} from '../lib/geo/polyline';
import { bearingDegrees } from '../utils/geo';
import {
  resonanceHeadingDeg,
  interferenceHeadingDeg,
  resonanceDistanceM,
  interferenceDistanceM,
  accuracyMaxM,
  movementMinMps,
} from '../lib/meridiens/axis-constants';
import type { ActivationMode } from '../types/axes';

export type LockState = 'DISPERSION' | 'INTERFERENCE' | 'RESONANCE';

export interface UseMeridianLockInput {
  axisId: string | null;
  position: { lat: number; lng: number } | null;
  headingDeg: number | null;
  accuracyM: number | null;
  speedMps: number | null;
}

export interface UseMeridianLockResult {
  lockState: LockState;
  distToAxisM: number | null;
  headingErrorDeg: number | null;
  alignmentScore: number;
  speedFactor: number;
  arrivalTightness: number;
  axisName?: string;
  activationMode?: ActivationMode;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

export function useMeridianLock(input: UseMeridianLockInput): UseMeridianLockResult {
  const {
    axisId,
    position,
    headingDeg,
    accuracyM,
    speedMps,
  } = input;

  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastCourseRef = useRef<number | null>(null);

  return useMemo((): UseMeridianLockResult => {
    const defaultDispersion: UseMeridianLockResult = {
      lockState: 'DISPERSION',
      distToAxisM: null,
      headingErrorDeg: null,
      alignmentScore: 0,
      speedFactor: 1,
      arrivalTightness: 0,
    };

    if (!axisId || !position) {
      lastPosRef.current = position;
      return defaultDispersion;
    }

    const axisIndex = parseInt(axisId, 10);
    if (!Number.isFinite(axisIndex) || axisIndex < 0 || axisIndex >= CITY_AXES.length) {
      return defaultDispersion;
    }

    const axis = CITY_AXES[axisIndex];
    const activationMode = axis.activation_mode;

    const arrSeq = getAxisArrondissementSequence(axisIndex);
    const polyline: LatLng[] = [];
    for (const arr of arrSeq) {
      const c = ARR_CENTER[arr];
      if (c) polyline.push(c);
    }
    if (polyline.length < 2) {
      return { ...defaultDispersion, axisName: axis.name, activationMode };
    }

    const distToAxisM = distancePointToPolylineMeters(position, polyline);
    const segBearing = nearestSegmentBearingDeg(position, polyline);

    let effectiveHeading: number | null = headingDeg;
    if (effectiveHeading == null || !Number.isFinite(effectiveHeading)) {
      if ((speedMps ?? 0) > 0.8 && lastPosRef.current) {
        const prev = lastPosRef.current;
        const course = bearingDegrees(prev.lat, prev.lng, position.lat, position.lng);
        lastCourseRef.current = course;
        effectiveHeading = course;
      } else {
        lastCourseRef.current = null;
        lastPosRef.current = position;
        return {
          ...defaultDispersion,
          distToAxisM,
          axisName: axis.name,
          activationMode,
          speedFactor: 1 + clamp(speedMps ?? 0, 0, 2) * (activationMode === 'movement' ? 2.5 : 1.5),
        };
      }
    }
    lastPosRef.current = position;

    const headingErrorDeg = angleDiffDeg(effectiveHeading, segBearing);

    let resDist = resonanceDistanceM;
    let intDist = interferenceDistanceM;
    if (activationMode === 'alignment') {
      resDist = resonanceDistanceM * 1.5;
      intDist = interferenceDistanceM * 1.5;
    }

    if (accuracyM == null || accuracyM > accuracyMaxM) {
      return {
        ...defaultDispersion,
        distToAxisM,
        headingErrorDeg,
        axisName: axis.name,
        activationMode,
        speedFactor: 1 + clamp(speedMps ?? 0, 0, 2) * (activationMode === 'movement' ? 2.5 : 1.5),
      };
    }

    let lockState: LockState = 'DISPERSION';
    const inResonanceZone = headingErrorDeg < resonanceHeadingDeg && distToAxisM < resDist;
    const inInterferenceZone = headingErrorDeg < interferenceHeadingDeg && distToAxisM < intDist;

    if (activationMode === 'movement' && (speedMps ?? 0) < movementMinMps) {
      if (inInterferenceZone) lockState = 'INTERFERENCE';
      else if (inResonanceZone) lockState = 'INTERFERENCE';
    } else if (activationMode === 'arrival') {
      const closeEnough = distToAxisM < 60;
      const headingOkForArrival = headingErrorDeg < 45;
      if (closeEnough && headingOkForArrival) lockState = 'RESONANCE';
      else if (inInterferenceZone) lockState = 'INTERFERENCE';
    } else {
      if (inResonanceZone) lockState = 'RESONANCE';
      else if (inInterferenceZone) lockState = 'INTERFERENCE';
    }

    const alignmentScore = clamp(
      (1 - headingErrorDeg / 45) * (1 - distToAxisM / 300),
      0,
      1
    );
    const speedFactor = 1 + clamp(speedMps ?? 0, 0, 2) * (activationMode === 'movement' ? 2.5 : 1.5);
    const arrivalTightness =
      activationMode === 'arrival' ? clamp(1 - distToAxisM / 60, 0, 1) : 0;

    return {
      lockState,
      distToAxisM,
      headingErrorDeg,
      alignmentScore,
      speedFactor,
      arrivalTightness,
      axisName: axis.name,
      activationMode,
    };
  }, [axisId, position?.lat, position?.lng, headingDeg, accuracyM, speedMps]);
}
