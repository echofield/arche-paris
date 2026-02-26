/**
 * ARCHÉ — Conducteur de champ (Creator Engine)
 * "Tu accordes la réalité." Create and activate champs; session + optional default.
 */

import { useState, useEffect, useCallback } from 'react';
import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';
import {
  type Champ,
  loadChamps,
  loadChamp,
  createChamp,
  updateChamp,
  activateChamp,
  getActiveChampId,
  setActiveChampId,
} from '../utils/card-gate-client';

const LAYER_KEYS = ['trace', 'alignment', 'ritual', 'echo', 'threshold'] as const;
const TONES = [
  { id: 'whisper', labelKey: 'conducteur.tone.whisper' },
  { id: 'neutral', labelKey: 'conducteur.tone.neutral' },
  { id: 'vivid', labelKey: 'conducteur.tone.vivid' },
  { id: 'grave', labelKey: 'conducteur.tone.grave' },
  { id: 'resonance', labelKey: 'conducteur.tone.resonance' },
] as const;
const DEFAULT_LAYERS = { trace: 0.8, alignment: 0.5, ritual: 0.5, echo: 0.7, threshold: 0.08 };
const MINUTES_17_30 = 17 * 60 + 30;
const MINUTES_23 = 23 * 60;

function minuteToLabel(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h${min > 0 ? String(min).padStart(2, '0') : '00'}`;
}

function consequenceSentence(layers: Record<string, number>): string {
  const t = layers.threshold ?? 0;
  const a = layers.alignment ?? 0;
  const r = layers.ritual ?? 0;
  const parts: string[] = [];
  if (t < 0.15) parts.push('ouvertures rares');
  else if (t > 0.3) parts.push('ouvertures fréquentes');
  if (a > 0.6) parts.push('géométrie forte');
  else if (a < 0.3) parts.push('géométrie douce');
  if (r > 0.6) parts.push('rituel élevé');
  else if (r < 0.2) parts.push('rituel bas');
  if (parts.length === 0) return 'Ce soir : équilibre.';
  return `Ce soir : ${parts.join(', ')}.`;
}

interface ConducteurScreenProps {
  cardId: string | null;
  onBack: () => void;
}

export function ConducteurScreen({ cardId, onBack }: ConducteurScreenProps) {
  const { t } = useTranslation();
  const [list, setList] = useState<Champ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [layers, setLayers] = useState<Record<string, number>>({ ...DEFAULT_LAYERS });
  const [tone, setTone] = useState('whisper');
  const [activeStartMinute, setActiveStartMinute] = useState(MINUTES_17_30);
  const [activeEndMinute, setActiveEndMinute] = useState(MINUTES_23);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<'idle' | 'saved' | 'error'>('idle');
  const activeChampId = getActiveChampId();

  const refreshList = useCallback(async () => {
    if (!cardId) return;
    setLoading(true);
    try {
      const champs = await loadChamps(cardId, { mine: true });
      setList(champs);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const loadOne = useCallback(
    async (id: string) => {
      if (!cardId) return;
      try {
        const c = await loadChamp(cardId, id);
        setEditingId(c.id);
        setName(c.name);
        setLayers({ ...c.layers });
        setTone(c.tone);
        setActiveStartMinute(c.active_start_minute);
        setActiveEndMinute(c.active_end_minute);
      } catch {
        setSaveMessage('error');
      }
    },
    [cardId]
  );

  const handleNew = useCallback(() => {
    setEditingId(null);
    setName('');
    setLayers({ ...DEFAULT_LAYERS });
    setTone('whisper');
    setActiveStartMinute(MINUTES_17_30);
    setActiveEndMinute(MINUTES_23);
  }, []);

  const handleSave = useCallback(async () => {
    if (!cardId) return;
    setSaving(true);
    setSaveMessage('idle');
    try {
      const body = {
        name: name.trim() || t('conducteur.untitled', 'Sans titre'),
        layers: {
          trace: Math.max(0, Math.min(1, layers.trace ?? 0)),
          alignment: Math.max(0, Math.min(1, layers.alignment ?? 0)),
          ritual: Math.max(0, Math.min(1, layers.ritual ?? 0)),
          echo: Math.max(0, Math.min(1, layers.echo ?? 0)),
          threshold: Math.max(0, Math.min(1, layers.threshold ?? 0)),
        },
        tone,
        active_start_minute: activeStartMinute,
        active_end_minute: activeEndMinute,
        timezone: 'Europe/Paris',
        zone: {},
        status: 'draft' as const,
        visibility: 'private' as const,
      };
      if (editingId) {
        await updateChamp(cardId, editingId, body);
      } else {
        await createChamp(cardId, body);
      }
      setSaveMessage('saved');
      setTimeout(() => setSaveMessage('idle'), 2400);
      refreshList();
    } catch {
      setSaveMessage('error');
    } finally {
      setSaving(false);
    }
  }, [cardId, editingId, name, layers, tone, activeStartMinute, activeEndMinute, t, refreshList]);

  const handleActivate = useCallback(
    async (id: string, setDefault: boolean) => {
      if (!cardId) return;
      try {
        await activateChamp(cardId, id, setDefault);
        setActiveChampId(id);
      } catch {
        setSaveMessage('error');
      }
    },
    [cardId]
  );

  if (!cardId) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
        <BackButton onBack={onBack} />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--grey-medium)', marginTop: 24 }}>
          {t('conducteur.needCard', 'Une carte activée est requise pour accéder au conducteur.')}
        </p>
      </div>
    );
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontSize: 10,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--grey-medium)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', paddingBottom: 96 }}>
      <BackButton onBack={onBack} />
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
        <p style={{ ...labelStyle, marginBottom: 24 }}>{t('conducteur.subtitle', 'MOTEUR CRÉATEUR · CONDUCTEUR DE CHAMP')}</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 300, lineHeight: 1.15, color: 'var(--ink)', marginBottom: 16 }}>
          {t('conducteur.title1', 'Tu ne produis pas du contenu.')}
          <br />
          <span style={{ fontStyle: 'italic', color: 'var(--green)' }}>{t('conducteur.title2', 'Tu accordes la réalité.')}</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 300, fontStyle: 'italic', color: 'var(--grey-medium)', marginBottom: 48 }}>
          {t('conducteur.hint', 'Comme un DJ avec les mêmes morceaux — différemment.')}
        </p>

        {/* My champs */}
        <section style={{ borderTop: '0.5px solid var(--grey-light)', paddingTop: 32, paddingBottom: 32 }}>
          <p style={{ ...labelStyle, marginBottom: 16 }}>{t('conducteur.myChamps', 'MES CHAMPS')}</p>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--grey-medium)' }}>{t('app.loading')}</p>
          ) : list.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--grey-medium)' }}>
              {t('conducteur.noChamps', 'Aucun champ encore. Créez-en un ci-dessous.')}
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {list.map((c) => (
                <li
                  key={c.id}
                  style={{
                    borderBottom: '0.5px solid var(--grey-light)',
                    padding: '14px 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 17, fontWeight: 300, color: editingId === c.id ? 'var(--green)' : 'var(--ink)' }}>
                      {c.name}
                    </span>
                    {activeChampId === c.id && (
                      <span style={{ ...labelStyle, fontSize: 9, marginLeft: 8 }}>{t('conducteur.active', 'Actif')}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => loadOne(c.id)}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--green)',
                        background: 'none',
                        border: '0.5px solid var(--green)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('conducteur.load', 'Charger')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActivate(c.id, false)}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--green)',
                        background: 'none',
                        border: '0.5px solid var(--green)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('conducteur.activate', 'Activer')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActivate(c.id, true)}
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--gold)',
                        background: 'none',
                        border: '0.5px solid var(--gold)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      {t('conducteur.setDefault', 'Par défaut')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Conductor form */}
        <section style={{ borderTop: '0.5px solid var(--grey-light)', paddingTop: 32, paddingBottom: 32 }}>
          <p style={{ ...labelStyle, marginBottom: 16 }}>{editingId ? t('conducteur.editChamp', 'MODIFIER LE CHAMP') : t('conducteur.newChamp', 'NOUVEAU CHAMP')}</p>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>{t('conducteur.fieldName', 'NOM DU CHAMP')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('conducteur.untitled', 'Sans titre')}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 24,
                fontWeight: 300,
                color: 'var(--ink)',
                background: 'none',
                border: 'none',
                borderBottom: '0.5px solid var(--grey-light)',
                width: '100%',
                padding: '8px 0',
                outline: 'none',
              }}
            />
          </div>
          {LAYER_KEYS.map((key) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ ...labelStyle, color: key === 'threshold' ? 'var(--gold)' : 'var(--ink)', textTransform: 'uppercase' }}>{key}</span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: key === 'threshold' ? 'var(--gold)' : 'var(--green)' }}>
                  {Math.round((layers[key] ?? 0) * 100)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round((layers[key] ?? 0) * 100)}
                onChange={(e) => setLayers((prev) => ({ ...prev, [key]: Number(e.target.value) / 100 }))}
                style={{ width: '100%', accentColor: key === 'threshold' ? 'var(--gold)' : 'var(--green)' }}
              />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <p style={{ ...labelStyle, marginBottom: 8 }}>{t('conducteur.tone', 'TONALITÉ')}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TONES.map((toneOpt) => (
                <button
                  key={toneOpt.id}
                  type="button"
                  onClick={() => setTone(toneOpt.id)}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 15,
                    fontWeight: 300,
                    fontStyle: tone === toneOpt.id ? 'italic' : 'normal',
                    color: tone === toneOpt.id ? 'var(--green)' : 'var(--grey-medium)',
                    background: 'none',
                    border: `0.5px solid ${tone === toneOpt.id ? 'var(--green)' : 'var(--grey-light)'}`,
                    padding: '8px 20px',
                    cursor: 'pointer',
                  }}
                >
                  {t(toneOpt.labelKey)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <p style={{ ...labelStyle, marginBottom: 4 }}>{t('conducteur.start', 'DÉBUT')}</p>
              <input
                type="range"
                min={0}
                max={1439}
                step={30}
                value={activeStartMinute}
                onChange={(e) => setActiveStartMinute(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--green)' }}
              />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 300, color: 'var(--green)' }}>{minuteToLabel(activeStartMinute)}</span>
            </div>
            <div>
              <p style={{ ...labelStyle, marginBottom: 4 }}>{t('conducteur.end', 'FIN')}</p>
              <input
                type="range"
                min={0}
                max={1439}
                step={30}
                value={activeEndMinute}
                onChange={(e) => setActiveEndMinute(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--green)' }}
              />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 300, color: 'var(--green)' }}>{minuteToLabel(activeEndMinute)}</span>
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 300, fontStyle: 'italic', color: 'var(--green)' }}>
              {consequenceSentence(layers)}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--grey-medium)', marginTop: 8 }}>
              {t('conducteur.cadence', 'Cadence estimée : 1 événement toutes les 7–12 min.')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleNew}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--grey-medium)',
                background: 'none',
                border: '0.5px solid var(--grey-light)',
                padding: '14px 24px',
                cursor: 'pointer',
              }}
            >
              {t('conducteur.new', 'Nouveau')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: saveMessage === 'saved' ? 'var(--gold)' : 'var(--green)',
                background: 'none',
                border: `0.5px solid ${saveMessage === 'saved' ? 'var(--gold)' : 'var(--green)'}`,
                padding: '14px 32px',
                cursor: saving ? 'wait' : 'pointer',
              }}
            >
              {saving ? t('app.loading') : saveMessage === 'saved' ? '✦ ' + t('conducteur.saved', 'Champ enregistré') : t('conducteur.save', 'Enregistrer le champ')}
            </button>
            {saveMessage === 'error' && (
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--grey-medium)' }}>{t('conducteur.saveError', 'Erreur. Réessayez.')}</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
