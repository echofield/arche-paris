/**
 * Entitlements
 *
 * Which cards the current user is entitled to see.
 * Empty by default — no cards visible until granted.
 */

// TODO: Replace with actual entitlement logic (auth, API, etc.)
export const entitlements: string[] = [];

export const hasCard = (cardId: string): boolean => {
  return entitlements.includes(cardId);
};
