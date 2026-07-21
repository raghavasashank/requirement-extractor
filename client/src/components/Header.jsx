export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 font-mono text-sm font-bold text-white">
          RE
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Requirement Extractor
          </h1>
          <p className="text-xs text-slate-500">
            Extract book &amp; web-link references from academic documents into one Excel file
          </p>
        </div>
      </div>
    </header>
  );
}
