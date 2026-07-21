import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseDocx } from './parsers/docxParser.js';
import { parsePdf } from './parsers/pdfParser.js';
import { buildWorkbook } from './excelBuilder.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '../../client/dist');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/extract', upload.array('files'), async (req, res) => {
  const files = req.files || [];
  const results = [];

  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    try {
      let rows;
      if (ext === '.docx') {
        rows = await parseDocx(file.buffer);
      } else if (ext === '.pdf') {
        rows = await parsePdf(file.buffer);
      } else {
        results.push({ fileName: file.originalname, error: `Unsupported file type "${ext}"`, rows: [] });
        continue;
      }
      results.push({ fileName: file.originalname, error: null, rows });
    } catch (err) {
      results.push({ fileName: file.originalname, error: err.message || 'Failed to parse file', rows: [] });
    }
  }

  res.json({ results });
});

app.post('/api/export', async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows)) {
    return res.status(400).json({ error: 'rows must be an array' });
  }
  try {
    const buffer = await buildWorkbook(rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Library_Requirement.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to build workbook' });
  }
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Library Requirement Extractor server listening on http://localhost:${PORT}`);
});
