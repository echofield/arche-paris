/**
 * ZoneDetailSheet — Shows zone progress + inscriptions + ritual actions
 * Accessed by tapping an arrondissement on Ma Carte
 */

import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { api, type ZoneProgressItem, type Inscription } from '../lib/api';
import { useZoneEntry, arrToZoneId } from '../hooks/useZoneEntry';
import { ZoneEntryFeedback } from './ZoneEntryFeedback';
import { RitualRunner, type RitualType } from './RitualRunner';

interface ZoneDetailSheetProps {
  arrondissement: number | null;
  onClose: () => void;
  onOpenEcrire: (arr: number) => void;
}

export function ZoneDetailSheet({ arrondissement, onClose, onOpenEcrire }: ZoneDetailSheetProps) {
  const [progress, setProgress] = useState<ZoneProgressItem | null>(null);
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRitual, setActiveRitual] = useState<RitualType | null>(null);
  const zoneEntry = useZoneEntry();

  const zoneId = arrondissement ? arrToZoneId(arrondissement) : null;

  // Load zone data
  const loadData = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);

    try {
      const progressResult = await api.zoneProgress();
      if (progressResult.data) {
        const zoneProgress = progressResult.data.zones.find(z => z.zone_id === zoneId);
        setProgress(zoneProgress || null);
      }

      const inscriptionsResult = await api.inscriptionsList(zoneId, 10, 0);
      if (inscriptionsResult.data) {
        setInscriptions(inscriptionsResult.data.inscriptions);
      }
    } catch (err) {
      console.error('Failed to load zone data:', err);
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  useEffect(() => {
    if (arrondissement) {
      loadData();
    }
  }, [arrondissement, loadData]);

  // Handle zone entry
  const handleEnter = async () => {
    if (!zoneId) return;
    const success = await zoneEntry.enterZone(zoneId);
    if (success) {
      setTimeout(loadData, 500);
    }
  };

  // Handle ritual completion
  const handleRitualComplete = (success: boolean) => {
    setActiveRitual(null);
    if (success) {
      loadData();
    }
  };

  const objectivesComplete = progress?.objectives_complete ?? 0;
  const hasEntered = progress?.entered === true;

  // Objective row renderer
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
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#007850' }}>✓</span>
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
            {/* Progress Ring */}
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
                    fontSize: 18,
                    color: '#003D2C',
                  }}
                >
                  {objectivesComplete}/5
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#8E8982', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Objectifs
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: '#1A1A1A' }}>
                  {objectivesComplete === 5 ? 'Zone maîtrisée' : objectivesComplete === 0 ? 'Zone inexplorée' : 'En progression'}
                </div>
              </div>
            </div>

            {/* Objectives List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Entrer */}
              {renderObjective(
                'entered',
                'Entrer',
                '◯',
                hasEntered,
                !hasEntered ? {
                  label: 'Entrer',
                  onClick: handleEnter,
                  disabled: zoneEntry.status !== 'idle',
                } : undefined
              )}

              {/* Présence */}
              {renderObjective(
                'presence_ritual',
                'Présence',
                '◎',
                progress?.presence_ritual === true,
                !progress?.presence_ritual ? {
                  label: 'Commencer',
                  onClick: () => setActiveRitual('presence'),
                  disabled: !hasEntered,
                } : undefined
              )}

              {/* Observation */}
              {renderObjective(
                'observation_ritual',
                'Observation',
                '◉',
                progress?.observation_ritual === true,
                !progress?.observation_ritual ? {
                  label: 'Commencer',
                  onClick: () => setActiveRitual('observation'),
                  disabled: !hasEntered,
                } : undefined
              )}

              {/* Gravure */}
              {renderObjective(
                'engraved',
                'Gravure',
                '✦',
                progress?.engraved === true,
                !progress?.engraved ? {
                  label: 'Écrire',
                  onClick: () => arrondissement && onOpenEcrire(arrondissement),
                  disabled: !(progress?.presence_ritual || progress?.observation_ritual),
                } : undefined
              )}

              {/* Gardien */}
              {renderObjective(
                'is_custodian',
                'Gardien',
                '♔',
                progress?.is_custodian === true
              )}
            </div>

            {/* Helper text */}
            {!hasEntered && (
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#8E8982',
                fontStyle: 'italic',
                textAlign: 'center',
              }}>
                Entre dans la zone pour débloquer les rituels.
              </p>
            )}

            {hasEntered && !(progress?.presence_ritual || progress?.observation_ritual) && (
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 11,
                color: '#8E8982',
                fontStyle: 'italic',
                textAlign: 'center',
              }}>
                Accomplis un rituel pour pouvoir laisser une gravure.
              </p>
            )}

            {/* Inscriptions */}
            {inscriptions.length > 0 && (
              <div>
                <div style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#003D2C',
                  opacity: 0.6,
                  marginBottom: 12,
                }}>
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
                      <p style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 13,
                        fontStyle: 'italic',
                        color: '#1A1A1A',
                        lineHeight: 1.5,
                        margin: 0,
                      }}>
                        "{ins.text}"
                      </p>
                      <div style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        color: '#8E8982',
                        marginTop: 8,
                      }}>
                        {ins.display_name || 'Anonyme'} · {new Date(ins.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inscriptions.length === 0 && hasEntered && (
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: '#8E8982',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '16px 0',
              }}>
                Aucune inscription dans cette zone. Soyez le premier.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Zone entry feedback */}
      <ZoneEntryFeedback
        status={zoneEntry.status}
        error={zoneEntry.error}
        zoneId={zoneEntry.lastAttemptZoneId}
        gpsData={zoneEntry.gpsData}
        onClose={zoneEntry.reset}
      />

      {/* Ritual runner overlay */}
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
