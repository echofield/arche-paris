import { useSyncExternalStore } from 'react';
import { getActiveAxis, subscribeActiveAxis } from '../stores/active-axis-store';
import type { ActivationMode } from '../types/axes';

export function useActiveAxis(): { name: string; mode: ActivationMode } | null {
  return useSyncExternalStore(subscribeActiveAxis, getActiveAxis, getActiveAxis);
}
