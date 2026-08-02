import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserSearchSelectProps {
  users: UserOption[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function UserSearchSelect({
  users,
  value,
  onChange,
  loading = false,
  disabled = false,
}: UserSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // FIX #3: use fixed positioning calculated from trigger rect to escape modal overflow
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = users.find((u) => u.id === value) || null;

  // Calculate dropdown position relative to trigger button
  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 260;

    if (spaceBelow >= dropdownHeight) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [open]);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    function handleClose(e: MouseEvent | Event) {
      if (e instanceof MouseEvent && containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setSearch('');
    }
    document.addEventListener('mousedown', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, [open]);

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition
          ${disabled || loading ? 'cursor-not-allowed bg-gray-100 text-gray-400' : 'bg-white hover:border-navy'}
          ${open ? 'border-navy ring-1 ring-navy' : 'border-gray-300'}`}
      >
        <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
          {loading ? 'Loading users...' : selected ? (
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy/10 text-[10px] font-bold text-navy">
                {selected.name.charAt(0).toUpperCase()}
              </span>
              <span>{selected.name}</span>
              <span className="text-xs text-gray-400">{selected.email}</span>
            </span>
          ) : '— Unassigned —'}
        </span>
        <span className="flex items-center gap-1">
          {selected && (
            <span
              onClick={handleClear}
              className="cursor-pointer rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Clear"
            >
              ✕
            </span>
          )}
          <svg className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown — rendered at fixed position to escape modal overflow */}
      {open && (
        <div style={dropdownStyle} className="rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-2">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 focus-within:border-navy focus-within:ring-1 focus-within:ring-navy">
              <svg className="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}
                  className="shrink-0 text-gray-400 hover:text-gray-600">✕</button>
              )}
            </div>
          </div>

          <ul className="max-h-48 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50
                  ${!value ? 'bg-navy/5 font-medium text-navy' : 'text-gray-500'}`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-xs">—</span>
                Unassigned
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-gray-400">No users found</li>
            ) : (
              filtered.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(u.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${value === u.id ? 'bg-navy/5' : ''}`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/10 text-xs font-bold text-navy">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate font-medium ${value === u.id ? 'text-navy' : 'text-gray-900'}`}>
                        {u.name}
                      </span>
                      <span className="block truncate text-xs text-gray-400">{u.email}</span>
                    </span>
                    {value === u.id && <span className="ml-auto shrink-0 text-navy">✓</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
