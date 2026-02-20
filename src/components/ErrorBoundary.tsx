import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Unhandled render error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#FAF8F2',
            color: '#1A1A1A',
            textAlign: 'center',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 28,
                fontWeight: 400,
                marginBottom: 12,
              }}
            >
              ARCHÉ
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                marginBottom: 16,
                opacity: 0.75,
              }}
            >
              Une erreur inattendue est survenue.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: '1px solid #003D2C',
                background: 'transparent',
                color: '#003D2C',
                padding: '10px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
