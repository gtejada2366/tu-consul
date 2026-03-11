import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { inputClass } from "../modals/form-classes";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function SearchableSelect({ options, value, onChange, placeholder = "Buscar..." }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleOpen() {
    setOpen(true);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSelect(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSearch("");
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button type="button" onClick={handleOpen}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}>
        <span className={selected ? "text-foreground" : "text-foreground-secondary"}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected && (
            <span onClick={handleClear} className="p-0.5 hover:bg-border rounded transition-colors">
              <X className="w-3.5 h-3.5 text-foreground-secondary" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-foreground-secondary transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-[10px] shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-4 h-4 text-foreground-secondary flex-shrink-0" />
            <input ref={inputRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Escribir para buscar..."
              className="flex-1 bg-transparent text-[0.875rem] text-foreground placeholder:text-foreground-secondary focus:outline-none" />
          </div>
          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? filtered.map(o => (
              <button key={o.value} type="button" onClick={() => handleSelect(o.value)}
                className={`w-full text-left px-3 py-2.5 text-[0.875rem] transition-colors hover:bg-surface-alt
                  ${o.value === value ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}>
                {o.label}
              </button>
            )) : (
              <p className="px-3 py-4 text-[0.8125rem] text-foreground-secondary text-center">
                No se encontraron resultados
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
