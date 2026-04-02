export type DiagnosticLevel = 'info' | 'warn' | 'error';

export interface ArcheDiagnosticEvent {
  level: DiagnosticLevel;
  module: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  degraded?: boolean;
  fatal?: boolean;
  ts: string;
}

type DiagnosticSink = (event: ArcheDiagnosticEvent) => void;

declare global {
  interface Window {
    __ARCHE_TELEMETRY__?: DiagnosticSink;
  }
}

const onceKeys = new Set<string>();

function consoleMethodFor(level: DiagnosticLevel): 'info' | 'warn' | 'error' {
  if (level === 'error') return 'error';
  if (level === 'warn') return 'warn';
  return 'info';
}

export function emitDiagnostic(
  event: Omit<ArcheDiagnosticEvent, 'ts'>,
  options?: {
    onceKey?: string;
    devOnly?: boolean;
  },
): void {
  const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  if (options?.devOnly && !isDev) return;
  const onceKey = options?.onceKey;
  if (onceKey && onceKeys.has(onceKey)) return;
  if (onceKey) onceKeys.add(onceKey);

  const payload: ArcheDiagnosticEvent = {
    ...event,
    ts: new Date().toISOString(),
  };

  const prefix = `[ARCHE][${payload.module}] ${payload.code}: ${payload.message}`;
  const method = consoleMethodFor(payload.level);
  if (payload.details) {
    console[method](prefix, payload.details);
  } else {
    console[method](prefix);
  }

  if (typeof window === 'undefined') return;
  const sink = window.__ARCHE_TELEMETRY__;
  if (typeof sink !== 'function') return;

  try {
    sink(payload);
  } catch (err) {
    console.warn('[ARCHE][telemetry] Sink handler failed', {
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}

export function resetDiagnosticsForTests(): void {
  onceKeys.clear();
}

