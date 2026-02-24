/**
 * useAxisDoorTrigger — triggers an Axis Door (Révélation) when axis-lock resonance
 * is stable for trigger.minSeconds and cooldown has elapsed.
 */

import { useRef, useMemo } from 'react';
import { getAxisDoor } from '../data/axis-doors';
import type { AxisDoor } from '../data/axis-doors';
import type { LockState } from './useMeridianLock';

const COOLDOWN_PREFIX = 'arche.axisdoor.last.';

function getLastTriggeredMs(key: string): number | null {
  if (typeof localStorage === 'undefined') return null;
  const s = localStorage.getItem(COOLDOWN_PREFIX + key);
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function setLastTriggeredMs(key: string, ms: number): void {
  try {
    localStorage.setItem(COOLDOWN_PREFIX + key, String(ms));
  } catch {
    // ignore
  }
}

export interface UseAxisDoorTriggerInput {
  axisId: number | null;
  lockState: LockState;
  distToAxisM: number | null;
  headingErrorDeg: number | null;
  speedMps: number | null;
  activationMode: 'movement' | 'alignment' | 'arrival' | undefined;
  nowMs?: number;
}

export interface UseAxisDoorTriggerResult {
  door: AxisDoor | null;
  /** Call with door.key when showing the sheet to record cooldown. */
  openDoor: (doorKey?: string) => void;
  closeDoor: () => void;
}

function conditionsSatisfied(
  door: AxisDoor,
  lockState: LockState,
  distToAxisM: number | null,
  headingErrorDeg: number | null,
  speedMps: number | null
): boolean {
  const t = door.trigger;
  if (t.kind === 'alignment') {
    if (lockState !== 'RESONANCE') return false;
    if (headingErrorDeg == null || headingErrorDeg > t.maxHeadingDeg) return false;
    if (distToAxisM == null || distToAxisM > t.maxDistM) return false;
    return true;
  }
  if (t.kind === 'movement') {
    if (lockState !== 'RESONANCE') return false;
    if (speedMps == null || speedMps < t.minSpeedMps) return false;
    if (distToAxisM == null || distToAxisM > t.maxDistM) return false;
    return true;
  }
  if (t.kind === 'arrival') {
    if (lockState !== 'RESONANCE') return false;
    if (distToAxisM == null || distToAxisM > t.maxDistM) return false;
    return true;
  }
  return false;
}

export function useAxisDoorTrigger(input: UseAxisDoorTriggerInput): UseAxisDoorTriggerResult {
  const {
    axisId,
    lockState,
    distToAxisM,
    headingErrorDeg,
    speedMps,
    activationMode,
    nowMs = Date.now(),
  } = input;

  const dwellStartRef = useRef<number | null>(null);
  const lastDoorKeyRef = useRef<string | null>(null);

  const door = useMemo((): AxisDoor | null => {
    if (axisId == null) {
      dwellStartRef.current = null;
      lastDoorKeyRef.current = null;
      return null;
    }

    const axisDoor = getAxisDoor(axisId);
    if (!axisDoor) {
      dwellStartRef.current = null;
      lastDoorKeyRef.current = null;
      return null;
    }

    const satisfied = conditionsSatisfied(
      axisDoor,
      lockState,
      distToAxisM,
      headingErrorDeg,
      speedMps
    );

    if (!satisfied) {
      dwellStartRef.current = null;
      lastDoorKeyRef.current = null;
      return null;
    }

    const start = dwellStartRef.current ?? nowMs;
    dwellStartRef.current = start;
    const dwellSeconds = (nowMs - start) / 1000;
    const minSeconds = axisDoor.trigger.minSeconds;
    if (dwellSeconds < minSeconds) return null;

    const lastMs = getLastTriggeredMs(axisDoor.key);
    const cooldownMs = axisDoor.cooldownMinutes * 60 * 1000;
    if (lastMs != null && nowMs - lastMs < cooldownMs) return null;

    return axisDoor;
  }, [
    axisId,
    lockState,
    distToAxisM,
    headingErrorDeg,
    speedMps,
    activationMode,
    nowMs,
  ]);

  const openDoor = useMemo(() => {
    return (doorKey?: string) => {
      const key = doorKey ?? door?.key;
      if (key) {
        setLastTriggeredMs(key, Date.now());
        lastDoorKeyRef.current = key;
      }
    };
  }, [door?.key]);

  const closeDoor = useMemo(() => () => {}, []);

  return { door, openDoor, closeDoor };
}
