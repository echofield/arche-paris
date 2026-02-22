import { useState, useEffect } from 'react';
import { BookOpen, Feather, Download } from 'lucide-react';
import { MamlukGrid } from './MamlukGrid';
import { BackButton } from './BackButton';
import { formatDateDisplay } from '../utils/codex-helpers';
import { loadJournalEntries, appendJournalEntry, getOfflineMessage, CardGateOfflineError } from '../utils/card-gate-client';
import { useSyncState, COMPRESSED_MESSAGE } from '../contexts/SyncStateContext';
import { WALK_PLACE_ID } from '../utils/journal-sync';
import { getReflectiveQuestion } from '../data/oracle';

interface CarnetParisienProps {
  cardId: string | null;
  onBack: () => void;
}

interface Souvenir {
  id: string;
  text: string;
  timestamp: Date;
  lieu?: string;
}

export function CarnetParisien({ cardId, onBack }: CarnetParisienProps) {
  const [souvenirs, setSouvenirs] = useState<Souvenir[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [currentLieu, setCurrentLieu] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { pendingCount, isSyncing, showCompressedMessage, flushNow } = useSyncState();

  // Charger les souvenirs depuis vault API au montage
  useEffect(() => {
    if (cardId) loadSouvenirs();
  }, [cardId]);

  // Quand la page redevient visible, tenter de vider la file des écritures en attente
  useEffect(() => {
    if (!cardId) return;
    const onFocus = () => {
      if (pendingCount === 0) return;
      flushNow(cardId).then((sent) => {
        if (sent > 0) loadSouvenirs();
      });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [cardId, pendingCount, flushNow]);

  // Retry pending writes every 60s while there are pending items (resilience)
  useEffect(() => {
    if (!cardId || pendingCount === 0) return;
    const t = setInterval(() => {
      flushNow(cardId).then((sent) => {
        if (sent > 0) loadSouvenirs();
      });
    }, 60000);
    return () => clearInterval(t);
  }, [cardId, pendingCount, flushNow]);

  const loadSouvenirs = async () => {
    if (!cardId) return;
    setIsLoading(true);
    setLoadError(false);
    try {
      const entries = await loadJournalEntries(cardId);
      const converted: Souvenir[] = entries.map((entry) => ({
        id: entry.id,
        text: entry.content,
        timestamp: new Date(entry.created_at),
        lieu: entry.place_id || undefined,
      }));
      setSouvenirs(converted);
    } catch (error) {
      console.error('Erreur lors du chargement du carnet (Card Gate):', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSouvenir = async () => {
    if (!cardId || !currentText.trim()) return;

    // Optimistic UI update - ajouter immédiatement
    const tempSouvenir: Souvenir = {
      id: `temp-${Date.now()}`,
      text: currentText,
      timestamp: new Date(),
      lieu: currentLieu || undefined
    };

    setSouvenirs([tempSouvenir, ...souvenirs]);
    const textToSave = currentText;
    const lieuToSave = currentLieu;
    setCurrentText('');
    setCurrentLieu('');

    try {
      await appendJournalEntry(cardId, lieuToSave || '', textToSave);
      setSouvenirs(prev =>
        prev.map(s =>
          s.id === tempSouvenir.id ? { ...tempSouvenir, id: `local-${Date.now()}` } : s
        )
      );
      loadSouvenirs();
    } catch (error) {
      if (error instanceof CardGateOfflineError || (error as { code?: string })?.code === 'CARD_GATE_OFFLINE') {
        // pendingCount updates via SyncState subscription
      }
      console.error('Erreur lors de la sauvegarde (Card Gate):', error);
      loadSouvenirs();
    }
  };

  // Auto-save when user pauses typing
  const handleTextChange = (text: string) => {
    setCurrentText(text);
  };

  // Export PDF via window.print()
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div 
      className="min-h-screen relative carnet-container"
      style={{ 
        background: '#F5F3ED',
        overflow: 'auto'
      }}
    >
      {/* Ghost Grid Mamluk - Pattern étoile 8 avec très faible opacité */}
      <MamlukGrid pattern="star8" opacity={0.015} scale={1.5} rotation={45} layers={1} />
      
      {/* Notebook lines background */}
      <div 
        className="notebook-lines"
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #D4CFC5 31px, #D4CFC5 32px)',
          backgroundSize: '100% 32px',
          backgroundPosition: '0 140px'
        }}
      />

      {/* Left margin line */}
      <div 
        className="margin-line"
        style={{
          position: 'fixed',
          left: '120px',
          top: 0,
          bottom: 0,
          width: '1px',
          background: '#E8A5A5',
          opacity: 0.3,
          zIndex: 0
        }}
      />

      {/* Back button */}
      <div className="no-print">
        <BackButton onClick={onBack} />
      </div>

      {/* Offline: traces gardées, graveront au retour du réseau */}
      {cardId && pendingCount > 0 && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '90vw',
            padding: '12px 20px',
            background: 'rgba(0, 61, 44, 0.95)',
            color: '#F5F3ED',
            borderRadius: '4px',
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            textAlign: 'center',
            zIndex: 90,
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}
        >
          {getOfflineMessage()}
          <span style={{ display: 'block', marginTop: '4px', opacity: 0.9 }}>
            {pendingCount} en attente
          </span>
          {showCompressedMessage && (
            <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', opacity: 0.9 }}>
              {COMPRESSED_MESSAGE}
            </span>
          )}
          <button
            type="button"
            disabled={isSyncing || !cardId}
            onClick={() => {
              if (cardId) {
                flushNow(cardId).then((sent) => {
                  if (sent > 0) loadSouvenirs();
                });
              }
            }}
            style={{
              marginTop: '8px',
              padding: '6px 14px',
              border: '1px solid #F5F3ED',
              borderRadius: '4px',
              background: 'transparent',
              color: '#F5F3ED',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              cursor: isSyncing ? 'wait' : 'pointer',
              opacity: isSyncing ? 0.7 : 1,
            }}
          >
            {isSyncing ? '…' : 'Réessayer'}
          </button>
        </div>
      )}

      {/* Export PDF button */}
      <button
        onClick={handleExportPDF}
        className="no-print"
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'transparent',
          border: '1px solid #003D2C',
          borderRadius: '2px',
          padding: '10px 18px',
          cursor: 'pointer',
          transition: 'all var(--transition)',
          zIndex: 100,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#003D2C',
          opacity: 0.4
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#003D2C';
          e.currentTarget.style.color = '#F5F3ED';
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#003D2C';
          e.currentTarget.style.opacity = '0.4';
        }}
      >
        <Download size={12} strokeWidth={1.5} />
        Exporter PDF
      </button>

      {/* Main notebook page */}
      <div 
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '80px 60px 120px 140px',
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh'
        }}
      >
        {/* Header */}
        <header 
          style={{
            marginBottom: '48px',
            paddingBottom: '24px'
          }}
        >
          <div style={{ marginBottom: '12px', opacity: 0.25 }}>
            <BookOpen size={24} strokeWidth={1} color="#003D2C" />
          </div>
          <h1 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '38px',
              fontWeight: '400',
              letterSpacing: '-0.01em',
              color: '#1A1A1A',
              marginBottom: '8px',
              lineHeight: '1.2'
            }}
          >
            Carnet Parisien
          </h1>
          <p 
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.4,
              letterSpacing: '0.01em'
            }}
          >
            Votre archive intime de Paris
          </p>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '13px',
              fontStyle: 'italic',
              color: '#003D2C',
              opacity: 0.5,
              marginTop: '12px'
            }}
          >
            {getReflectiveQuestion()}
          </p>
        </header>

        {/* Compact add button */}
        <button
          onClick={() => {
            const textarea = document.getElementById('souvenir-textarea') as HTMLTextAreaElement;
            if (textarea) textarea.focus();
          }}
          style={{
            background: 'transparent',
            border: '1px solid #003D2C',
            borderRadius: '2px',
            padding: '10px 20px',
            cursor: 'pointer',
            transition: 'all var(--transition)',
            marginBottom: '32px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#003D2C',
            opacity: 0.6
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#003D2C';
            e.currentTarget.style.color = '#F5F3ED';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#003D2C';
            e.currentTarget.style.opacity = '0.6';
          }}
        >
          <Feather size={14} strokeWidth={1.5} />
          Ajouter un Souvenir
        </button>

        {/* Current writing area (always visible like a real notebook) */}
        <div style={{ marginBottom: '64px' }}>
          {/* Lieu input */}
          <input
            type="text"
            value={currentLieu}
            onChange={(e) => setCurrentLieu(e.target.value)}
            placeholder="Lieu..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px dotted #D4CFC5',
              padding: '8px 0',
              marginBottom: '16px',
              fontFamily: 'var(--font-serif)',
              fontSize: '13px',
              color: '#003D2C',
              outline: 'none',
              opacity: currentLieu ? 1 : 0.4
            }}
          />

          {/* Main text area */}
          <textarea
            id="souvenir-textarea"
            value={currentText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Écrire un souvenir..."
            rows={6}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '0',
              fontFamily: 'var(--font-serif)',
              fontSize: '16px',
              fontStyle: 'italic',
              lineHeight: '32px', // Aligns with background lines
              color: '#1A1A1A',
              outline: 'none',
              resize: 'none',
              opacity: currentText ? 1 : 0.3
            }}
          />

          {/* Save button (only shows when text exists) */}
          {currentText.trim() && (
            <button
              onClick={handleSaveSouvenir}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 0',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '10px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.5,
                transition: 'opacity var(--transition)',
                marginTop: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
            >
              → Conserver
            </button>
          )}
        </div>

        {/* Divider */}
        {souvenirs.length > 0 && (
          <div 
            style={{
              height: '1px',
              background: 'repeating-linear-gradient(to right, #D4CFC5 0, #D4CFC5 4px, transparent 4px, transparent 8px)',
              marginBottom: '64px',
              opacity: 0.5
            }}
          />
        )}

        {/* Saved souvenirs */}
        {!cardId ? (
          <div
            style={{
              textAlign: 'left',
              padding: '32px 0',
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.35,
              lineHeight: '32px'
            }}
          >
            Activez votre carte pour écrire.
            <button
              type="button"
              onClick={onBack}
              style={{
                display: 'block',
                marginTop: '16px',
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.6,
                cursor: 'pointer',
              }}
            >
              Retour
            </button>
          </div>
        ) : isLoading ? (
          <div
            style={{
              textAlign: 'left',
              padding: '32px 0',
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.25,
              lineHeight: '32px'
            }}
          >
            Chargement...
          </div>
        ) : loadError ? (
          <div
            style={{
              textAlign: 'left',
              padding: '32px 0',
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.35,
              lineHeight: '32px'
            }}
          >
            Le carnet est inaccessible.
            <button
              type="button"
              onClick={() => loadSouvenirs()}
              style={{
                display: 'block',
                marginTop: '16px',
                background: 'transparent',
                border: 'none',
                padding: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#003D2C',
                opacity: 0.6,
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
          </div>
        ) : souvenirs.length === 0 ? (
          <div
            style={{
              textAlign: 'left',
              padding: '32px 0',
              fontFamily: 'var(--font-serif)',
              fontSize: '14px',
              fontStyle: 'italic',
              color: '#1A1A1A',
              opacity: 0.35,
              lineHeight: '32px'
            }}
          >
            Rien n'est écrit encore.
          </div>
        ) : (
          <div>
            {souvenirs.map((souvenir, index) => (
              <div
                key={souvenir.id}
                style={{
                  marginBottom: '48px',
                  paddingBottom: '48px',
                  borderBottom: index < souvenirs.length - 1 ? '1px dotted rgba(0, 61, 44, 0.15)' : 'none',
                  animation: 'fadeIn 0.6s ease-out',
                  animationFillMode: 'both',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                {/* Timestamp and location */}
                <div style={{ marginBottom: '16px' }}>
                  <div 
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '9px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#003D2C',
                      marginBottom: '6px',
                      opacity: 0.4
                    }}
                  >
                    {formatDateDisplay(souvenir.timestamp)}
                  </div>
                  {souvenir.lieu && (
                    <div 
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '10px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#003D2C',
                        opacity: 0.5,
                        marginBottom: '12px'
                      }}
                    >
                      {souvenir.lieu === WALK_PLACE_ID ? 'Walk' : souvenir.lieu}
                    </div>
                  )}
                </div>

                {/* Souvenir text */}
                <p 
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '16px',
                    fontStyle: 'italic',
                    lineHeight: '32px',
                    color: '#1A1A1A',
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {souvenir.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}