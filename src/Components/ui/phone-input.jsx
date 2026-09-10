import React, { useState, useEffect, useMemo, useRef } from "react";
import { Check, ChevronsUpDown, Phone, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { Button } from "@/Components/ui/button";

export const COUNTRIES = [
  // Popular / Priority
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳", placeholder: "98765 43210" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", placeholder: "(555) 019-2834" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", placeholder: "7911 123456" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪", placeholder: "50 123 4567" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", placeholder: "50 123 4567" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", placeholder: "(555) 019-2834" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", placeholder: "412 345 678" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", placeholder: "8123 4567" },
  { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦", placeholder: "3312 3456" },
  { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲", placeholder: "9123 4567" },
  { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼", placeholder: "9123 4567" },
  { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭", placeholder: "3612 3456" },

  // Rest of the world (alphabetical)
  { code: "AF", name: "Afghanistan", dialCode: "+93", flag: "🇦🇫", placeholder: "70 123 4567" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩", placeholder: "1712 345678" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷", placeholder: "11 91234-5678" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳", placeholder: "131 2345 6789" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪", placeholder: "151 23456789" },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬", placeholder: "10 1234 5678" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸", placeholder: "612 34 56 78" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", placeholder: "6 12 34 56 78" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", placeholder: "812 3456 789" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", placeholder: "85 123 4567" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹", placeholder: "312 345 6789" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵", placeholder: "90 1234 5678" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪", placeholder: "712 345678" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰", placeholder: "71 234 5678" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", placeholder: "12 345 6789" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽", placeholder: "55 1234 5678" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", placeholder: "802 123 4567" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱", placeholder: "6 12345678" },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵", placeholder: "984 1234567" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", placeholder: "21 123 4567" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", placeholder: "917 123 4567" },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰", placeholder: "301 2345678" },
  { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺", placeholder: "912 345-67-89" },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪", placeholder: "70 123 45 67" },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭", placeholder: "81 234 5678" },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷", placeholder: "501 234 56 78" },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳", placeholder: "91 234 56 78" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", placeholder: "71 234 5678" },
];

function parsePhoneNumber(rawVal) {
  if (!rawVal) return { country: COUNTRIES[0], nationalNumber: "" };
  const cleaned = String(rawVal).trim();
  if (cleaned.startsWith("+")) {
    // Sort by dial code length descending so +971 is matched before +9
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (cleaned.startsWith(c.dialCode)) {
        const rest = cleaned.slice(c.dialCode.length).trim();
        return { country: c, nationalNumber: rest };
      }
    }
  }
  return { country: COUNTRIES[0], nationalNumber: cleaned };
}

export function PhoneInput({
  value = "",
  onChange,
  id,
  placeholder,
  className,
  disabled = false,
  error = false,
  defaultCountry = "IN",
}) {
  const defaultC = useMemo(
    () => COUNTRIES.find((c) => c.code === defaultCountry) || COUNTRIES[0],
    [defaultCountry],
  );

  const [selectedCountry, setSelectedCountry] = useState(() => {
    const parsed = parsePhoneNumber(value);
    return parsed.country || defaultC;
  });

  const [nationalNumber, setNationalNumber] = useState(() => {
    const parsed = parsePhoneNumber(value);
    return parsed.nationalNumber;
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  // Sync state when external value changes
  useEffect(() => {
    const parsed = parsePhoneNumber(value);
    if (parsed.nationalNumber !== nationalNumber) {
      setNationalNumber(parsed.nationalNumber);
    }
    if (parsed.country && parsed.country.code !== selectedCountry.code && value?.startsWith("+")) {
      setSelectedCountry(parsed.country);
    }
  }, [value]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setOpen(false);
    setSearch("");

    const fullVal = nationalNumber ? `${country.dialCode} ${nationalNumber.trim()}` : "";
    onChange?.(fullVal);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleNumberChange = (e) => {
    const inputVal = e.target.value;
    // Allow digits, spaces, and hyphens only
    const sanitized = inputVal.replace(/[^\d\s-]/g, "");
    setNationalNumber(sanitized);

    const fullVal = sanitized.trim() ? `${selectedCountry.dialCode} ${sanitized.trim()}` : "";
    onChange?.(fullVal);
  };

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border bg-background text-foreground transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:border-primary overflow-hidden",
        error ? "border-destructive focus-within:ring-destructive/30" : "border-input",
        disabled ? "opacity-50 pointer-events-none" : "",
        className,
      )}
    >
      {/* Country Selector Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-9 px-2.5 rounded-none border-r border-border hover:bg-muted/50 gap-1.5 font-normal shrink-0 text-xs focus:ring-0 focus-visible:ring-0"
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="font-semibold text-foreground">{selectedCountry.dialCode}</span>
            <ChevronsUpDown className="h-3 w-3 text-muted-foreground opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[280px] p-0 shadow-lg rounded-xl overflow-hidden border border-border"
          align="start"
          sideOffset={4}
        >
          <div className="flex items-center px-3 py-2 border-b border-border bg-muted/20">
            <Search className="h-3.5 w-3.5 text-muted-foreground mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 text-foreground"
              autoFocus
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto p-1 text-xs">
            {filteredCountries.length === 0 ? (
              <p className="p-3 text-center text-xs text-muted-foreground">No countries found</p>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === selectedCountry.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors hover:bg-muted cursor-pointer",
                      isSelected ? "bg-primary/10 font-semibold text-primary" : "text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-sm leading-none">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 pl-2">
                      <span className="text-muted-foreground font-mono text-[11px]">{c.dialCode}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* National Number Input */}
      <div className="relative flex-1 flex items-center">
        <input
          ref={inputRef}
          id={id}
          type="tel"
          disabled={disabled}
          placeholder={placeholder || selectedCountry.placeholder || "Enter phone number"}
          value={nationalNumber}
          onChange={handleNumberChange}
          className="w-full h-9 bg-transparent px-3 text-xs placeholder:text-muted-foreground/60 outline-none border-none focus:ring-0 focus:outline-none"
        />
      </div>
    </div>
  );
}
