import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Loader2, MapPin } from "lucide-react";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;

const queryCache = new Map();

export function LocationAutocomplete({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  labelClassName,
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);
  const selectedRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = value?.trim() || "";
    if (q.length < MIN_QUERY_LENGTH) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      setError(false);
      return;
    }
    // Don't refetch right after a suggestion was selected.
    if (selectedRef.current === value) return;

    // Serve repeated queries instantly from the in-memory cache.
    const cached = queryCache.get(q);
    if (cached) {
      setOptions(cached);
      setOpen(true);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    const timer = setTimeout(async () => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=${RESULT_LIMIT}&countrycodes=in&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        const results = Array.isArray(data)
          ? data.map((d) => ({
              id: d.place_id,
              label: d.display_name,
            }))
          : [];
        queryCache.set(q, results);
        setOptions(results);
        setOpen(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(true);
          setOptions([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controllerRef.current?.abort();
    };
  }, [value]);

  const handleSelect = (option) => {
    selectedRef.current = option.label;
    setOptions([]);
    setOpen(false);
    onChange(option.label);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={labelClassName || "text-sm font-medium text-foreground"}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          value={value || ""}
          onChange={(e) => {
            selectedRef.current = null;
            onChange(e.target.value);
          }}
          onFocus={() => {
            if (options.length) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className={`bg-background focus-visible:ring-primary focus-visible:border-primary transition-all duration-200 shadow-sm ${className || ""}`}
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[220px] overflow-y-auto rounded-[12px] border border-border bg-popover p-1 shadow-xl">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching locations…
              </div>
            ) : error ? (
              <p className="px-3 py-2.5 text-[13px] text-muted-foreground">
                Couldn't load locations. Please type again.
              </p>
            ) : options.length ? (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] text-foreground transition-colors hover:bg-accent"
                >
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="leading-snug">{option.label}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2.5 text-[13px] text-muted-foreground">No locations found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
