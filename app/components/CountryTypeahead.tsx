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
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-white/30 focus-within:bg-white/8 transition-all duration-200 backdrop-blur-sm">
        {/* Search icon */}
        <svg
          className="w-4 h-4 text-white/40 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M16.5 16.5 L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        <input
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-white/30"
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
            className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/60 animate-spin shrink-0"
          />
        )}
      </div>

      {/* Dropdown panel */}
      {showPanel && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute top-[calc(100%+8px)] left-0 right-0 m-0 p-1.5 list-none bg-neutral-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 max-h-80 overflow-y-auto z-30 backdrop-blur-md"
        >
          {isError && (
            <li className="px-3 py-3 text-sm text-white/40" role="status">
              Couldn&apos;t reach the atlas. Check your connection and try again.
            </li>
          )}
          {isEmpty && (
            <li className="px-3 py-3 text-sm text-white/40" role="status">
              No country matches &ldquo;{query}&rdquo;.
            </li>
          )}
          {data.map((c, i) => (
            <li
              key={c.alpha2Code}
              id={`${listboxId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 ${
                i === activeIndex ? "bg-white/10" : "hover:bg-white/6"
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(c)}
            >
              {/* Flag image */}
              <span className="w-9 h-6 shrink-0 rounded overflow-hidden shadow-sm">
                <Image
                  src={c.flags.png}
                  alt={`Flag of ${c.name}`}
                  width={36}
                  height={24}
                  className="object-cover w-full h-full"
                />
              </span>

              {/* Name + capital */}
              <span className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-white truncate leading-tight">
                  {c.name}
                </span>
                <span className="text-xs text-white/40 mt-0.5 truncate">
                  {c.capital ?? "No capital listed"}
                </span>
              </span>

              {/* Region badge */}
              <span className="text-[10px] font-medium text-white/40 bg-white/8 border border-white/10 rounded-full px-2 py-0.5 shrink-0 uppercase tracking-wide">
                {c.region}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
