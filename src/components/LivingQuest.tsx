/**
 * LivingQuest — "You are here" indicator with strict priority
 *
 * Shows the single most relevant next action at any moment.
 * Priority order (strict):
 * 1. Zone entered but 0/2 rituals done → "Sceller la présence"
 * 2. Engravable zone (rituals done, no inscription) → "Laisser une phrase"
 * 3. Custody expiring (< 7 days) → "Renouveler garde"
 * 4. Incomplete meridian threshold → "Reprendre le méridien"
 * 5. Default → "Le méridien t'attend"
 */

import { useState, useEffect } from 'react';
import { type ZoneProgressData } from '../lib/api';
import { getThresholdsVisited, getObservations } from '../utils/meridien-storage';
import { MERIDIEN_THRESHOLDS, type ThresholdId } from '../data/meridiens';
import { useTranslation } from '../utils/i18n';
import { useWorldSnapshot } from '../contexts/WorldSnapshotContext';

export type LiveActionType =
  | 'seal_presence'
  | 'engrave'
  | 'renew_custody'
  | 'meridian'
  | 'start';

export interface LiveAction {
  type: LiveActionType;
  label: string;
  sublabel: string;
  target: string; // zone name, threshold name, or action
  daysToExpiry?: number;
}

// Zone ID to display name
function zoneIdToName(zoneId: string): string {
  // zone_id format: "paris-1" to "paris-20"
  const match = zoneId.match(/paris-(\d+)/);
  if (match) {
    const arr = parseInt(match[1], 10);
    return `${arr}e arrondissement`;
  }
  return zoneId;
}

// Threshold ID to display name
function thresholdIdToName(thresholdId: ThresholdId): string {
  const threshold = MERIDIEN_THRESHOLDS.find(t => t.id === thresholdId);
  return threshold?.subtitleFR ?? thresholdId;
}

// Get the next incomplete threshold
function getIncompleteMeridian(): ThresholdId | null {
  const visited = getThresholdsVisited();
  const observations = getObservations();

  // Check each threshold in order
  for (const threshold of MERIDIEN_THRESHOLDS) {
    const isVisited = visited.includes(threshold.id);
    if (!isVisited) return threshold.id;

    // Check if all prompts are observed
    const thresholdObs = observations.filter(o => o.thresholdId === threshold.id);
    const allPromptsObserved = threshold.prompts.every(p =>
      thresholdObs.some(o => o.promptId === p.id)
    );
    if (!allPromptsObserved) return threshold.id;
  }

  return null; // All complete
}

// Calculate days until custody expires
function daysUntilExpiry(expiresAt: string | null | undefined): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Core priority function — returns the single most relevant action
 */
export function getNextAction(zoneProgress: ZoneProgressData | null): LiveAction {
  if (zoneProgress) {
    const zones = zoneProgress.zones ?? [];

    // Priority 1: Zone entered but no rituals done
    const unsealed = zones.find(z =>
      z.entered === true &&
      !z.presence_ritual &&
      !z.observation_ritual
    );
    if (unsealed) {
      return {
        type: 'seal_presence',
        label: 'Sceller la présence',
        sublabel: zoneIdToName(unsealed.zone_id),
        target: unsealed.zone_id,
      };
    }

    // Priority 2: Engravable zone (at least one ritual done, not engraved)
    const engravable = zones.find(z =>
      (z.presence_ritual || z.observation_ritual) &&
      !z.engraved
    );
    if (engravable) {
      return {
        type: 'engrave',
        label: 'Laisser une phrase',
        sublabel: zoneIdToName(engravable.zone_id),
        target: engravable.zone_id,
      };
    }

    // Priority 3: Custody expiring soon (< 7 days)
    const expiring = zones
      .map((z) => ({
        zone: z,
        daysLeft: daysUntilExpiry(z.custody_expires_at),
      }))
      .filter(({ zone, daysLeft }) =>
        zone.is_custodian === true &&
        daysLeft !== null &&
        daysLeft > 0 &&
        daysLeft <= 7
      )
      .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number))[0];
    if (expiring) {
      const days = expiring.daysLeft as number;
      const dayLabel = days <= 1 ? '1 jour' : `${days} jours`;
      return {
        type: 'renew_custody',
        label: 'Renouveler garde',
        sublabel: `${zoneIdToName(expiring.zone.zone_id)} · expire dans ${dayLabel}`,
        target: expiring.zone.zone_id,
        daysToExpiry: days,
      };
    }
  }

  // Priority 4: Incomplete meridian
  const incompleteMeridian = getIncompleteMeridian();
  if (incompleteMeridian) {
    return {
      type: 'meridian',
      label: 'Reprendre le méridien',
      sublabel: thresholdIdToName(incompleteMeridian),
      target: incompleteMeridian,
    };
  }

  // Priority 5: Default — start meridian
  return {
    type: 'start',
    label: 'Le méridien t\'attend',
    sublabel: 'Commencer',
    target: 'meridiens',
  };
}

interface LivingQuestProps {
  onNavigate: (screen: string, target?: string) => void;
}

export function LivingQuest({ onNavigate }: LivingQuestProps) {
  const { t } = useTranslation();
  const { zoneProgress: ctxZoneProgress, loading: ctxLoading } = useWorldSnapshot();
  const [action, setAction] = useState<LiveAction | null>(null);
  const loading = ctxLoading && !action;

  useEffect(() => {
    const nextAction = getNextAction(ctxZoneProgress);
    setAction(nextAction);
  }, [ctxZoneProgress]);

  const handleClick = () => {
    if (!action) return;

    switch (action.type) {
      case 'seal_presence':
      case 'engrave':
      case 'renew_custody':
        // Navigate to collection (map) — the zone detail sheet will open
        onNavigate('collection', action.target);
        break;
      case 'meridian':
        onNavigate('meridiens');
        break;
      case 'start':
        onNavigate('meridiens');
        break;
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '16px 20px',
          background: 'rgba(0,61,44,0.03)',
          borderRadius: 8,
          marginBottom: 18,
          opacity: 0.5,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 11,
            color: '#8E8982',
            letterSpacing: '0.05em',
          }}
        >
          ...
        </div>
      </div>
    );
  }

  if (!action) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        width: '100%',
        padding: '16px 20px',
        background: 'rgba(0,61,44,0.05)',
        border: '1px solid rgba(0,61,44,0.12)',
        borderRadius: 8,
        marginBottom: 18,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,61,44,0.09)';
        e.currentTarget.style.borderColor = 'rgba(0,61,44,0.22)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(0,61,44,0.05)';
        e.currentTarget.style.borderColor = 'rgba(0,61,44,0.12)';
      }}
    >
      {/* Indicator dot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: action.type === 'start' ? '#B8860B' : '#003D2C',
            opacity: 0.8,
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 500,
              color: '#003D2C',
              letterSpacing: '0.02em',
              marginBottom: 2,
            }}
          >
            {action.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 13,
              fontStyle: 'italic',
              color: '#6B6455',
            }}
          >
            {action.sublabel}
          </div>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            color: '#003D2C',
            opacity: 0.5,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {t('home.continue', 'Continuer')} →
        </div>
      </div>
    </button>
  );
}
