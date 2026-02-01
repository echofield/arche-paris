/**
 * Études — internal “world door” (History). Not in header; entry via map tap.
 */

import { BackButton } from './BackButton';
import { MamlukGrid } from './MamlukGrid';

interface EtudesPageProps {
  onBack: () => void;
}

export function EtudesPage({ onBack }: EtudesPageProps) {
  return (
    <div
      className="min-h-screen relative"
      style={{ background: '#FAF8F2', overflow: 'hidden' }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
      <BackButton onClick={onBack} />

      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: 'clamp(80px, 10vh, 120px) clamp(24px, 5vw, 48px) 48px',
          position: 'relative',
          zIndex: 10
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '400',
            color: '#1A1A1A',
            marginBottom: 'var(--space-xxl)',
            letterSpacing: '0.05em'
          }}
        >
          Études
        </h1>

        <section style={{ marginBottom: 'var(--space-xxl)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 'var(--space-md)'
            }}
          >
            History
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: '#1A1A1A',
              opacity: 0.85,
              lineHeight: 1.7,
              maxWidth: '560px'
            }}
          >
            A place for memory and reflection. Paris as palimpsest — layers of time, gesture, and trace.
            Content to be expanded.
          </p>
        </section>
      </div>
    </div>
  );
}
