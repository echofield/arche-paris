/**
 * ARCHÉ — List of church / on-site quests (Lieux).
 */

import { BackButton } from './BackButton';
import { useTranslation } from '../utils/i18n';
import { CHURCH_QUESTS } from '../data/church-quests';

interface ChurchQuestsListProps {
  onBack: () => void;
  onSelectQuest: (questId: string) => void;
}

const SERIF = 'var(--font-serif)';
const SANS = 'var(--font-sans)';

export function ChurchQuestsList({ onBack, onSelectQuest }: ChurchQuestsListProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        padding: 'clamp(24px, 5vw, 48px)',
        boxSizing: 'border-box',
      }}
    >
      <BackButton onClick={onBack} />
      <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(24px, 5vw, 32px)', color: '#1A1A1A', marginBottom: 8 }}>
        {t('church.lieuxTitle')}
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 14, color: '#003D2C', opacity: 0.7, marginBottom: 24 }}>
        {t('church.lieuxIntro')}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CHURCH_QUESTS.map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => onSelectQuest(q.id)}
            style={{
              fontFamily: SERIF,
              fontSize: 18,
              padding: '18px 20px',
              background: 'transparent',
              border: '1px solid rgba(0,61,44,0.25)',
              borderRadius: 4,
              color: '#003D2C',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'block', marginBottom: 4 }}>{q.title}</span>
            <span style={{ fontFamily: SANS, fontSize: 13, opacity: 0.8 }}>{q.place_name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
