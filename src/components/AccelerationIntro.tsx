/**
 * ÉTUDES — ÉCRAN D'INTRODUCTION AVANT ACCÉLÉRATION
 * 
 * Objectif : Préparer l'attention
 * Ton : Solennel, calme
 * Pas de vente, pas d'explication
 * Mise en condition uniquement
 */

interface AccelerationIntroProps {
  context: 'FORMES' | 'LANGAGES';
  onEnter: () => void;
}

const CONTEXTUAL_LINES = {
  FORMES: `Laisse l'œil reconnaître avant de nommer.`,
  LANGAGES: `Laisse le sens circuler avant d'analyser.`
};

export function AccelerationIntro({ context, onEnter }: AccelerationIntroProps) {
  return (
    <div 
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        position: 'relative'
      }}
    >
      {/* Bloc principal */}
      <div 
        style={{
          maxWidth: '600px',
          width: '100%'
        }}
      >
        {/* Texte principal */}
        <div 
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '17px',
            fontWeight: 400,
            lineHeight: 2.0,
            color: '#1A1A1A',
            opacity: 0.75,
            marginBottom: '48px',
            textAlign: 'left'
          }}
        >
          <p style={{ marginBottom: '2em' }}>
            Ce que tu vas lire n'est pas un contenu.
          </p>

          <p style={{ marginBottom: '2em' }}>
            Ce n'est pas fait pour être retenu.
            <br />
            Ce n'est pas fait pour être compris mot à mot.
          </p>

          <p style={{ marginBottom: '2em' }}>
            C'est une traversée.
          </p>

          <p style={{ marginBottom: '2em' }}>
            Le texte va s'accélérer.
            <br />
            Ton attention devra rester ouverte, sans s'accrocher.
          </p>

          <p style={{ marginBottom: '2em' }}>
            Si tu forces, tu perdras le flux.
            <br />
            Si tu lâches trop, il disparaîtra.
          </p>

          <p style={{ marginBottom: '2em' }}>
            Reste présent.
            <br />
            Laisse passer.
          </p>

          <p style={{ marginBottom: 0 }}>
            Ici, il ne s'agit pas de vitesse.
            <br />
            Il s'agit de continuité.
          </p>
        </div>

        {/* Ligne contextuelle */}
        <div 
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '19px',
            fontWeight: 400,
            lineHeight: 1.6,
            color: '#1A1A1A',
            opacity: 0.5,
            marginBottom: '64px',
            textAlign: 'left',
            fontStyle: 'italic'
          }}
        >
          {CONTEXTUAL_LINES[context]}
        </div>

        {/* Bouton Entrer */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onEnter}
            style={{
              background: 'transparent',
              border: '0.5px solid rgba(26, 26, 26, 0.2)',
              padding: '16px 64px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#1A1A1A',
              opacity: 0.5,
              cursor: 'pointer',
              transition: 'opacity 600ms cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          >
            Entrer
          </button>
        </div>
      </div>
    </div>
  );
}
