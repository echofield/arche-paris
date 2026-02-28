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
  forceUnpairDevice,
  checkSession,
} from './card-gate-client';

export interface CardStatus {
  valid: boolean;
  status: 'ACTIVATED' | 'WELCOME_BACK' | 'ALREADY_ACTIVATED' | 'NOT_FOUND' | 'ERROR' | 'DEMO' | 'NEEDS_GATE' | 'SESSION_EXPIRED' | 'NO_KEY';
  message: string;
  cardId: string;
  cardCode?: string;
  accessCount?: number;
}

const STORAGE_KEY = 'arche_card_id';

/**
 * Normalize card identity at boundaries. Use for props and API call sites.
 * Convention: null when unknown; do not use 'unknown' string sentinel.
 */
export function normalizeCardId(value: string | null | undefined | 'unknown'): string | null {
  if (value == null || value === '' || value === 'unknown') return null;
  return value;
}

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

export interface UnpairCardResult {
  ok: boolean;
  message?: string;
  /** If true, card is still paired on server but session expired - need password */
  needsPassword?: boolean;
  cardId?: string;
}

/**
 * Unpair current card from this device (clears server + local state).
 * After this, the card can be paired again on the same or different device.
 * Use this for proper logout/disconnect functionality.
 *
 * If needsPassword is true in the result, the card is still paired on server
 * but the session cookie is missing. User must provide password to force-unpair.
 */
export async function unpairCard(): Promise<UnpairCardResult> {
  const cardId = getStoredCard();
  if (!cardId) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('arche_card_session');
    return { ok: true, message: 'No card stored' };
  }
  const result = await unpairDevice(cardId);

  // If server says we need password, don't clear local storage yet
  // (user might cancel and want to stay logged in locally)
  if (result.needsPassword) {
    return { ...result, cardId };
  }

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('arche_card_session');
  return result;
}

/**
 * Force unpair using password. Call this when unpairCard returns needsPassword: true.
 */
export async function forceUnpairCard(cardId: string, password: string): Promise<{ ok: boolean; message?: string }> {
  const result = await forceUnpairDevice(cardId, password);
  if (result.ok) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('arche_card_session');
  }
  return result;
}

/**
 * Initialize: if URL has ?card=CODE, return needsGate so App shows CardGate(CODE).
 * If we have stored card, try getCardToken; if success return valid, else no_card.
 * Demo mode: pathname /demo skips authentication; cardId starting with DEMO is allowed without gate.
 */
export async function initializeCard(): Promise<CardStatus | null> {
  const urlParams = new URLSearchParams(window.location.search);
  const codeFromUrl = urlParams.get('card');
  const isDemo = typeof window !== 'undefined' && window.location.pathname.startsWith('/demo');

  if (isDemo) {
    const demoCardId = 'DEMO-DEV';
    setStoredCard(demoCardId);
    return {
      valid: true,
      status: 'DEMO',
      message: 'Mode démo.',
      cardId: demoCardId,
    };
  }

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
    // If URL card matches an already valid cookie session, skip CardGate.
    const session = await checkSession();
    if (session.valid && session.cardId && session.cardId === codeFromUrl) {
      setStoredCard(codeFromUrl);
      return {
        valid: true,
        status: 'WELCOME_BACK',
        message: 'Bon retour.',
        cardId: codeFromUrl,
      };
    }

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
      // No key required: allow connection without a card (guest mode).
      return {
        valid: true,
        status: 'NO_KEY',
        message: 'Entrée sans carte.',
        cardId: '',
      };
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
    // Session expired (e.g. 401) — keep card so app stays usable (Trésor Caché, etc.)
    return {
      valid: false,
      status: 'SESSION_EXPIRED',
      message: 'Session expirée. Utilisez le lien de votre carte pour vous reconnecter.',
      cardId: storedCard,
    };
  }
}

/** Error thrown when card is paired on another device and password is needed to transfer */
export class AlreadyPairedError extends Error {
  code = 'ALREADY_PAIRED_NEEDS_PASSWORD';
  constructor(message = 'Cette carte est utilisée sur un autre appareil. Entrez votre mot de passe pour la transférer ici.') {
    super(message);
    this.name = 'AlreadyPairedError';
  }
}

/** Error thrown when rate limited */
export class RateLimitError extends Error {
  code = 'RATE_LIMITED';
  constructor(message = 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Guard to prevent concurrent calls to afterCardGateAuthenticated
let authInProgress = false;

/**
 * After CardGate onAuthenticated(cardData): pair device, get token, store card.
 * Call this from the component that handles onAuthenticated (e.g. App).
 * cardData.id is the card id to use for all Gate operations.
 * password is optional but required for recovery when card is already paired but local secret is lost.
 *
 * 409 ALREADY_PAIRED handling:
 * 1. Try /refresh to check if we have a valid session cookie already
 * 2. If refresh works → we're connected, just store card
 * 3. If refresh fails and no password → throw AlreadyPairedError (UI shows password prompt)
 * 4. If password provided → force-unpair + pair
 */
/** Thrown when a second auth/pair flow is started while the first is still running. Caller should not treat as success. */
export class AuthInProgressError extends Error {
  constructor() {
    super('ALREADY_IN_PROGRESS');
    this.name = 'AuthInProgressError';
  }
}

export async function afterCardGateAuthenticated(cardData: {
  id: string;
  code: string;
  activated_at: string;
  password?: string;
}): Promise<void> {
  // Prevent concurrent calls (React StrictMode, double-renders, retry, etc.)
  if (authInProgress) {
    console.log('[card-service] Auth already in progress, skipping');
    throw new AuthInProgressError();
  }
  authInProgress = true;

  const cardId = cardData.id;
  try {
    try {
      await pairDevice(cardId);
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === 'ALREADY_PAIRED') {
        console.log('[card-service] 409 ALREADY_PAIRED received, trying /refresh first...');

        // First, try to refresh - maybe we have a valid cookie from this device
        try {
          const refreshResult = await checkSession();
          if (refreshResult.valid && refreshResult.cardId === cardId) {
            // We have a valid session! Just get token and continue
            console.log('[card-service] Refresh succeeded, session is valid');
            await getCardToken(cardId);
            setStoredCard(cardId);
            return;
          }
          console.log('[card-service] Refresh returned different card or invalid');
        } catch (refreshErr) {
          console.log('[card-service] Refresh failed:', refreshErr);
        }

        // Refresh didn't work - need password to transfer to this device
        if (!cardData.password) {
          throw new AlreadyPairedError();
        }

        // Have password, try force-unpair
        console.log('[card-service] Attempting force-unpair with password');
        const forceResult = await forceUnpairDevice(cardId, cardData.password);
        if (!forceResult.ok) {
          // Check for rate limit
          if (forceResult.message?.includes('Too many') || forceResult.message?.includes('Trop de')) {
            throw new RateLimitError();
          }
          throw new Error(forceResult.message ?? 'Échec du transfert. Vérifiez le mot de passe.');
        }

        // Now re-pair (if this throws, finally below still releases the lock)
        await pairDevice(cardId);
      } else {
        throw e;
      }
    }
    await getCardToken(cardId);
    setStoredCard(cardId);
  } finally {
    authInProgress = false;
  }
}

