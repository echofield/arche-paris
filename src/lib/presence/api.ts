/**
 * ARCHÉ — Presence verification API (Card Gate)
 */
import { getSessionCardCode } from '@/utils/card-gate-client';
import type {
  PresenceVerifyRequest,
  PresenceVerifyResponse,
} from './index';

export type { PresenceVerifyRequest, PresenceVerifyResponse };

type ApiResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export async function presenceVerify(
  body: PresenceVerifyRequest
): Promise<ApiResult<PresenceVerifyResponse>> {
  try {
    const cardCode = getSessionCardCode();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cardCode) headers['X-ARCHE-CARD-CODE'] = cardCode;

    const res = await fetch('/api/card-gate/presence/verify', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        data: null,
        error: (data?.error as string) ?? `Presence verify ${res.status}`,
      };
    }
    const payload = data as PresenceVerifyResponse;
    if (!import.meta.env.VITE_DEBUG_TERRITORY && payload?.debug) {
      const { debug: _, ...rest } = payload;
      return { data: rest as PresenceVerifyResponse, error: null };
    }
    return { data: payload, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Presence verify failed',
    };
  }
}
