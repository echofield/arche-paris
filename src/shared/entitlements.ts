/**
 * Entitlements
 *
 * Which cards the current user is entitled to see.
 * Empty by default — no cards visible until granted.
 */

// TODO: Replace with actual entitlement logic (auth, API, etc.)
// TEMP: Force Card 001 visible for verification (REMOVE AFTER TEST)
export const entitlements: string[] = ["card_001_threshold"];

export const hasCard = (cardId: string): boolean => {
  return entitlements.includes(cardId);
};
