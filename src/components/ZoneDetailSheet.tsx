/**
 * ZoneDetailSheet - Shows zone progress + inscriptions + ritual actions
 * Accessed by tapping an arrondissement on Ma Carte
 */

import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { api, type ZoneProgressItem, type Inscription, type LawEvaluateData } from '../lib/api';
import { useZoneEntry, arrToZoneId } from '../hooks/useZoneEntry';
import { ZoneEntryFeedback } from './ZoneEntryFeedback';
import { RitualRunner, type RitualType } from './RitualRunner';
import {
  evaluateSituationalActivation,
  type ActivationResult,
  type UrbanArtifactType,
} from '../utils/situational-activation';

interface ZoneDetailSheetProps {
  arrondissement: number | null;
  onClose: () => void;
  onOpenEcrire: (arr: number) => void;
}

function inferArtifactType(arr: number): UrbanArtifactType {
  if ([4, 5].includes(arr)) return 'liturgical_artifact';
  if ([6, 13].includes(arr)) return 'knowledge_artifact';
  if ([10, 19].includes(arr)) return 'water_structure';
  if ([18, 20].includes(arr)) return 'rupture_trace';
  if ([1, 7, 8].includes(arr)) return 'civic_emblem';
  return 'inscription_stone';
}

function lawLine(law: LawEvaluateData | null): string {
  if (!law) return 'Not yet.';
  if (law.reason_code === 'AUTH_REQUIRED') return 'Pair your card to begin.';
  return [law.message, law.next_unlock_hint].filter(Boolean).join(' ').trim() || 'Not yet.';
}

export function ZoneDetailSheet({ arrondissement, onClose, onOpenEcrire }: ZoneDetailSheetProps) {
  const [progress, setProgress] = useState<ZoneProgressItem | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [zoneLaw, setZoneLaw] = useState<LawEvaluateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeRitual, setActiveRitual] = useState<RitualType | null>(null);
  const [activationResult, setActivationResult] = useState<ActivationResult | null>(null);
  const [lawRefusal, setLawRefusal] = useState<string | null>(null);
  const zoneEntry = useZoneEntry();

  const zoneId = arrondissement ? arrToZoneId(arrondissement) : null;
  const zoneH3 = arrondissement ? `PAR-${String(arrondissement).padStart(2, '0')}` : null;

  const loadData = useCallback(async () => {
    if (!zoneId || !arrondissement || !zoneH3) return;
    setLoading(true);
    try {
      const [snapshotResult, consciousnessResult, complexionResult] = await Promise.all([
        api.worldSnapshotForZone(zoneH3, 'law,map,champ'),
        api.zoneConsciousness(zoneId),
        api.meComplexion(),
      ]);

      let zoneProgress: ZoneProgressItem | null = null;
      let snapshotInscriptions: Inscription[] = [];
      if (snapshotResult.data) {
        if (import.meta.env.DEV) {
          console.debug('[ZoneDetailSheet] snapshot', {
            world_version: snapshotResult.data.policy.world_version,
            now: snapshotResult.data.now,
            authenticated: snapshotResult.data.me.authenticated,
            h3: zoneH3,
          });
        }
        const zoneOverlay = snapshotResult.data.me.zones[zoneH3];
        const rawProgress = zoneOverlay?.progress;
        zoneProgress = rawProgress
          ? {
              zone_id: rawProgress.zone_id,
              entered: rawProgress.entered,
              entered_at: rawProgress.entered_at,
              presence_ritual: false,
              presence_ritual_at: null,
              observation_ritual: false,
              observation_ritual_at: null,
              engraved: rawProgress.engraved,
              engraved_at: rawProgress.engraved_at,
              is_custodian: false,
              custodian_since: null,
              custody_expires_at: null,
              objectives_complete: rawProgress.engraved ? 2 : (rawProgress.entered ? 1 : 0),
              updated_at: rawProgress.engraved_at ?? rawProgress.entered_at ?? new Date().toISOString(),
            }
          : null;
        setProgress(zoneProgress);

        const zone = snapshotResult.data.world.zones.find((z) => z.h3 === zoneH3);
        const law = zone?.law?.['ritual.start'] ?? zoneOverlay?.activation ?? null;
        setZoneLaw(law);

        snapshotInscriptions = (snapshotResult.data.world.map.inscriptions ?? [])
          .filter((ins) => ins.h3 === zoneH3)
          .map((ins) => ({
            inscription_id: ins.id,
            text: ins.excerpt,
            display_name: null,
            created_at: ins.ts,
          }));
        setInscriptions(snapshotInscriptions);
      } else {
        setProgress(null);
        setZoneLaw(null);
        setInscriptions([]);
      }

      if (zoneProgress && complexionResult.data) {
        const hour = new Date().getHours();
        const timeBand = hour < 6 ? 'night' : hour < 10 ? 'dawn' : hour < 18 ? 'day' : hour < 22 ? 'dusk' : 'night';
        const semanticsTags = snapshotInscriptions
          .slice(0, 3)
          .map((i) => i.text?.slice(0, 24).trim())
          .filter((s): s is string => Boolean(s));

        const activation = evaluateSituationalActivation({
          artifactType: inferArtifactType(arrondissement),
          semanticsTags,
          complexion: {
            presence: complexionResult.data.presence_points,
            wisdom: complexionResult.data.wisdom_points,
            shadow: complexionResult.data.shadow_points,
          },
          context: {
            dwellMinutes: zoneProgress.entered ? 1.2 : 0,
            revisitsAtArtifact: Math.max(0, zoneProgress.objectives_complete - 1),
            displacementMeters: zoneProgress.entered ? 60 : 0,
            timeBand,
            nearbyRitualDensity: Math.min(1, zoneProgress.objectives_complete / 5),
          },
          zoneConsciousness: consciousnessResult.data
            ? {
                entropy: consciousnessResult.data.metrics.entropy,
                resonance: consciousnessResult.data.metrics.resonance,
                unresolvedThreads: consciousnessResult.data.metrics.unresolved_threads,
                guardianDecay: consciousnessResult.data.metrics.guardian_decay,
              }
            : undefined,
        });
        setActivationResult(activation);
      } else {
        setActivationResult(null);
      }
    } catch (err) {
      console.error('Failed to load zone data:', err);
      setZoneLaw(null);
      setActivationResult(null);
    } finally {
      setLoading(false);
    }
  }, [zoneId, arrondissement, zoneH3]);

  useEffect(() => {
    if (arrondissement) loadData();
  }, [arrondissement, loadData]);

  const handleEnter = async () => {
    if (!zoneId) return;
    const success = await zoneEntry.enterZone(zoneId);
    if (success) setTimeout(loadData, 500);
  };

  const handleRitualComplete = (success: boolean) => {
    setActiveRitual(null);
    if (success) loadData();
  };

  const handleRitualStart = useCallback(async (ritualType: RitualType) => {
    if (!zoneH3) return;
    setLawRefusal(null);
    const evalResult = await api.lawEvaluate('ritual.start', zoneH3);
    if (evalResult.error || !evalResult.data) {
      setLawRefusal('Not yet.');
      return;
    }
    if (!evalResult.data.allowed) {
      setLawRefusal(lawLine(evalResult.data));
      return;
    }
    setActiveRitual(ritualType);
  }, [zoneH3]);

  const objectivesComplete = progress?.objectives_complete ?? 0;
  const hasEntered = progress?.entered === true;
  const isActivationClosed = activationResult != null && !activationResult.isOpen;

  const renderObjective = (
    key: string,
    label: string,
    icon: string,
    complete: boolean,
    action?: { label: string; onClick: () => void; disabled?: boolean }
  ) => (
    <div
      key={key}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: complete ? 'rgba(0,61,44,0.06)' : '#FFF',
        border: `1px solid ${complete ? 'rgba(0,61,44,0.2)' : 'rgba(0,0,0,0.06)'}`,
        borderRadius: 6,
      }}
    >
      <span style={{ fontSize: 16, opacity: complete ? 1 : 0.3 }}>{icon}</span>
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--font-sans)',
          fontSize: 13,
          color: complete ? '#003D2C' : '#8E8982',
        }}
      >
        {label}
      </span>
      {complete ? (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#007850' }}>OK</span>
      ) : action && (
        <button
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          style={{
            padding: '6px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: action.disabled ? '#8E8982' : '#003D2C',
            background: action.disabled ? 'rgba(0,0,0,0.03)' : 'rgba(0,61,44,0.1)',
            border: 'none',
            borderRadius: 4,
            cursor: action.disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );

  return (
    <>
      <Sheet open={arrondissement !== null && activeRitual === null} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto"
          style={{ background: '#FAF8F2', borderColor: 'rgba(0,61,44,0.15)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
              {arrondissement}e arrondissement
            </SheetTitle>
          </SheetHeader>

          <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `conic-gradient(#003D2C ${objectivesComplete * 20}%, #E5E2DB ${objectivesComplete * 20}%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#FAF8F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 16,
                    color: '#003D2C',
                  }}
                >
                  {objectivesComplete === 5 ? 'OK' : objectivesComplete === 0 ? 'O' : 'C'}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#8E8982', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Etat
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: '#1A1A1A' }}>
                  {objectivesComplete === 5 ? 'Zone maitrisee' : objectivesComplete === 0 ? 'Zone inexploree' : 'En progression'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {renderObjective(
                'entered',
                'Entrer',
                'O',
                hasEntered,
                !hasEntered ? { label: 'Entrer', onClick: handleEnter, disabled: zoneEntry.status !== 'idle' } : undefined
              )}

              {renderObjective(
                'presence_ritual',
                'Presence',
                'P',
                progress?.presence_ritual === true,
                !progress?.presence_ritual
                  ? {
                      label: 'Commencer',
                      onClick: () => void handleRitualStart('presence'),
                      disabled: !hasEntered || (zoneLaw != null && !zoneLaw.allowed),
                    }
                  : undefined
              )}

              {renderObjective(
                'observation_ritual',
                'Observation',
                'O',
                progress?.observation_ritual === true,
                !progress?.observation_ritual
                  ? {
                      label: 'Commencer',
                      onClick: () => void handleRitualStart('observation'),
                      disabled: !hasEntered || (zoneLaw != null && !zoneLaw.allowed),
                    }
                  : undefined
              )}

              {renderObjective(
                'engraved',
                'Gravure',
                '*',
                progress?.engraved === true,
                !progress?.engraved
                  ? {
                      label: 'Ecrire',
                      onClick: () => arrondissement && onOpenEcrire(arrondissement),
                      disabled: !(progress?.presence_ritual || progress?.observation_ritual) || isActivationClosed,
                    }
                  : undefined
              )}

              {renderObjective('is_custodian', 'Gardien', 'G', progress?.is_custodian === true)}
            </div>

            {isActivationClosed && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: '#6B6455',
                  textAlign: 'center',
                }}
              >
                {activationResult?.refusalLine ?? 'The place remains closed.'}
              </p>
            )}

            {lawRefusal && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: '#6B6455',
                  textAlign: 'center',
                }}
              >
                {lawRefusal}
              </p>
            )}

            {!lawRefusal && zoneLaw && !zoneLaw.allowed && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: '#6B6455',
                  textAlign: 'center',
                }}
              >
                {lawLine(zoneLaw)}
              </p>
            )}

            {!hasEntered && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#8E8982', fontStyle: 'italic', textAlign: 'center' }}>
                Entre dans la zone pour debloquer les moments.
              </p>
            )}

            {hasEntered && !(progress?.presence_ritual || progress?.observation_ritual) && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#8E8982', fontStyle: 'italic', textAlign: 'center' }}>
                Accomplis un moment pour pouvoir laisser une gravure.
              </p>
            )}

            {inscriptions.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    opacity: 0.6,
                    marginBottom: 12,
                  }}
                >
                  Inscriptions ({inscriptions.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {inscriptions.map((ins) => (
                    <div
                      key={ins.inscription_id}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(0,61,44,0.03)',
                        borderLeft: '2px solid rgba(0,61,44,0.2)',
                        borderRadius: '0 4px 4px 0',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontSize: 13,
                          fontStyle: 'italic',
                          color: '#1A1A1A',
                          lineHeight: 1.5,
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        "{ins.text}"
                      </p>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#8E8982', marginTop: 8 }}>
                        {ins.display_name || 'Anonyme'} · {new Date(ins.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inscriptions.length === 0 && hasEntered && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8E8982', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                Aucune inscription dans cette zone. Soyez le premier.
              </p>
            )}

            {loading && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#8E8982', textAlign: 'center' }}>
                Chargement...
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ZoneEntryFeedback
        status={zoneEntry.status}
        error={zoneEntry.error}
        zoneId={zoneEntry.lastAttemptZoneId}
        gpsData={zoneEntry.gpsData}
        onClose={zoneEntry.reset}
      />

      {activeRitual && zoneId && (
        <RitualRunner
          zoneId={zoneId}
          ritualType={activeRitual}
          onComplete={handleRitualComplete}
          onCancel={() => setActiveRitual(null)}
        />
      )}
    </>
  );
}
