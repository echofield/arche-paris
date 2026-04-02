import { emitDiagnostic } from '../lib/runtime-diagnostics';
import type { ProgressionArtifact } from './progression-sync';

export type ProgressionUxIssueCode =
  | 'STALE_BASE_VERSION_CONFLICT'
  | 'RECONCILE_REQUIRED'
  | 'LOCAL_DIRTY_DEFERRED'
  | 'LOCAL_FALLBACK_MODE';

export interface ProgressionUxIssue {
  cardId: string;
  code: ProgressionUxIssueCode;
  message: string;
  recoverable: boolean;
  artifact?: ProgressionArtifact;
  details?: Record<string, unknown>;
  ts: string;
}

type Listener = () => void;

const issueByCard = new Map<string, ProgressionUxIssue>();
const listeners = new Set<Listener>();

function notifyListeners(): void {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignore listener failures.
    }
  });
}

export function reportProgressionUxIssue(
  issue: Omit<ProgressionUxIssue, 'ts'>,
): ProgressionUxIssue {
  const next: ProgressionUxIssue = {
    ...issue,
    ts: new Date().toISOString(),
  };

  issueByCard.set(next.cardId, next);

  emitDiagnostic(
    {
      level: 'warn',
      module: 'CardScopedProgression',
      code: next.code,
      message: next.message,
      details: {
        cardId: next.cardId,
        artifact: next.artifact ?? null,
        ...(next.details ?? {}),
      },
      degraded: true,
    },
    {
      onceKey: `CardScopedProgression:UX:${next.cardId}:${next.code}:${next.artifact ?? 'all'}`,
    },
  );

  notifyListeners();
  return next;
}

export function getProgressionUxIssue(cardId: string | null | undefined): ProgressionUxIssue | null {
  if (typeof cardId !== 'string' || cardId.trim().length === 0) return null;
  return issueByCard.get(cardId) ?? null;
}

export function clearProgressionUxIssue(cardId: string | null | undefined): void {
  if (typeof cardId !== 'string' || cardId.trim().length === 0) return;
  if (!issueByCard.has(cardId)) return;
  issueByCard.delete(cardId);
  notifyListeners();
}

export function subscribeToProgressionUxIssue(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetProgressionUxStateForTests(): void {
  issueByCard.clear();
  listeners.clear();
}
