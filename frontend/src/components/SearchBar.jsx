import { Search, X } from 'lucide-react';

/** Search input with a clear button, used across directory pages. */
export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '', label = 'Search' }) {
  return (
    <div className={`relative ${className}`}>
      <label className="sr-only" htmlFor={`search-${label.replace(/\s+/g, '-').toLowerCase()}`}>
        {label}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" aria-hidden="true" />
      <input
        id={`search-${label.replace(/\s+/g, '-').toLowerCase()}`}
        type="search"
        className="input pl-9 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
