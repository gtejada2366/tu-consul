import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
}

export function SearchableSelect({ options, value, onChange, placeholder = "Buscar..." }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Reposition on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open, updatePos]);

  function handleOpen() {
    updatePos();
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
    <>
      {/* Trigger button */}
      <button ref={triggerRef} type="button" onClick={handleOpen}
        className={`${inputClass} flex items-center justify-between gap-2 text-left`}>
        <span className={`truncate ${selected ? "text-foreground" : "text-foreground-secondary"}`}>
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

      {/* Dropdown via portal — renders outside modal overflow */}
      {open && createPortal(
        <div ref={dropdownRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
          className="bg-surface border border-border rounded-[10px] shadow-lg overflow-hidden">
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
        </div>,
        document.body
      )}
    </>
  );
}
