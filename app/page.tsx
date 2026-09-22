"use client";
import { useState } from "react";
import Image from "next/image";
import CountryTypeahead, { type Country } from "./components/CountryTypeahead";

export default function Page() {
  const [selected, setSelected] = useState<Country | null>(null);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 bg-neutral-950 px-6">
      <div className="text-center space-y-1">
        <h1 className="text-white text-2xl font-semibold tracking-tight">
          Find a country
        </h1>
        <p className="text-white/40 text-sm">
          Search by name to explore country details
        </p>
      </div>

      <CountryTypeahead onSelect={setSelected} />

      {selected && (
        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 w-full max-w-md">
          <span className="w-10 h-7 rounded overflow-hidden shrink-0 shadow-sm">
            <Image
              src={selected.flags.png}
              alt={`Flag of ${selected.name}`}
              width={40}
              height={28}
              className="object-cover w-full h-full"
            />
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-sm font-medium truncate">
              {selected.name}
            </span>
            <span className="text-white/40 text-xs mt-0.5">
              {selected.capital ?? "No capital"} · {selected.region}
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
