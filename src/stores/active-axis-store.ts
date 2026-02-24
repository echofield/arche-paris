import type { ActivationMode } from '../types/axes';

type Listener = () => void;

let activeAxisName: string | undefined;
let activeAxisActivationMode: ActivationMode | undefined;
const listeners: Set<Listener> = new Set();

function notify() {
  listeners.forEach(fn => fn());
}

export function setActiveAxis(name: string, mode: ActivationMode) {
  activeAxisName = name;
  activeAxisActivationMode = mode;
  notify();
}

export function clearActiveAxis() {
  activeAxisName = undefined;
  activeAxisActivationMode = undefined;
  notify();
}

export function getActiveAxis(): { name: string; mode: ActivationMode } | null {
  if (!activeAxisName || !activeAxisActivationMode) return null;
  return { name: activeAxisName, mode: activeAxisActivationMode };
}

export function subscribeActiveAxis(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
