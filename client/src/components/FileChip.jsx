function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-600',
  processing: 'bg-indigo-100 text-indigo-700',
  success: 'bg-emerald-100 text-emerald-700',
  error: 'bg-red-100 text-red-700',
};

export default function FileChip({ file, status, error, onRemove }) {
  const ext = file.name.split('.').pop().toLowerCase();
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-100 font-mono text-[10px] font-semibold uppercase text-slate-500">
        {ext}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-slate-400">{formatSize(file.size)}</p>
        {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
      </div>
      {status && (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[status]}`}>
          {status}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={`Remove ${file.name}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
