/**
 * ARCHÉ — Card Service (V1)
 *
 * INVARIANTS:
 * - Activation requires non-enumerable proof (code+password via activate-card Edge Function).
 *   activate_card must never succeed with card_id alone. Pairing assumes this.
 * - After activation/login (CardGate onAuthenticated): pairDevice then validateCardAndGetToken.
 * - No direct DB for journal/traces; all via Card Gate. No fallback to direct DB.
 */

import {
  pairDevice,
  validateCardAndGetToken,
  getCardToken,
  clearCardGateStorage,
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
 */
export function clearCard(): void {
  const cardId = getStoredCard();
  if (cardId) clearCardGateStorage(cardId);
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('arche_card_session');
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

  const storedCard = getStoredCard();
  if (!storedCard) return null;

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
 */
export async function afterCardGateAuthenticated(cardData: {
  id: string;
  code: string;
  activated_at: string;
}): Promise<void> {
  const cardId = cardData.id;
  try {
    await pairDevice(cardId);
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === 'ALREADY_PAIRED') {
      // Same device returning: we already have device_secret, just validate
    } else {
      throw e;
    }
  }
  await validateCardAndGetToken(cardId);
  setStoredCard(cardId);
}
