import { extractUrls } from './urlExtractor.js';

const ROMAN = '[IVX]+';
const COURSE_CODE_RE = /^course\s*code\s*:?/i;
const BTECH_RE = /^b\.?\s*tech\.?\s+(.+)$/i;
const GENERIC_HEADING_RE = /^(school of|department of|b\.?\s*tech\b)/i;
const YEAR_LINE_RE = new RegExp(`^year\\s*:?\\s*(${ROMAN})\\s*(?:/\\s*(${ROMAN}))?`, 'i');
const TERM_LINE_RE = new RegExp(`^term\\s*:?\\s*(${ROMAN})`, 'i');
const TEXT_BOOKS_RE = /^(?:\d+(?:\.\d+)?\.?\s*)?text\s*books?\b/i;
const REF_BOOKS_RE = /^(?:\d+(?:\.\d+)?\.?\s*)?reference\s*books?\b/i;
const WEB_LINKS_RE = /^(?:\d+(?:\.\d+)?\.?\s*)?web\s*links?\b/i;
const NEXT_MAJOR_RE = /^(?:\d+(?:\.\d+)?\.?\s*)?(course\s*outcomes?|laboratory|list\s*of\s*experiments)\b/i;

function numberEntries(entries) {
  if (!entries.length) return '';
  return entries.map((e, i) => `${i + 1}. ${e}`).join('\n');
}

// Collects the non-blank lines strictly between [start, end) as book/reference entries.
function collectEntries(lines, start, end) {
  const entries = [];
  for (let i = start; i < end && i < lines.length; i++) {
    const l = lines[i].trim();
    if (l) entries.push(l);
  }
  return entries;
}

function findSubsectionEnd(startIdx, candidateIdxs, blockEnd) {
  const after = candidateIdxs.filter((i) => i > startIdx);
  return after.length ? Math.min(...after, blockEnd) : blockEnd;
}

function findNearestBTechCourse(lines, uptoIdx) {
  for (let i = uptoIdx - 1; i >= 0; i--) {
    const m = lines[i].trim().match(BTECH_RE);
    if (m) return m[1].trim();
  }
  return '';
}

function findSubjectTitle(lines, courseCodeIdx) {
  for (let i = courseCodeIdx - 1; i >= 0; i--) {
    const l = lines[i].trim();
    if (!l) continue;
    if (GENERIC_HEADING_RE.test(l)) continue;
    return l;
  }
  return '';
}

// Fallback for documents with no "Course code:" anchor: scan forward for the
// first substantive, non-generic line to use as the subject title.
function findFirstSubjectTitleForward(lines) {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (GENERIC_HEADING_RE.test(l)) continue;
    return l;
  }
  return '';
}

function extractYearTerm(blockLines) {
  for (const raw of blockLines) {
    const l = raw.trim();
    const ym = l.match(YEAR_LINE_RE);
    if (ym) {
      return { courseYear: ym[1] || '', term: ym[2] || '' };
    }
  }
  let term = '';
  for (const raw of blockLines) {
    const tm = raw.trim().match(TERM_LINE_RE);
    if (tm) {
      term = tm[1];
      break;
    }
  }
  return { courseYear: '', term };
}

function extractBookSections(lines, blockStart, blockEnd) {
  let textBooksIdx = -1;
  let refBooksIdx = -1;
  let webLinksIdx = -1;
  let nextMajorIdx = -1;

  for (let i = blockStart; i < blockEnd; i++) {
    const l = lines[i].trim();
    if (textBooksIdx === -1 && TEXT_BOOKS_RE.test(l)) textBooksIdx = i;
    else if (refBooksIdx === -1 && REF_BOOKS_RE.test(l)) refBooksIdx = i;
    else if (webLinksIdx === -1 && WEB_LINKS_RE.test(l)) webLinksIdx = i;
    else if (nextMajorIdx === -1 && NEXT_MAJOR_RE.test(l)) nextMajorIdx = i;
  }

  const stoppers = [refBooksIdx, webLinksIdx, nextMajorIdx].filter((i) => i !== -1);

  let textBooks = '';
  if (textBooksIdx !== -1) {
    const end = findSubsectionEnd(textBooksIdx, stoppers, blockEnd);
    textBooks = numberEntries(collectEntries(lines, textBooksIdx + 1, end));
  }

  let referenceBooks = '';
  if (refBooksIdx !== -1) {
    const stoppers2 = [webLinksIdx, nextMajorIdx].filter((i) => i !== -1);
    const end = findSubsectionEnd(refBooksIdx, stoppers2, blockEnd);
    referenceBooks = numberEntries(collectEntries(lines, refBooksIdx + 1, end));
  }

  return { textBooks, referenceBooks };
}

/**
 * Splits raw extracted text into one or more subject blocks and pulls every
 * output field it can find for each. Anything not locatable is left blank
 * rather than guessed, per spec.
 */
export function extractSubjectsFromText(text) {
  const lines = text.split(/\r?\n/);
  const courseCodeIdxs = [];
  lines.forEach((l, i) => {
    if (COURSE_CODE_RE.test(l.trim())) courseCodeIdxs.push(i);
  });

  const noAnchors = courseCodeIdxs.length === 0;
  const blocks = [];
  if (courseCodeIdxs.length > 0) {
    for (let b = 0; b < courseCodeIdxs.length; b++) {
      const anchor = courseCodeIdxs[b];
      const subjectTitleIdx = (() => {
        for (let i = anchor - 1; i >= 0; i--) {
          const l = lines[i].trim();
          if (!l) continue;
          if (GENERIC_HEADING_RE.test(l)) continue;
          return i;
        }
        return anchor;
      })();
      const blockStart = subjectTitleIdx;
      const blockEnd = b + 1 < courseCodeIdxs.length ? courseCodeIdxs[b + 1] : lines.length;
      blocks.push({ anchor, blockStart, blockEnd });
    }
  } else {
    // Fallback: no recognizable "Course code:" anchor anywhere — treat the
    // whole document as a single subject block so it still produces a row.
    blocks.push({ anchor: 0, blockStart: 0, blockEnd: lines.length });
  }

  return blocks.map(({ anchor, blockStart, blockEnd }) => {
    const subject = noAnchors ? findFirstSubjectTitleForward(lines) : findSubjectTitle(lines, anchor);
    const course = findNearestBTechCourse(lines, blockStart + 1);
    const blockLines = lines.slice(blockStart, blockEnd);
    const { courseYear, term } = extractYearTerm(blockLines);
    const { textBooks, referenceBooks } = extractBookSections(lines, blockStart, blockEnd);
    const webLinks = extractUrls(blockLines.join('\n')).join('\n');

    return {
      subject,
      courseYear,
      term,
      course,
      textBooks,
      referenceBooks,
      webLinks,
    };
  });
}
