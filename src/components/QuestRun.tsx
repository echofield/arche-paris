/**
 * ARCHÉ — Quest Run
 * Manual steps, optional QR/photo proof, oracle whispers. No GPS, no metrics.
 */

import { useState, useEffect, useCallback } from 'react';
import { BackButton } from './BackButton';
import { getQuestById } from '../data/quests';
import { getOracleLine } from '../data/oracle';
import { addQuestTrace, addOrUpdateQuestTraceV1 } from '../utils/trace-service';
import { getTodayKey, addQuestWalk, getTodaySummary, parseApproxKmFromDistance } from '../utils/walk-service';
import { bump } from '../utils/companion-service';
import { appendWalkToJournal } from '../utils/journal-sync';
import { getStoredCard } from '../utils/card-service';
import type { QuestThreadTrace, QuestStopStamp } from '../types/traces';

const RUNS_KEY = 'arche_quest_runs';

export interface ProofByStop {
  qrValue?: string;
  photoBase64?: string;
  hash?: string;
}

export interface QuestRunState {
  startedAt: string;
  currentIndex: number;
  proofsByStop: Record<string, ProofByStop>;
  closedAt?: string;
}

function loadRuns(): Record<string, QuestRunState> {
  try {
    const raw = localStorage.getItem(RUNS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveRun(questId: string, state: QuestRunState): void {
  const runs = loadRuns();
  runs[questId] = state;
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
}

async function hashString(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  }
  let h = 0;
  for (let i = 0; i < input.length; i++) h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).slice(0, 16);
}

interface QuestRunProps {
  questId: string;
  cardId: string | null;
  onBack: () => void;
  onClose: () => void;
}

export function QuestRun({ questId, cardId, onBack, onClose }: QuestRunProps) {
  const quest = getQuestById(questId);
  const [run, setRun] = useState<QuestRunState | null>(null);
  const [oracleLine, setOracleLine] = useState<string>('');
  const [proofQr, setProofQr] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [showProof, setShowProof] = useState(false);
  const [closeTodayKm, setCloseTodayKm] = useState<number | null>(null);

  const persistRun = useCallback(
    (state: QuestRunState) => {
      setRun(state);
      saveRun(questId, state);
    },
    [questId]
  );

  useEffect(() => {
    if (!quest) return;
    const runs = loadRuns();
    const existing = runs[questId];
    if (existing && !existing.closedAt) {
      setRun(existing);
      setOracleLine('');
      return;
    }
    const fresh: QuestRunState = {
      startedAt: new Date().toISOString(),
      currentIndex: 0,
      proofsByStop: {}
    };
    persistRun(fresh);
    setOracleLine(getOracleLine(questId, 'start'));
  }, [quest?.id, questId, persistRun]);

  const showOracle = (line: string) => {
    setOracleLine(line);
  };

  const currentStop = quest && run ? quest.nodes[run.currentIndex] : null;
  const isLastStop = quest && run && run.currentIndex >= quest.nodes.length - 1;
  const isClosed = run?.closedAt;

  const handleImHere = () => {
    if (!quest || !run) return;
    const stop = quest.nodes[run.currentIndex];
    showOracle(getOracleLine(questId, 'arrive_stop', stop.id));
    setShowProof(true);
  };

  const handleContinue = () => {
    if (!quest || !run) return;
    setShowProof(false);
    setProofQr('');
    setProofPhoto(null);
    if (run.currentIndex >= quest.nodes.length - 1) {
      handleClose();
      return;
    }
    persistRun({
      ...run,
      currentIndex: run.currentIndex + 1
    });
  };

  const handleAddProof = async () => {
    if (!run || !currentStop) return;
    const input = proofQr.trim() || proofPhoto || currentStop.id + run.startedAt;
    const hash = await hashString(input);
    const nextProofs = {
      ...run.proofsByStop,
      [currentStop.id]: {
        qrValue: proofQr.trim() || undefined,
        photoBase64: proofPhoto || undefined,
        hash
      }
    };
    persistRun({ ...run, proofsByStop: nextProofs });
    showOracle(getOracleLine(questId, 'proof_added'));
  };

  const handleClose = async () => {
    if (!quest || !run) return;
    const closedAt = new Date().toISOString();
    persistRun({ ...run, closedAt, currentIndex: quest.nodes.length });

    addQuestTrace({
      kind: 'quest_walk',
      questId: quest.id,
      title: quest.title,
      closedAt,
      stops: quest.nodes.map((n) => ({ stopId: n.id, label: n.name }))
    });

    const approxKm = quest.approxKm ?? parseApproxKmFromDistance(quest.distance);
    addQuestWalk(getTodayKey(), quest.title, quest.id, approxKm);

    const stamps: QuestStopStamp[] = quest.nodes
      .filter((n) => run!.proofsByStop[n.id])
      .map((n) => ({
        stopId: n.id,
        label: n.name,
        at: closedAt,
        oracleLine: getOracleLine(questId, 'arrive_stop', n.id) || undefined
      }));
    const traceId = `thread-${questId}-${run.startedAt}`;
    const v1Trace: QuestThreadTrace = {
      kind: 'quest_thread',
      traceId,
      questId: quest.id,
      title: quest.title,
      createdAt: run.startedAt,
      closedAt,
      approxKm,
      stamps
    };
    addOrUpdateQuestTraceV1(v1Trace);
    bump('quest_closed');

    const cid = cardId ?? getStoredCard();
    if (cid) {
      try {
        const line = `${quest.title} — completed (${new Date().toLocaleDateString()})`;
        await appendWalkToJournal(cid, line);
      } catch {
        // journal-sync missing or failed: local trace only
      }
    }

    setCloseTodayKm(getTodaySummary().approxKm);
    showOracle(getOracleLine(questId, 'close'));
    setTimeout(() => onClose(), 1200);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (!quest) {
    return (
      <div style={{ padding: 24 }}>
        <BackButton onClick={onBack} />
        <p style={{ marginTop: 64, color: '#6B6455' }}>Quest not found.</p>
      </div>
    );
  }

  if (isClosed) {
    return null;
  }

  return (
    <div style={{ padding: 24, paddingTop: 72, maxWidth: 420, margin: '0 auto' }}>
      <BackButton onClick={onBack} />

      <h1
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          fontWeight: 400,
          color: '#003D2C',
          marginBottom: 4
        }}
      >
        {quest.title}
      </h1>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#6B6455', marginBottom: 24 }}>
        {quest.subtitle}
      </p>

      {oracleLine && (
        <>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: '#003D2C',
              opacity: 0.85,
              fontStyle: 'italic',
              marginBottom: closeTodayKm != null ? 8 : 20
            }}
          >
            {oracleLine}
          </p>
          {closeTodayKm != null && (
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: '#003D2C',
                opacity: 0.6,
                marginBottom: 20
              }}
            >
              Today: ~{closeTodayKm.toFixed(1)} km
            </p>
          )}
        </>
      )}

      {currentStop && (
        <div
          style={{
            border: '1px solid rgba(0,61,44,0.12)',
            borderRadius: 4,
            padding: 16,
            marginBottom: 16
          }}
        >
          <div style={{ fontSize: 12, color: '#6B6455', marginBottom: 4 }}>
            Stop {run!.currentIndex + 1} of {quest.nodes.length}
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#1A1A1A' }}>
            {currentStop.name}
          </div>
          <div style={{ fontSize: 12, color: '#6B6455', marginTop: 4 }}>{currentStop.address}</div>

          {!showProof ? (
            <button
              type="button"
              onClick={handleImHere}
              style={{
                marginTop: 16,
                padding: '10px 20px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#003D2C',
                background: 'transparent',
                border: '1px solid rgba(0,61,44,0.3)',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              I'm here
            </button>
          ) : (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: '#6B6455', marginBottom: 8 }}>Add proof (optional)</div>
              <input
                type="text"
                placeholder="Paste QR value or skip"
                value={proofQr}
                onChange={(e) => setProofQr(e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  marginBottom: 8,
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13,
                  border: '1px solid rgba(0,61,44,0.2)',
                  borderRadius: 4
                }}
              />
              <label style={{ display: 'block', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#6B6455', marginRight: 8 }}>Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ fontSize: 12 }} />
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleAddProof}
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    background: 'transparent',
                    border: '1px solid rgba(0,61,44,0.3)',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Record proof
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  style={{
                    padding: '8px 16px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#003D2C',
                    opacity: 0.8,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Skip proof
                </button>
              </div>
            </div>
          )}

          {showProof && (run?.proofsByStop[currentStop.id]?.hash || proofQr || proofPhoto) && (
            <button
              type="button"
              onClick={isLastStop ? handleClose : handleContinue}
              style={{
                marginTop: 16,
                padding: '10px 20px',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#003D2C',
                background: 'rgba(0,61,44,0.08)',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {isLastStop ? 'Close quest' : 'Continue'}
            </button>
          )}
        </div>
      )}

      {quest.gmapsDirectionsUrl && (
        <a
          href={quest.gmapsDirectionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: '#003D2C',
            opacity: 0.8
          }}
        >
          Open in Maps →
        </a>
      )}
    </div>
  );
}
