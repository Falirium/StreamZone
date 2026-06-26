'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  placeholder?: string;
  paramName?: string;
}

export function SearchBar({ placeholder = 'Search...', paramName = 'search' }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramName) || '');
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const updateSearch = useCallback(
    (search: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set(paramName, search);
      } else {
        params.delete(paramName);
      }
      params.delete('page'); // reset to page 1 on search
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, paramName]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => updateSearch(newValue), 300);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all text-sm"
      />
    </div>
  );
}
