/**
 * ARCHÉ — Traces Service
 *
 * All access via Card Gate only. No direct DB. If Card Gate fails: queue locally / show offline.
 */

import {
  getTraces as gateGetTraces,
  leaveTrace as gateLeaveTrace,
  hasLeftTrace as gateHasLeftTrace,
  type GateTrace,
  type LeaveTraceResult,
} from './card-gate-client';

export interface Trace {
  content: string;
  card_id: string;
  created_at: string;
}

export interface TraceResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Get traces left by previous walkers at a location (via Card Gate).
 */
export async function getTraces(
  cardId: string,
  questId: string,
  etapeId: string,
  limit: number = 3
): Promise<Trace[]> {
  try {
    const traces = await gateGetTraces(cardId, questId, etapeId, limit);
    return traces as Trace[];
  } catch (err) {
    console.error('Traces service (Card Gate):', err);
    return [];
  }
}

/**
 * Leave a trace at a location (via Card Gate).
 */
export async function leaveTrace(
  cardId: string,
  questId: string,
  etapeId: string,
  content: string
): Promise<TraceResult> {
  const result: LeaveTraceResult = await gateLeaveTrace(cardId, questId, etapeId, content);
  return {
    success: result.success,
    message: result.message,
    error: result.error,
  };
}

/**
 * Check if a card has already left a trace at a location (via Card Gate).
 */
export async function hasLeftTrace(
  cardId: string,
  questId: string,
  etapeId: string
): Promise<boolean> {
  try {
    return await gateHasLeftTrace(cardId, questId, etapeId);
  } catch (err) {
    console.error('Traces service (Card Gate):', err);
    return false;
  }
}

/**
 * Format card ID for display (anonymized)
 * PS-0847 → PS-08••
 */
export function formatCardId(cardId: string): string {
  if (!cardId || cardId.length < 4) return '••••';
  return cardId.slice(0, -2) + '••';
}

/**
 * Format date for display
 */
export function formatTraceDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "aujourd'hui";
  if (diffDays === 1) return 'hier';
  if (diffDays < 7) return `il y a ${diffDays} jours`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)} semaines`;

  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}
