'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface PaginationProps {
  total: number;
  pageSize: number;
  page: number;
}

export function Pagination({ total, pageSize, page }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(newPage));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-white/10">
      <p className="text-sm text-white/40">
        Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 7) {
            pageNum = i + 1;
          } else if (page <= 4) {
            pageNum = i + 1;
          } else if (page >= totalPages - 3) {
            pageNum = totalPages - 6 + i;
          } else {
            pageNum = page - 3 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                pageNum === page
                  ? 'bg-brand-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
