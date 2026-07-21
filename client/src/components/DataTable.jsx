import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

const FIELD_COLUMNS = [
  { key: 'subject', label: 'Subject', width: 'w-52' },
  { key: 'courseYear', label: 'Course Year', width: 'w-28' },
  { key: 'term', label: 'Term', width: 'w-20' },
  { key: 'course', label: 'Course', width: 'w-36' },
  { key: 'textBooks', label: 'Text Books (3)', width: 'w-72', multiline: true },
  { key: 'referenceBooks', label: 'Reference Books (3)', width: 'w-72', multiline: true },
  { key: 'webLinks', label: 'Web Links', width: 'w-64', multiline: true },
];

function EditableCell({ value, onChange, multiline }) {
  const empty = !value;
  const commonClass = `w-full resize-y rounded border bg-transparent px-2 py-1 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 ${
    empty ? 'dashed-empty italic text-slate-400' : 'border-transparent hover:border-slate-200'
  }`;

  if (multiline) {
    return (
      <textarea
        className={commonClass}
        rows={3}
        placeholder="—"
        defaultValue={value}
        onBlur={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className={commonClass}
      placeholder="—"
      defaultValue={value}
      onBlur={(e) => onChange(e.target.value)}
    />
  );
}

export default function DataTable({ rows, onUpdateRow }) {
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(
    () => [
      {
        id: 'slNo',
        header: 'Sl.No',
        cell: ({ row }) => <span className="text-sm text-slate-500">{row.index + 1}</span>,
        size: 60,
      },
      ...FIELD_COLUMNS.map((col) => ({
        id: col.key,
        accessorKey: col.key,
        header: col.label,
        cell: ({ row }) => (
          <EditableCell
            value={row.original[col.key]}
            multiline={col.multiline}
            onChange={(val) => onUpdateRow(row.original.id, col.key, val)}
          />
        ),
      })),
    ],
    [onUpdateRow]
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead className="bg-slate-100">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="cursor-pointer select-none whitespace-nowrap border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted()] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-slate-50/50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
