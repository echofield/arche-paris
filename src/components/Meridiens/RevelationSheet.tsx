/**
 * RevelationSheet — Axis Door overlay when Meridian axis-lock reaches stable resonance.
 * Minimal: label, title, voice icon, line, suggestion, Continue + optional Open in Maps.
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { useTranslation } from '../../utils/i18n';
import type { AxisDoor } from '../../data/axis-doors';

interface RevelationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  door: AxisDoor;
}

function VoiceIcon({ voice }: { voice: 'mascaron' | 'champ' }) {
  if (voice === 'mascaron') {
    return (
      <span style={{ fontSize: 24, opacity: 0.6 }} aria-hidden>
        ◉
      </span>
    );
  }
  return (
    <span style={{ fontSize: 20, opacity: 0.5 }} aria-hidden>
      ○
    </span>
  );
}

export function RevelationSheet({ isOpen, onClose, door }: RevelationSheetProps) {
  const { t, language } = useTranslation();
  const lang = language === 'fr' ? 'fr' : 'en';
  const title = door.title[lang];
  const line = door.line[lang];
  const suggestion = door.suggestion[lang];
  const mapsUrl =
    door.mapsQuery &&
    `https://www.google.com/maps/search/?api=1&query=${door.mapsQuery.lat},${door.mapsQuery.lng}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="max-h-[70vh] overflow-y-auto"
        style={{ background: '#FAF8F2', borderColor: 'rgba(0,61,44,0.15)' }}
      >
        <SheetHeader>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#6B6455',
              opacity: 0.9,
            }}
          >
            {t('meridiens.revelation.label')}
          </p>
          <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A', marginTop: 4 }}>
            {title}
          </SheetTitle>
        </SheetHeader>
        <div style={{ padding: '0 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <VoiceIcon voice={door.voice} />
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-serif)',
                fontSize: 15,
                fontStyle: 'italic',
                color: '#1A1A1A',
                opacity: 0.9,
                lineHeight: 1.55,
              }}
            >
              {line}
            </p>
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              color: '#003D2C',
              opacity: 0.85,
              lineHeight: 1.5,
            }}
          >
            {suggestion}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px 0',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#FAF8F2',
                background: '#003D2C',
                border: '1px solid rgba(0,61,44,0.4)',
                borderRadius: 6,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              {t('meridiens.revelation.continue')}
            </button>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '10px 0',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  color: '#003D2C',
                  opacity: 0.8,
                  textDecoration: 'none',
                  border: '1px solid rgba(0,61,44,0.25)',
                  borderRadius: 6,
                }}
              >
                {t('meridiens.revelation.openMaps')}
              </a>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
