// Picks the 3 "important" text books: newest publication year, then highest edition.
// ponytail: heuristic only (no notion of author/publisher fame); entries with no
// year/edition tie at 0 and fall back to document order.
const YEAR_RE = /\b(19|20)\d{2}\b/g;
const EDITION_RE = /\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:ed\b|edition)/i;

function score(entry) {
  const years = (entry.match(YEAR_RE) || []).map(Number);
  const year = years.length ? Math.max(...years) : 0;
  const ed = Number((entry.match(EDITION_RE) || [])[1]) || 0;
  return year + ed / 100;
}

const MARKER_RE = /^(?:\d+[.)]|\[\d+\]|[•\-*])\s+/;

const PUBLISHER_TAIL_RE = /^(pvt|ltd|inc|press|publications?|publishers?|edition|ed\b)/i;

// Joins wrapped lines into whole entries and strips list markers.
// With numbered/bulleted lists, a marker starts a new entry. Otherwise a line
// continues the previous one if it starts lowercase or the previous ends in , : - & (heuristic).
export function mergeWrapped(lines) {
  const hasMarkers = lines.some((l) => MARKER_RE.test(l));
  const out = [];
  for (const l of lines) {
    const prev = out[out.length - 1];
    const cont = hasMarkers ? !MARKER_RE.test(l) : /^[a-z]/.test(l) || /[,:&-]$|\band$/.test(prev || '') || PUBLISHER_TAIL_RE.test(l);
    if (prev !== undefined && cont) out[out.length - 1] = `${prev} ${l.replace(MARKER_RE, '')}`;
    else out.push(l.replace(MARKER_RE, ''));
  }
  // Drop junk lines (page numbers, years, stray letters): a real entry has >= 8 letters.
  return out.filter((e) => (e.match(/[a-z]/gi) || []).length >= 8);
}

// Returns { top: 3 best (in original order), rest: everything else (original order) }.
export function splitTopBooks(entries, n = 3) {
  const ranked = entries
    .map((e, i) => ({ e, i, s: score(e) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.i);
  const keep = new Set(ranked);
  return {
    top: entries.filter((_, i) => keep.has(i)),
    rest: entries.filter((_, i) => !keep.has(i)),
  };
}
