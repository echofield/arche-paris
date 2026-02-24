import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';

export interface PlaceDetail {
  id: string;
  name: string;
  description: string;
  arrondissement: number | string;
  weight?: number;
  coordinates?: { lat: number; lng: number };
}

interface PlaceDetailSheetProps {
  place: PlaceDetail | null;
  onClose: () => void;
  titleLabel: string;
  approachLabel: string;
  weightLabel: string;
  arrondissementLabel: string;
}

export function PlaceDetailSheet({
  place,
  onClose,
  titleLabel,
  approachLabel,
  weightLabel,
  arrondissementLabel,
}: PlaceDetailSheetProps) {
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

            <div style={{ display: 'flex', gap: 16 }}>
              {place.weight != null && (
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                  {weightLabel}: {place.weight}
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B6455' }}>
                {arrondissementLabel}: {place.arrondissement}
              </span>
            </div>

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
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
