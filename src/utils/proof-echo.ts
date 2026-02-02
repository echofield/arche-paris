/**
 * ARCHÉ — Delayed Resonance: 24–48h after proof, insert Carnet line and mark echoed.
 * Idempotent. No notification.
 */

const PROOF_REQUESTS_KEY = 'arche_proof_requests_v1';
const PROOF_ECHOED_KEY = 'arche_proof_echoed_v1';

const ECHO_DELAY_MS = 24 * 60 * 60 * 1000; // 24h
const ECHO_WINDOW_MS = 48 * 60 * 60 * 1000; // 24–48h window (or any time after 24h)

interface ProofRequest {
  artifactId: string;
  at: string;
  cardIdShort?: string;
}

function loadProofRequests(): ProofRequest[] {
  try {
    const raw = localStorage.getItem(PROOF_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadEchoed(): string[] {
  try {
    const raw = localStorage.getItem(PROOF_ECHOED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function markEchoed(artifactId: string, at: string): void {
  const key = `${artifactId}_${at}`;
  const list = loadEchoed();
  if (list.includes(key)) return;
  try {
    localStorage.setItem(PROOF_ECHOED_KEY, JSON.stringify([...list, key]));
  } catch (e) {
    console.warn('proof-echo: mark echoed failed', e);
  }
}

export function getProofsEchoed(): string[] {
  return loadEchoed();
}

/** Proof is in 24–48h window and not yet echoed. */
export function getProofsReadyToEcho(): ProofRequest[] {
  const requests = loadProofRequests();
  const echoed = loadEchoed();
  const now = Date.now();
  return requests.filter((req) => {
    const at = new Date(req.at).getTime();
    const age = now - at;
    if (age < ECHO_DELAY_MS) return false;
    const key = `${req.artifactId}_${req.at}`;
    if (echoed.includes(key)) return false;
    return true;
  });
}

export function markProofEchoed(artifactId: string, at: string): void {
  markEchoed(artifactId, at);
}

/** For compass: get echoed proof date for an artifact (to show "X months since you stood here"). */
export function getEchoedProofAt(artifactId: string): string | null {
  const requests = loadProofRequests();
  const echoed = loadEchoed();
  const matched = requests
    .filter((r) => r.artifactId === artifactId && echoed.includes(`${r.artifactId}_${r.at}`))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return matched[0]?.at ?? null;
}

/** For compass: has this artifact been echoed (city remembers)? */
export function isArtifactEchoed(artifactId: string): boolean {
  const requests = loadProofRequests();
  const echoed = loadEchoed();
  return requests.some((r) => r.artifactId === artifactId && echoed.includes(`${r.artifactId}_${r.at}`));
}
