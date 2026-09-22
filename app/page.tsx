"use client";
import { useState } from "react";
import Image from "next/image";
import CountryTypeahead, { type Country } from "./components/CountryTypeahead";

export default function Page() {
  const [selected, setSelected] = useState<Country | null>(null);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#16231c] px-6">
      <h1 className="font-serif text-[#f6f4ec] text-2xl m-0">
        Find a country
      </h1>
    
      <CountryTypeahead onSelect={setSelected} />

      {selected && (
        <div className="flex items-center gap-3 text-[#c9c4b4] text-sm">
          <span className="w-8 h-6 rounded-sm overflow-hidden shrink-0">
            <Image
              src={selected.flags.png}
              alt={`Flag of ${selected.name}`}
              width={32}
              height={24}
              className="object-cover w-full h-full"
            />
          </span>
          <span>
            <span className="text-[#f6f4ec] font-medium">{selected.name}</span>
            {" — capital "}
            {selected.capital ?? "n/a"}
          </span>
        </div>
      )}
    </main>
  );
}
