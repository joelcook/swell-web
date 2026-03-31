"use client";
import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useApp } from "../context/AppContext";

export default function FilterBar({ onSearchSelect }) {
  const { spots, filters, setFilters, setSelectedSpot, updateHistory } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const regions = useMemo(() => {
    const countries = [...new Set(spots.map((s) => s.country).filter(Boolean))];
    return countries.sort();
  }, [spots]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 1) return [];
    const q = searchQuery.toLowerCase();
    return spots
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchQuery, spots]);

  const handleSelect = (spot) => {
    setSelectedSpot(spot);
    updateHistory(spot.name);
    setSearchQuery("");
    if (onSearchSelect) onSearchSelect(spot);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[2000] h-14 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-700/50 flex items-center px-4 gap-4">
      {/* Logo */}
      <Link href="/" className="shrink-0 group">
        <h1 className="text-lg font-black tracking-tighter text-white">
          SWELL<span className="text-blue-400 group-hover:text-blue-300 transition-colors">.AI</span>
        </h1>
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-lg relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            className="w-full pl-9 pr-8 py-1.5 bg-zinc-800/60 border border-zinc-700 rounded-lg text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            placeholder="Search spots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden">
            {searchResults.map((spot, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(spot)}
                className="w-full text-left px-3 py-2.5 hover:bg-zinc-700/50 transition-colors border-b border-zinc-700/50 last:border-0 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-white">{spot.name}</div>
                  <div className="text-xs text-zinc-400">{spot.country}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="hidden md:flex items-center gap-2">
        <select
          value={filters.region || ""}
          onChange={(e) =>
            setFilters((f) => ({ ...f, region: e.target.value || null }))
          }
          className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500/50"
        >
          <option value="">All Regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* About link */}
      <Link
        href="/about"
        className="hidden md:block text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition-colors"
      >
        About
      </Link>

      {/* Status indicator */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-mono">{spots.length > 0 ? `${spots.length}` : "..."}</span>
      </div>
    </header>
  );
}
