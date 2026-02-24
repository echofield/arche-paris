import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { useTranslation } from '../../utils/i18n';

export interface PlaceDetail {
  id: string;
  name: string;
  description: string;
  arrondissement: number | string;
  weight?: number;
  coordinates?: { lat: number; lng: number };
  /** Optional; when present shown as activation mode (e.g. movement / alignment / arrival). */
  activationMode?: string;
}

interface PlaceDetailSheetProps {
  place: PlaceDetail | null;
  onClose: () => void;
  titleLabel: string;
  approachLabel: string;
  instrumentsLabel: string;
  weightLabel: string;
  arrondissementLabel: string;
  openInMapsLabel: string;
  /** When set, show "Laisser une trace ici" and call this when clicked (then onClose). */
  onLeaveTrace?: () => void;
  leaveTraceLabel?: string;
  /** Optional subtitle under the title (e.g. "Détails, carte, sceller, instruments, trace."). */
  moreLeadsTo?: string;
}

export function PlaceDetailSheet({
  place,
  onClose,
  titleLabel,
  approachLabel,
  instrumentsLabel,
  weightLabel,
  arrondissementLabel,
  openInMapsLabel,
  onLeaveTrace,
  leaveTraceLabel,
  moreLeadsTo,
}: PlaceDetailSheetProps) {
  const { t } = useTranslation();
  const activationLabel =
    place?.activationMode &&
    ['movement', 'alignment', 'arrival'].includes(place.activationMode)
      ? t(`axes.activation.${place.activationMode}`)
      : place?.activationMode;

  return (
    <Sheet open={place !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        className="max-h-[70vh] overflow-y-auto"
        style={{ background: '#FAF8F2', borderColor: 'rgba(0,61,44,0.15)' }}
      >
        <SheetHeader>
          <SheetTitle style={{ fontFamily: 'var(--font-serif)', color: '#1A1A1A' }}>
            {place?.name ?? titleLabel}
          </SheetTitle>
          {place && moreLeadsTo && (
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455', opacity: 0.7 }}>
              {moreLeadsTo}
            </p>
          )}
        </SheetHeader>
        {place && (
          <div style={{ padding: '0 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{
              margin: 0, fontFamily: 'var(--font-serif)',
              fontSize: 14, fontStyle: 'italic',
              color: '#1A1A1A', opacity: 0.75, lineHeight: 1.6,
            }}>
              {place.description}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              {place.weight != null && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                  {weightLabel}: {place.weight}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                {arrondissementLabel}: {place.arrondissement}
              </span>
              {activationLabel && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                  {activationLabel}
                </span>
              )}
            </div>

            {place.coordinates && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: 11,
                  letterSpacing: '0.06em', color: '#003D2C', opacity: 0.7,
                  textDecoration: 'none', marginTop: 2,
                }}
              >
                {openInMapsLabel}
              </a>
            )}

            <button
              type="button"
              onClick={() => { window.location.hash = 'collection'; onClose(); }}
              style={{
                marginTop: 4, width: '100%', padding: '12px 0',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#FAF8F2', background: '#003D2C',
                border: '1px solid rgba(0,61,44,0.4)',
                borderRadius: 6, cursor: 'pointer', minHeight: 44,
              }}
            >
              {approachLabel}
            </button>
            <button
              type="button"
              onClick={() => { window.location.hash = 'instruments'; onClose(); }}
              style={{
                width: '100%', padding: '10px 0',
                fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 400,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#003D2C', background: 'transparent',
                border: '1px solid rgba(0,61,44,0.14)',
                borderRadius: 6, cursor: 'pointer',
              }}
            >
              {instrumentsLabel}
            </button>

            {onLeaveTrace && leaveTraceLabel && (
              <button
                type="button"
                onClick={() => { onLeaveTrace(); onClose(); }}
                style={{
                  width: '100%', padding: '10px 0',
                  fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 400,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: '#003D2C', background: 'transparent',
                  border: '1px solid rgba(0,61,44,0.2)',
                  borderRadius: 6, cursor: 'pointer',
                }}
              >
                {leaveTraceLabel}
              </button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
