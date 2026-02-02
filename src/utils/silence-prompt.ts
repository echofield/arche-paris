/**
 * ARCHÉ — Fallow period: 30+ days without opening the app.
 * On next open, show "You were away. The city waited." once. No guilt, no streak.
 */

const LAST_OPEN_KEY = 'arche_last_open_v1';
const SILENCE_SHOWN_KEY = 'arche_silence_prompt_shown_v1';
const DAYS_ABSENT = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function recordAppOpen(): void {
  try {
    localStorage.setItem(LAST_OPEN_KEY, new Date().toISOString());
  } catch (e) {
    console.warn('silence-prompt: record failed', e);
  }
}

/** Call on load. Returns true if we should show the silence line (30+ days since last open). */
export function shouldShowSilencePrompt(): boolean {
  try {
    const lastOpenRaw = localStorage.getItem(LAST_OPEN_KEY);
    if (!lastOpenRaw) return false; // first time, no "return"
    const lastOpen = new Date(lastOpenRaw).getTime();
    const now = Date.now();
    const daysSince = (now - lastOpen) / MS_PER_DAY;
    if (daysSince < DAYS_ABSENT) return false;
    // Only show once per return (optional: could show every time after 30d)
    const shownRaw = localStorage.getItem(SILENCE_SHOWN_KEY);
    if (shownRaw) {
      const shownAt = new Date(shownRaw).getTime();
      const daysSinceShown = (now - shownAt) / MS_PER_DAY;
      if (daysSinceShown < 1) return false; // already shown this "return"
    }
    return true;
  } catch {
    return false;
  }
}

/** Call after showing the silence line so we don't show again until next long absence. */
export function markSilencePromptShown(): void {
  try {
    localStorage.setItem(SILENCE_SHOWN_KEY, new Date().toISOString());
  } catch (e) {
    console.warn('silence-prompt: mark shown failed', e);
  }
}
