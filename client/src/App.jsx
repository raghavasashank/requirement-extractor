import { useCallback, useState } from 'react';
import Header from './components/Header.jsx';
import UploadZone from './components/UploadZone.jsx';
import DataTable from './components/DataTable.jsx';
import { extractFile, exportRows } from './lib/api.js';

let nextId = 1;

function rowFromExtracted(fields, sourceFile) {
  return {
    id: nextId++,
    sourceFile,
    subject: fields.subject || '',
    courseYear: fields.courseYear || '',
    term: fields.term || '',
    course: fields.course || '',
    textBooks: fields.textBooks || '',
    referenceBooks: fields.referenceBooks || '',
    webLinks: fields.webLinks || '',
  };
}

export default function App() {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [fileStatuses, setFileStatuses] = useState({});
  const [rows, setRows] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleAddFiles = useCallback((files) => {
    setPendingFiles((prev) => [...prev, ...files]);
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleProcess = useCallback(async () => {
    if (pendingFiles.length === 0) return;
    setProcessing(true);
    const newRows = [];

    for (const file of pendingFiles) {
      setProgressText(`Extracting from ${file.name}...`);
      setFileStatuses((prev) => ({ ...prev, [file.name]: { status: 'processing' } }));
      try {
        const result = await extractFile(file);
        if (result.error) {
          setFileStatuses((prev) => ({ ...prev, [file.name]: { status: 'error', error: result.error } }));
        } else if (!result.rows || result.rows.length === 0) {
          setFileStatuses((prev) => ({
            ...prev,
            [file.name]: { status: 'error', error: 'No subjects could be identified in this file' },
          }));
        } else {
          result.rows.forEach((fields) => newRows.push(rowFromExtracted(fields, file.name)));
          setFileStatuses((prev) => ({ ...prev, [file.name]: { status: 'success' } }));
        }
      } catch (err) {
        const message = err.response?.data?.error || err.message || 'Failed to process file';
        setFileStatuses((prev) => ({ ...prev, [file.name]: { status: 'error', error: message } }));
      }
    }

    setRows((prev) => [...prev, ...newRows]);
    setPendingFiles([]);
    setProcessing(false);
    setProgressText('');
  }, [pendingFiles]);

  const handleUpdateRow = useCallback((id, key, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportRows(
        rows.map(({ subject, courseYear, term, course, textBooks, referenceBooks, webLinks }) => ({
          subject,
          courseYear,
          term,
          course,
          textBooks,
          referenceBooks,
          webLinks,
        }))
      );
    } finally {
      setExporting(false);
    }
  }, [rows]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {rows.length > 0 ? 'Add more files' : 'Upload source documents'}
          </h2>
          <UploadZone
            pendingFiles={pendingFiles}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            statuses={fileStatuses}
          />

          <div className="mt-5 flex items-center gap-4">
            <button
              type="button"
              disabled={pendingFiles.length === 0 || processing}
              onClick={handleProcess}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {processing && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {processing ? 'Processing…' : 'Process Files'}
            </button>
            {processing && <span className="text-sm text-slate-500">{progressText}</span>}
          </div>
        </section>

        {rows.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Preview &amp; edit ({rows.length} row{rows.length === 1 ? '' : 's'})
              </h2>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {exporting ? 'Preparing…' : 'Download Excel'}
              </button>
            </div>
            <DataTable rows={rows} onUpdateRow={handleUpdateRow} />
          </section>
        )}
      </main>
    </div>
  );
}
