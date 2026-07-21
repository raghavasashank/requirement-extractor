import mammoth from 'mammoth';
import { extractSubjectsFromText } from './textExtractor.js';
import { parseTablesFromHtml } from './tableParser.js';

export async function parseDocx(buffer) {
  const [{ value: text }, { value: html }] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);

  const tableRows = parseTablesFromHtml(html);
  if (tableRows.length > 0) return tableRows;

  return extractSubjectsFromText(text);
}
