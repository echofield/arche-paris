/**
 * ZoneTestPanel — v0.1 GPS Validation Test Interface
 * Access via #zone-test hash route
 */

import { useState } from 'react';
import { useZoneEntry } from '../hooks/useZoneEntry';
import { ZoneEntryFeedback } from './ZoneEntryFeedback';
import { BackButton } from './BackButton';
import { MamlukGrid } from './MamlukGrid';

interface TestZone {
  id: string;
  name: string;
  description: string;
  center: { lat: number; lng: number };
  size: string;
}

const TEST_ZONES: TestZone[] = [
  {
    id: 'PAR-ZERO',
    name: 'Point Zéro',
    description: 'Parvis Notre-Dame (~40m)',
    center: { lat: 48.8534, lng: 2.3488 },
    size: '~40m',
  },
  {
    id: 'PAR-SULPICE-EXT',
    name: 'Saint-Sulpice (ext)',
    description: 'Church entrance steps (~60m)',
    center: { lat: 48.8510, lng: 2.3347 },
    size: '~60m',
  },
  {
    id: 'PAR-SULPICE-INT',
    name: 'Saint-Sulpice (int)',
    description: 'Inside near gnomon (~40m)',
    center: { lat: 48.8510, lng: 2.3352 },
    size: '~40m',
  },
  {
    id: 'PAR-PANORAMAS',
    name: 'Passage Panoramas',
    description: 'Passage entrance (~30m)',
    center: { lat: 48.8711, lng: 2.3417 },
    size: '~30m',
  },
  {
    id: 'PAR-REAUMUR-WEST',
    name: 'Réaumur West',
    description: '2e side of Sébastopol (~50m)',
    center: { lat: 48.8669, lng: 2.3526 },
    size: '~50m',
  },
  {
    id: 'PAR-REAUMUR-EAST',
    name: 'Réaumur East',
    description: '3e side of Sébastopol (~50m)',
    center: { lat: 48.8669, lng: 2.3543 },
    size: '~50m',
  },
];

// Also include arrondissements for broad testing
const ARRONDISSEMENT_ZONES = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `PAR-${n.toString().padStart(2, '0')}`,
  name: `${n}e arrondissement`,
  description: 'Full arrondissement bbox',
  center: { lat: 48.86, lng: 2.35 },
  size: '~1km+',
}));

export function ZoneTestPanel({ onBack }: { onBack: () => void }) {
  const zoneEntry = useZoneEntry();
  const [testLog, setTestLog] = useState<Array<{
    ts: string;
    zone: string;
    result: string;
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
  }>>([]);

  const handleTest = async (zoneId: string) => {
    const success = await zoneEntry.enterZone(zoneId);

    // Log result
    setTestLog((prev) => [
      {
        ts: new Date().toLocaleTimeString(),
        zone: zoneId,
        result: success ? 'ACCEPTED' : (zoneEntry.error?.code || 'FAILED'),
        lat: zoneEntry.gpsData.lat,
        lng: zoneEntry.gpsData.lng,
        accuracy: zoneEntry.gpsData.accuracy_m,
      },
      ...prev,
    ].slice(0, 20));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF8F2',
        position: 'relative',
        overflow: 'auto',
      }}
    >
      <MamlukGrid pattern="star8" opacity={0.02} scale={1.5} rotation={0} layers={2} />
      <BackButton onClick={onBack} />

      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '80px 24px 48px',
        }}
      >
        <header style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 28,
              color: '#1A1A1A',
              marginBottom: 8,
            }}
          >
            Zone Test Panel
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              color: '#6B6455',
            }}
          >
            v0.1 GPS Validation Tests
          </p>
        </header>

        {/* Test Zones */}
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            Anchor Zones (tight)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TEST_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleTest(zone.id)}
                disabled={zoneEntry.status !== 'idle'}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#FFF',
                  border: '1px solid rgba(0,61,44,0.15)',
                  borderRadius: 6,
                  cursor: zoneEntry.status === 'idle' ? 'pointer' : 'not-allowed',
                  opacity: zoneEntry.status === 'idle' ? 1 : 0.5,
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 14,
                      color: '#1A1A1A',
                    }}
                  >
                    {zone.name}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                      color: '#8E8982',
                    }}
                  >
                    {zone.description}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 10,
                    color: '#003D2C',
                    opacity: 0.6,
                  }}
                >
                  {zone.size}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Arrondissement Zones */}
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            Arrondissements (broad)
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ARRONDISSEMENT_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleTest(zone.id)}
                disabled={zoneEntry.status !== 'idle'}
                style={{
                  padding: '8px 14px',
                  background: '#FFF',
                  border: '1px solid rgba(0,61,44,0.15)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: '#1A1A1A',
                  cursor: zoneEntry.status === 'idle' ? 'pointer' : 'not-allowed',
                  opacity: zoneEntry.status === 'idle' ? 1 : 0.5,
                }}
              >
                {zone.name}
              </button>
            ))}
          </div>
        </section>

        {/* Test Log */}
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            Test Log
          </h2>
          {testLog.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: '#8E8982',
                fontStyle: 'italic',
              }}
            >
              No tests yet. Tap a zone to begin.
            </p>
          ) : (
            <div
              style={{
                background: '#FFF',
                border: '1px solid rgba(0,61,44,0.1)',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {testLog.map((log, i) => (
                <div
                  key={`${log.ts}-${i}`}
                  style={{
                    padding: '10px 14px',
                    borderBottom: i < testLog.length - 1 ? '1px solid rgba(0,61,44,0.06)' : 'none',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 11,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#8E8982' }}>{log.ts}</span>
                    <span
                      style={{
                        color: log.result === 'ACCEPTED' ? '#007850' : '#B43232',
                        fontWeight: 500,
                      }}
                    >
                      {log.result}
                    </span>
                  </div>
                  <div style={{ color: '#003D2C' }}>{log.zone}</div>
                  {log.lat !== null && (
                    <div style={{ color: '#8E8982', fontSize: 10 }}>
                      {log.lat?.toFixed(6)}, {log.lng?.toFixed(6)} ±{log.accuracy?.toFixed(0)}m
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {testLog.length > 0 && (
            <button
              type="button"
              onClick={() => setTestLog([])}
              style={{
                marginTop: 12,
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                color: '#8E8982',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Clear log
            </button>
          )}
        </section>

        {/* Protocol reminder */}
        <footer
          style={{
            marginTop: 40,
            padding: '16px',
            background: 'rgba(0,61,44,0.04)',
            borderRadius: 6,
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#003D2C',
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            Test Protocol
          </h3>
          <ul
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              color: '#6B6455',
              paddingLeft: 16,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            <li>Inside zone + good GPS → ACCEPTED</li>
            <li>Outside zone → OUTSIDE_ZONE</li>
            <li>Bad accuracy (&gt;50m) → ACCURACY_TOO_LOW</li>
            <li>GPS off/denied → GPS_FAILED</li>
          </ul>
        </footer>
      </div>

      {/* Zone entry feedback overlay */}
      <ZoneEntryFeedback
        status={zoneEntry.status}
        error={zoneEntry.error}
        zoneId={zoneEntry.lastAttemptZoneId}
        gpsData={zoneEntry.gpsData}
        onClose={zoneEntry.reset}
      />
    </div>
  );
}
