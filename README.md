# Requirement Extractor

Extracts book and web-link references from academic documents (.docx / .pdf) and
compiles them into a single formatted Excel file (`BOOKS` sheet) for library
procurement.

## Stack

- **Client:** React + Vite + Tailwind CSS, TanStack Table (editable preview), react-dropzone
- **Server:** Node.js + Express, mammoth (docx), pdf-parse (pdf), exceljs (xlsx output)
- No database — everything is processed in memory for the current session.

## Requirements

- Node.js 18+ and npm

## Install & Run

From the project root:

```bash
npm run install:all
npm run dev
```

This installs the root, `server`, and `client` dependencies, then starts:

- API server at `http://localhost:4000`
- Web app at `http://localhost:5173` (open this in your browser)

The Vite dev server proxies `/api/*` requests to the backend, so no extra
configuration is needed.

## How to use

1. Drag and drop one or more `.docx` / `.pdf` source documents onto the upload
   zone (or click to browse). Multiple files can be selected at once.
2. Click **Process Files**. Each file is parsed in turn; failures on one file
   are flagged without blocking the rest.
3. Review the extracted rows in the editable preview table. Empty cells are
   shown with a dashed border — click into any cell to fill in or correct a
   value. Column headers are sortable.
4. Use **Add more files** to upload another batch — new rows are appended to
   the same session without losing what's already there.
5. Click **Download Excel** to export everything as `Library_Requirement.xlsx`,
   with a `BOOKS` sheet matching the required column layout:

   `Sl.No | Subject | Course Year (I/II/III/IV/V) | Term | Course | Text Books (3) | Reference Books (3) | Web Links`

## Extraction logic

Each uploaded document is parsed one of two ways:

- **Table-based documents:** if a `.docx` contains an HTML table with a
  recognizable header row (columns like Subject, Course Year, Term, Text
  Books, Reference Books, Web Links, Author, etc.), each table row becomes one
  subject row.
- **Narrative "Board of Studies" style documents** (the common case): the
  parser locates each `Course code:` block, then within that block finds the
  subject title (the heading line just above it), the nearest preceding
  `B.Tech <branch>` heading (→ Course), a `Year: <roman> / <roman>` line
  (→ Course Year / Term), and the `Text Books` / `Reference Books` / `Web
  Links` sub-sections. A document can contain more than one such block, in
  which case each becomes its own row.
- URLs (`http://` / `https://`) are detected via regex anywhere in a subject's
  block and listed under Web Links, one per line, regardless of which
  sub-section they appeared in.
- Whatever can't be located for a given subject is left blank — the row is
  still created rather than skipped, and no placeholder text ("N/A", "-",
  etc.) is ever written.
- Rows from every uploaded file are merged into a single dataset before
  export; nothing is written per-file.

## Project structure

```
server/   Express API — upload, parse, export endpoints
  src/
    parsers/
      docxParser.js      mammoth extraction + table detection
      pdfParser.js        pdf-parse extraction
      tableParser.js      docx HTML table → rows
      textExtractor.js    narrative BOS-document → rows
      urlExtractor.js      URL regex helper
    excelBuilder.js       exceljs BOOKS sheet builder
    index.js              Express app & routes

client/   React + Vite UI
  src/
    components/           UploadZone, FileChip, DataTable, Header
    lib/api.js             API calls (extract, export)
    App.jsx                 app state & flow
```
