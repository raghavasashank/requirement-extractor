import pdfParse from 'pdf-parse';
import { extractSubjectsFromText } from './textExtractor.js';

export async function parsePdf(buffer) {
  const { text } = await pdfParse(buffer);
  return extractSubjectsFromText(text);
}
