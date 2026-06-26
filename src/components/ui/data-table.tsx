'use client';

import { type ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  emptyMessage = 'No data found',
  loading = false,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="rounded-xl glass overflow-hidden">
        <div className="animate-pulse p-6 space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl glass p-12 text-center">
        <p className="text-white/40 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row) => (
              <tr
                key={String(row[keyField])}
                className="hover:bg-white/[0.02] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-white/80 ${col.className || ''}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
