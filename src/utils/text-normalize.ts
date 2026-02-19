export function normalizeDisplayText(input: string): string {
  let text = (input ?? "").replace(/\s+/g, " ").trim();
  if (!text) return text;

  if (/[ÃÂâ]/.test(text)) {
    try {
      const bytes = Uint8Array.from(Array.from(text, (ch) => ch.charCodeAt(0) & 0xff));
      const decoded = new TextDecoder("utf-8").decode(bytes);
      if (decoded && !decoded.includes("\u0000")) {
        text = decoded;
      }
    } catch {
      // Keep original when decode fails.
    }
  }

  text = text
    .replace(/â€¦/g, "...")
    .replace(/â€”|â€“/g, "-")
    .replace(/â€™/g, "'")
    .replace(/Â·/g, "·")
    .replace(/([A-Za-z])\uFFFD([A-Za-z])/g, "$1e$2")
    .replace(/\uFFFD/g, "e");

  return text.normalize("NFC").replace(/\s+/g, " ").trim();
}
