import { useEffect, useMemo, useState } from 'react';
import { useLayout } from '../../state/LayoutContext';
import suburbsData from '../../data/vicSuburbs.json';

type SuburbRecord = { suburb: string; postcode: string };

const suburbs = suburbsData as SuburbRecord[];

export function LocationInput() {
  const {
    state: {
      form: {
        location: { suburb, postcode },
      },
    },
    updateForm,
  } = useLayout();

  const [query, setQuery] = useState(suburb ?? '');
  const [showList, setShowList] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setQuery(suburb ?? '');
  }, [suburb]);

  const results = useMemo(() => {
    if (!query.trim()) return suburbs.slice(0, 12);
    const normalized = query.trim().toLowerCase();
    return suburbs
      .filter((entry) => entry.suburb.toLowerCase().includes(normalized))
      .slice(0, 12);
  }, [query]);

  const error = touched && !suburb ? 'Select a suburb from the list' : null;

  const applySelection = (entry: SuburbRecord) => {
    setQuery(entry.suburb);
    setShowList(false);
    setTouched(true);
    updateForm((prev) => ({
      ...prev,
      location: { suburb: entry.suburb, postcode: entry.postcode },
    }));
  };

  const clearSelection = () => {
    updateForm((prev) => ({ ...prev, location: { suburb: null, postcode: null } }));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700" htmlFor="location-suburb">
        Suburb
      </label>
      <div className="relative">
        <input
          id="location-suburb"
          type="text"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setShowList(true);
            if (!value.trim()) {
              clearSelection();
            }
          }}
          onFocus={() => setShowList(true)}
          onBlur={() => {
            setTimeout(() => setShowList(false), 100);
            setTouched(true);
            if (!results.some((entry) => entry.suburb === query)) {
              if (suburb) {
                setQuery(suburb);
              } else {
                setQuery('');
                clearSelection();
              }
            }
          }}
          placeholder="Start typing a suburb"
          className={[
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm transition',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-400/50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/30',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-autocomplete="list"
          aria-expanded={showList}
          autoComplete="off"
        />
        {suburb && (
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery('');
              clearSelection();
            }}
            className="absolute inset-y-0 right-2 flex items-center text-xs text-slate-500"
            aria-label="Clear suburb"
          >
            Clear
          </button>
        )}
        {showList && results.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
          >
            {results.map((entry) => (
              <li key={`${entry.suburb}-${entry.postcode}`}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-blue-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applySelection(entry)}
                >
                  <span>{entry.suburb}</span>
                  <span className="text-xs text-slate-500">{entry.postcode}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {postcode && suburb && (
        <p className="text-xs text-slate-500">Selected: {suburb} {postcode}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
