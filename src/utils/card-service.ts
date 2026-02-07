/**
 * ARCHÉ — Card Service (V1)
 *
 * INVARIANTS:
 * - Activation requires non-enumerable proof (code+password via activate-card Edge Function).
 *   activate_card must never succeed with card_id alone. Pairing assumes this.
 * - After activation/login (CardGate onAuthenticated): pairDevice then getCardToken (token in memory).
 * - No direct DB for journal/traces; all via Card Gate. No fallback to direct DB.
 */

import {
  pairDevice,
  getCardToken,
  clearCardGateStorage,
  unpairDevice,
  hasLocalSecret,
  forceUnpairDevice,
  checkSession,
} from './card-gate-client';

export interface CardStatus {
  valid: boolean;
  status: 'ACTIVATED' | 'WELCOME_BACK' | 'ALREADY_ACTIVATED' | 'NOT_FOUND' | 'ERROR' | 'DEMO' | 'NEEDS_GATE';
  message: string;
  cardId: string;
  cardCode?: string;
  accessCount?: number;
}

const STORAGE_KEY = 'arche_card_id';

/**
 * Get stored card ID (set after CardGate onAuthenticated).
 */
export function getStoredCard(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Set stored card ID. Call after successful CardGate flow (pair + validate).
 */
export function setStoredCard(cardId: string): void {
  localStorage.setItem(STORAGE_KEY, cardId);
}

/**
 * Clear stored card and Card Gate storage (device_secret, token) for this card.
 * Also clears arche_card_session so the same card can be used on another device.
 * NOTE: This only clears local storage; use unpairCard() to also clear server state.
 */
export function clearCard(): void {
  const cardId = getStoredCard();
  if (cardId) clearCardGateStorage(cardId);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('arche_card_session');
}

/**
 * Unpair current card from this device (clears server + local state).
 * After this, the card can be paired again on the same or different device.
 * Use this for proper logout/disconnect functionality.
 */
export async function unpairCard(): Promise<{ ok: boolean; message?: string }> {
  const cardId = getStoredCard();
  if (!cardId) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('arche_card_session');
    return { ok: true, message: 'No card stored' };
  }
  const result = await unpairDevice(cardId);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('arche_card_session');
  return result;
}

/**
 * Initialize: if URL has ?card=CODE, return needsGate so App shows CardGate(CODE).
 * If we have stored card, try getCardToken; if success return valid, else no_card.
 * Demo mode: cardId starting with DEMO is allowed without gate.
 */
export async function initializeCard(): Promise<CardStatus | null> {
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('card');

  if (codeFromUrl?.startsWith('DEMO')) {
    setStoredCard(codeFromUrl);
    return {
      valid: true,
      status: 'DEMO',
      message: 'Mode démonstration.',
      cardId: codeFromUrl,
    };
  }

  if (codeFromUrl) {
    return {
      valid: false,
      status: 'NEEDS_GATE',
      message: 'Vérifiez la carte.',
      cardId: '',
      cardCode: codeFromUrl,
    };
  }

  let storedCard = getStoredCard();
  if (!storedCard) {
    const session = await checkSession();
    if (session.valid && session.cardId) {
      setStoredCard(session.cardId);
      storedCard = session.cardId;
    } else {
      return null;
    }
  }

  if (storedCard.startsWith('DEMO')) {
    return {
      valid: true,
      status: 'DEMO',
      message: 'Mode démonstration.',
      cardId: storedCard,
    };
  }

  try {
    await getCardToken(storedCard);
    return {
      valid: true,
      status: 'WELCOME_BACK',
      message: 'Bon retour.',
      cardId: storedCard,
    };
  } catch {
    clearCard();
    return null;
  }
}

/**
 * After CardGate onAuthenticated(cardData): pair device, get token, store card.
 * Call this from the component that handles onAuthenticated (e.g. App).
 * cardData.id is the card id to use for all Gate operations.
 * password is optional but required for recovery when card is already paired but local secret is lost.
 */
export async function afterCardGateAuthenticated(cardData: {
  id: string;
  code: string;
  activated_at: string;
  password?: string;
}): Promise<void> {
  const cardId = cardData.id;
  try {
    await pairDevice(cardId);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === 'ALREADY_PAIRED') {
      // Check if we have local secret
      if (!hasLocalSecret(cardId)) {
        // No local secret but server says already paired
        // Try to force-unpair using password, then re-pair
        if (!cardData.password) {
          throw new Error('Card already paired on another device. Password required to transfer.');
        }
        console.log('[card-service] ALREADY_PAIRED without local secret, attempting force-unpair');
        const forceResult = await forceUnpairDevice(cardId, cardData.password);
        if (!forceResult.ok) {
          throw new Error(forceResult.message ?? 'Force unpair failed');
        }
        // Now re-pair
        await pairDevice(cardId);
      }
      // If we have local secret, just continue to validate
    } else {
      throw e;
    }
  }
  await getCardToken(cardId);
  setStoredCard(cardId);
}
