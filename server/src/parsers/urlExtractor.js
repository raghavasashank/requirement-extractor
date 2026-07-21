const URL_RE = /https?:\/\/[^\s"'<>)\]]+/gi;

// Trailing punctuation that regularly gets swept up when a URL sits at the
// end of a sentence or citation (periods, commas, closing brackets, etc.)
const TRAILING_PUNCT_RE = /[.,;:!?)\]]+$/;

export function extractUrls(text) {
  if (!text) return [];
  const found = text.match(URL_RE) || [];
  const cleaned = found.map((u) => u.replace(TRAILING_PUNCT_RE, ''));
  return [...new Set(cleaned)];
}
