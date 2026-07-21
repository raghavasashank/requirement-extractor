import { parse } from 'node-html-parser';
import { extractUrls } from './urlExtractor.js';

const FIELD_MATCHERS = [
  { field: 'courseYear', re: /course\s*year|academic\s*year|\byear\b/i },
  { field: 'term', re: /\bterm\b|semester/i },
  { field: 'textBooks', re: /text\s*books?/i },
  { field: 'referenceBooks', re: /reference\s*books?/i },
  { field: 'webLinks', re: /web\s*links?/i },
  { field: 'subject', re: /subject|course\s*(name|title)/i },
  { field: 'course', re: /\bcourse\b/i },
  { field: 'title', re: /title\s*of\s*(the\s*)?book/i },
  { field: 'author', re: /author/i },
];

function mapHeaderToField(headerText) {
  for (const { field, re } of FIELD_MATCHERS) {
    if (re.test(headerText)) return field;
  }
  return null;
}

function cellText(cell) {
  return cell.structuredText ? cell.structuredText.trim() : cell.text.trim();
}

/**
 * Best-effort extraction from a docx HTML table whose header row uses
 * recognizable column names (Subject, Course Year, Term, Text Books, etc.).
 * Returns [] if no table looks like a subject listing, so callers can fall
 * back to narrative text parsing.
 */
export function parseTablesFromHtml(html) {
  const root = parse(html);
  const tables = root.querySelectorAll('table');
  const rows = [];

  for (const table of tables) {
    const trs = table.querySelectorAll('tr');
    if (trs.length < 2) continue;

    const headerCells = trs[0].querySelectorAll('th,td').map(cellText);
    const fieldMap = headerCells.map(mapHeaderToField);

    const recognized = fieldMap.filter(Boolean).length;
    if (recognized < 2) continue; // doesn't look like a subject table

    for (let r = 1; r < trs.length; r++) {
      const cells = trs[r].querySelectorAll('td,th').map(cellText);
      if (cells.every((c) => !c)) continue;

      const record = {
        subject: '',
        courseYear: '',
        term: '',
        course: '',
        textBooks: '',
        referenceBooks: '',
        webLinks: '',
        title: '',
        author: '',
      };

      cells.forEach((val, i) => {
        const field = fieldMap[i];
        if (field && val) record[field] = val;
      });

      // Some table formats keep book title/author in separate generic
      // columns rather than distinct Text/Reference Book columns — fold
      // that combination into Text Books since no ref/text label exists.
      if (!record.textBooks && !record.referenceBooks && (record.title || record.author)) {
        record.textBooks = [record.title, record.author].filter(Boolean).join(', ');
      }
      delete record.title;
      delete record.author;

      if (!record.webLinks) {
        const allText = cells.join(' ');
        const urls = extractUrls(allText);
        if (urls.length) record.webLinks = urls.join('\n');
      }

      if (record.subject || record.textBooks || record.referenceBooks) {
        rows.push(record);
      }
    }
  }

  return rows;
}
