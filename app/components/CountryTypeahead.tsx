"use client";

// CountryTypeahead.tsx
// Queries countries.dev (https://countries.dev) — free, no API key, no rate limits.
// Uses TanStack Query for fetching/caching and Tailwind v4 for styling.

import Image from "next/image";
import { useRef, useState, useId } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export type Country = {
  alpha2Code: string;
  name: string;
  capital?: string;
  region: string;
  flag: string;
  flags: { png: string; svg: string };
  population: number;
};

type Props = {
  onSelect?: (country: Country) => void;
  placeholder?: string;
};

const MIN_CHARS = 2;

async function fetchCountries(term: string): Promise<Country[]> {
  const { data } = await axios.get<Country[]>(
    `https://countries.dev/name/${encodeURIComponent(term)}`
  );
  return [...data].sort((a, b) => b.population - a.population).slice(0, 8);
}

export default function CountryTypeahead({
  onSelect,
  placeholder = "Search for a country…",
}: Props) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = useId();

  const enabled = debouncedQuery.trim().length >= MIN_CHARS;

  const { data = [], status } = useQuery({
    queryKey: ["countries", debouncedQuery],
    queryFn: () => fetchCountries(debouncedQuery),
    enabled,
    staleTime: 5 * 60_000,
    // axios throws on 404 — treat it as an empty result rather than an error
    throwOnError: (err) =>
      !(axios.isAxiosError(err) && err.response?.status === 404),
  });

  function handleInputChange(value: string) {
    setQuery(value);
    setOpen(true);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 300);
  }

  function handleSelect(country: Country) {
    setQuery(country.name);
    setDebouncedQuery("");
    setOpen(false);
    setActiveIndex(-1);
    onSelect?.(country);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel || data.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % data.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + data.length) % data.length);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(data[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleBlur(e: React.FocusEvent) {
    // Only close if focus leaves the whole container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false);
    }
  }

  const isLoading = enabled && status === "pending";
  const isError = status === "error";
  const isEmpty = enabled && status === "success" && data.length === 0;
  const showPanel = open && query.trim().length >= MIN_CHARS;

  return (
    <div
      ref={containerRef}
      onBlur={handleBlur}
      className="relative w-full max-w-md font-sans"
    >
      {/* Input field */}
      <div className="flex items-center gap-2.5 bg-[#eceae1] border border-[#c9c4b4] rounded px-3.5 py-3 focus-within:border-[#16231c] focus-within:ring-2 focus-within:ring-[#b8933e]/35 transition-shadow">
        {/* Compass icon */}
        <svg
          className="w-4 h-4 text-[#8a8571] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.3" />
          <path d="M12 12 L15.2 8.8 L13.4 13.4 L8.8 15.2 Z" fill="currentColor" />
        </svg>

        <input
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#16231c] placeholder:text-[#8a8571]"
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {/* Spinner */}
        {isLoading && (
          <span
            aria-hidden="true"
            className="w-3.5 h-3.5 rounded-full border-2 border-[#c9c4b4] border-t-[#b8933e] animate-spin shrink-0"
          />
        )}
      </div>

      {/* Dropdown panel */}
      {showPanel && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 right-0 m-0 py-1 list-none bg-[#f6f4ec] border border-[#c9c4b4] rounded shadow-[0_8px_20px_rgba(22,35,28,0.14)] max-h-80 overflow-y-auto z-30"
        >
          {isError && (
            <li className="px-4 py-3.5 text-[13.5px] text-[#6b7062]" role="status">
              Couldn&apos;t reach the atlas. Check your connection and try again.
            </li>
          )}
          {isEmpty && (
            <li className="px-4 py-3.5 text-[13.5px] text-[#6b7062]" role="status">
              No country matches &ldquo;{query}&rdquo;.
            </li>
          )}
          {data.map((c, i) => (
            <li
              key={c.alpha2Code}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-[#e3e0d3] last:border-b-0 transition-colors ${
                i === activeIndex ? "bg-[#e9e5d6]" : "hover:bg-[#e9e5d6]"
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(c)}
            >
              {/* Flag image */}
              <span className="w-8 h-6 shrink-0 rounded-sm overflow-hidden flex items-center">
                <Image
                  src={c.flags.png}
                  alt={`Flag of ${c.name}`}
                  width={32}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </span>

              {/* Name + meta */}
              <span className="flex flex-col min-w-0">
                <span className="font-serif text-[15.5px] text-[#16231c] truncate">
                  {c.name}
                </span>
                <span className="text-xs text-[#6b7062] mt-px">
                  {c.capital ?? "No capital listed"} · {c.region}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
