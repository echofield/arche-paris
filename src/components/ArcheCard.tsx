import type { ArcheCardData, Language } from '../shared/types';

interface ArcheCardProps {
  card: ArcheCardData;
  lang: Language;
}

/**
 * ArcheCard
 *
 * Renders a single card as parchment discovered.
 * No CTA. No modal chrome. Presence only.
 */
export function ArcheCard({ card, lang }: ArcheCardProps) {
  const title = card.name[lang];
  const lines = card.body[lang];

  return (
    <article
      style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        padding: 'var(--space-xl) var(--space-lg)',
        background: 'var(--paper)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      {/* Weight line */}
      <div
        style={{
          width: '32px',
          height: '0.5px',
          background: 'var(--ink)',
          opacity: 0.2,
          marginBottom: 'var(--space-lg)',
        }}
        aria-hidden="true"
      />

      {/* Title */}
      <h2
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.75rem',
          fontWeight: 400,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          textAlign: 'center',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {title}
      </h2>

      {/* Body lines */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
          textAlign: 'center',
        }}
      >
        {lines.map((line, index) =>
          line === '' ? (
            <div key={index} style={{ height: 'var(--space-md)' }} />
          ) : (
            <p
              key={index}
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.125rem',
                fontStyle: 'italic',
                fontWeight: 300,
                lineHeight: 1.7,
                color: 'var(--ink)',
                opacity: 0.8,
                letterSpacing: '0.02em',
                margin: 0,
              }}
            >
              {line}
            </p>
          )
        )}
      </div>

      {/* Weight line */}
      <div
        style={{
          width: '32px',
          height: '0.5px',
          background: 'var(--ink)',
          opacity: 0.2,
          marginTop: 'var(--space-xl)',
        }}
        aria-hidden="true"
      />

      {/* Subtle metadata */}
      <span
        style={{
          marginTop: 'var(--space-md)',
          fontFamily: 'var(--font-serif)',
          fontSize: '0.625rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'var(--ink)',
          opacity: 0.25,
        }}
        aria-hidden="true"
      >
        ARCHE
      </span>
    </article>
  );
}
