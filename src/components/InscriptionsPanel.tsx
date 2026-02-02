/**
 * ARCHÉ — Inscriptions Panel
 *
 * Le miroir du lieu.
 * Overlay qui apparaît quand on ouvre un lieu.
 * Affiche l'état actuel + timeline des inscriptions.
 *
 * Pas un formulaire. Un espace rituel.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UserLieuCard,
  UserLieuCardState,
  Inscription,
  LieuMinimal,
  NextPromptResult
} from '../types/inscriptions';
import {
  getUserLieuCard,
  computeNextPrompt,
  addInscription,
  formatInscriptionDate,
  getLayerLabel,
  getLayerSymbol
} from '../utils/inscriptions-service';
import { bump } from '../utils/companion-service';

interface InscriptionsPanelProps {
  lieu: LieuMinimal;
  isOpen: boolean;
  onClose: () => void;
}

export function InscriptionsPanel({ lieu, isOpen, onClose }: InscriptionsPanelProps) {
  const [card, setCard] = useState<UserLieuCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextPrompt, setNextPrompt] = useState<NextPromptResult | null>(null);

  // Ritual mode state
  const [ritualMode, setRitualMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showWhispers, setShowWhispers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load card data
  const loadCard = useCallback(async () => {
    if (!lieu.id) return;
    setLoading(true);

    const data = await getUserLieuCard(lieu.id);
    setCard(data);

    // Compute next prompt
    const inscriptions = data?.inscriptions || [];
    const prompt = computeNextPrompt(inscriptions);
    setNextPrompt(prompt);

    setLoading(false);
  }, [lieu.id]);

  useEffect(() => {
    if (isOpen) {
      loadCard();
      // Reset ritual state
      setRitualMode(false);
      setInputText('');
      setShowWhispers(false);
      setFeedback(null);
    }
  }, [isOpen, loadCard]);

  // Determine UI state
  const state: UserLieuCardState = card?.state || 'glimpsed';
  const inscriptions = card?.inscriptions || [];

  // Handle inscription submission
  const handleSubmit = async () => {
    if (!nextPrompt?.prompt || !inputText.trim()) return;

    setSaving(true);
    setFeedback(null);

    const result = await addInscription(
      lieu.id,
      nextPrompt.prompt.layer,
      nextPrompt.prompt.id,
      inputText,
      showWhispers
    );

    setSaving(false);

    if (result.success) {
      bump('inscription_written');
      setFeedback({ type: 'success', message: result.message });
      setInputText('');
      setRitualMode(false);
      // Reload card
      await loadCard();
    } else {
      setFeedback({ type: 'error', message: result.message });
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 300ms ease'
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '85vh',
          background: '#FAF8F2',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          zIndex: 1001,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease',
          overflowY: 'auto',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: '40px',
            height: '4px',
            background: 'rgba(0, 61, 44, 0.2)',
            borderRadius: '2px',
            margin: '12px auto'
          }}
        />

        {/* Header */}
        <header style={{ padding: '0 24px 20px', borderBottom: '1px solid rgba(0, 61, 44, 0.1)' }}>
          {/* State indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <StateIndicator state={state} />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.6
              }}
            >
              {state === 'glimpsed' && 'Nouveau lieu'}
              {state === 'inscribed' && `${inscriptions.length} inscription${inscriptions.length > 1 ? 's' : ''}`}
              {state === 'claimed' && 'Lieu à toi'}
            </span>
          </div>

          {/* Lieu name */}
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '24px',
              fontWeight: '600',
              color: '#1A1A1A',
              marginBottom: '4px'
            }}
          >
            {lieu.name}
          </h2>
          {lieu.arrondissement && (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                color: '#003D2C',
                opacity: 0.5,
                letterSpacing: '0.05em'
              }}
            >
              {lieu.arrondissement}
            </p>
          )}
        </header>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {loading ? (
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', opacity: 0.5 }}>
              Chargement...
            </p>
          ) : ritualMode && nextPrompt?.prompt ? (
            /* Ritual Mode - Writing */
            <RitualInput
              prompt={nextPrompt.prompt}
              value={inputText}
              onChange={setInputText}
              showWhispers={showWhispers}
              onShowWhispers={() => setShowWhispers(true)}
              onSubmit={handleSubmit}
              onCancel={() => {
                setRitualMode(false);
                setInputText('');
                setShowWhispers(false);
              }}
              saving={saving}
              feedback={feedback}
            />
          ) : (
            /* Normal Mode - Timeline + CTA */
            <>
              {/* Inscriptions Timeline */}
              {inscriptions.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '10px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      opacity: 0.5,
                      marginBottom: '16px'
                    }}
                  >
                    Mes inscriptions
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {inscriptions
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((inscription) => (
                        <InscriptionCard key={inscription.id} inscription={inscription} />
                      ))}
                  </div>
                </div>
              )}

              {/* CTA - Soft invitation */}
              {nextPrompt?.prompt && (
                <div style={{ textAlign: 'center' }}>
                  {nextPrompt.reason === 'too_soon' && nextPrompt.daysUntilNext && (
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '13px',
                        fontStyle: 'italic',
                        color: '#1A1A1A',
                        opacity: 0.5,
                        marginBottom: '16px'
                      }}
                    >
                      Prochaine question dans {nextPrompt.daysUntilNext} jour{nextPrompt.daysUntilNext > 1 ? 's' : ''}
                    </p>
                  )}

                  <button
                    onClick={() => setRitualMode(true)}
                    style={{
                      background: state === 'glimpsed' ? '#003D2C' : 'transparent',
                      color: state === 'glimpsed' ? '#FAF8F2' : '#003D2C',
                      border: state === 'glimpsed' ? 'none' : '1px solid rgba(0, 61, 44, 0.3)',
                      padding: '14px 28px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {state === 'glimpsed' ? 'Inscrire un fragment' : 'Ajouter une inscription'}
                  </button>
                </div>
              )}

              {/* Feedback message */}
              {feedback && (
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '14px',
                    color: feedback.type === 'success' ? '#003D2C' : '#8B0000',
                    textAlign: 'center',
                    marginTop: '16px',
                    fontStyle: 'italic'
                  }}
                >
                  {feedback.message}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

function StateIndicator({ state }: { state: UserLieuCardState }) {
  const styles: Record<UserLieuCardState, React.CSSProperties> = {
    glimpsed: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: '1.5px solid rgba(0, 61, 44, 0.3)',
      background: 'transparent'
    },
    inscribed: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: '1.5px solid #003D2C',
      background: 'linear-gradient(to right, #003D2C 50%, transparent 50%)'
    },
    claimed: {
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      border: 'none',
      background: '#003D2C'
    }
  };

  return <div style={styles[state]} />;
}

function InscriptionCard({ inscription }: { inscription: Inscription }) {
  return (
    <div
      style={{
        padding: '16px',
        background: 'rgba(0, 61, 44, 0.03)',
        borderLeft: '3px solid rgba(0, 61, 44, 0.2)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '14px',
            color: '#003D2C'
          }}
        >
          {getLayerSymbol(inscription.layer)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6
          }}
        >
          {getLayerLabel(inscription.layer)}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '10px',
            color: '#1A1A1A',
            opacity: 0.4,
            marginLeft: 'auto'
          }}
        >
          {formatInscriptionDate(inscription.created_at)}
        </span>
      </div>

      {/* Text */}
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '15px',
          lineHeight: 1.6,
          color: '#1A1A1A',
          opacity: 0.85
        }}
      >
        {inscription.text}
      </p>
    </div>
  );
}

interface RitualInputProps {
  prompt: { question: string; whispers: string[]; layer: string };
  value: string;
  onChange: (value: string) => void;
  showWhispers: boolean;
  onShowWhispers: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  feedback: { type: 'success' | 'error'; message: string } | null;
}

function RitualInput({
  prompt,
  value,
  onChange,
  showWhispers,
  onShowWhispers,
  onSubmit,
  onCancel,
  saving,
  feedback
}: RitualInputProps) {
  return (
    <div>
      {/* Question */}
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '20px',
          fontWeight: '500',
          color: '#1A1A1A',
          lineHeight: 1.5,
          marginBottom: '24px',
          textAlign: 'center'
        }}
      >
        {prompt.question}
      </p>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="..."
        autoFocus
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '16px',
          border: '1px solid rgba(0, 61, 44, 0.2)',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'var(--font-serif)',
          fontSize: '16px',
          lineHeight: 1.6,
          color: '#1A1A1A',
          resize: 'vertical',
          outline: 'none'
        }}
      />

      {/* Character count */}
      <p
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          color: value.length > 450 ? '#8B0000' : '#1A1A1A',
          opacity: 0.4,
          textAlign: 'right',
          marginTop: '4px'
        }}
      >
        {value.length} / 500
      </p>

      {/* Whispers (soft help) */}
      {!showWhispers ? (
        <button
          onClick={onShowWhispers}
          style={{
            background: 'none',
            border: 'none',
            padding: '8px 0',
            fontFamily: 'var(--font-serif)',
            fontSize: '13px',
            fontStyle: 'italic',
            color: '#003D2C',
            opacity: 0.5,
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          Je n'arrive pas à écrire...
        </button>
      ) : (
        <div style={{ marginTop: '16px' }}>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.4,
              marginBottom: '8px'
            }}
          >
            Quelques pistes
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {prompt.whispers.map((whisper, i) => (
              <li
                key={i}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '14px',
                  fontStyle: 'italic',
                  color: '#1A1A1A',
                  opacity: 0.6,
                  marginBottom: '6px',
                  paddingLeft: '12px',
                  borderLeft: '2px solid rgba(0, 61, 44, 0.15)'
                }}
              >
                {whisper}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error feedback */}
      {feedback?.type === 'error' && (
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '13px',
            color: '#8B0000',
            marginTop: '12px',
            fontStyle: 'italic'
          }}
        >
          {feedback.message}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            flex: 1,
            background: 'transparent',
            color: '#1A1A1A',
            border: '1px solid rgba(0, 61, 44, 0.2)',
            padding: '14px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.5 : 1
          }}
        >
          Annuler
        </button>
        <button
          onClick={onSubmit}
          disabled={saving || value.trim().length < 3}
          style={{
            flex: 2,
            background: '#003D2C',
            color: '#FAF8F2',
            border: 'none',
            padding: '14px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: saving || value.trim().length < 3 ? 'not-allowed' : 'pointer',
            opacity: saving || value.trim().length < 3 ? 0.5 : 1
          }}
        >
          {saving ? 'Gravure...' : 'Graver'}
        </button>
      </div>
    </div>
  );
}
