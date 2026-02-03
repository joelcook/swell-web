"use client";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. SEARCH FUNCTION
  const handleSearch = async (e) => {
    const q = e.target.value;
    setQuery(q);

    if (q.length > 2) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/search?q=${q}`);
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error("API Error", err);
      }
    } else {
      setResults([]);
    }
  };

  // 2. GET LIVE REPORT
  const fetchReport = async (spotName) => {
    setLoading(true);
    setResults([]); // Hide dropdown
    setQuery(spotName); // Set name in bar
    setError(null);
    setReport(null);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/live/${encodeURIComponent(spotName)}`,
      );
      if (!res.ok) throw new Error("Spot Offline");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      setError("Could not fetch live data. Buoys might be down.");
    } finally {
      setLoading(false);
    }
  };

  // Helper for Score Color
  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-slate-900 text-white font-mono">
      {/* HEADER */}
      <h1 className="text-4xl font-bold mb-8 tracking-tighter text-blue-400">
        SWELL<span className="text-white">.AI</span>
      </h1>

      {/* SEARCH BAR */}
      <div className="relative w-full max-w-md">
        <input
          type="text"
          placeholder="Search spot (e.g., Pipeline, Trestles)..."
          className="w-full p-4 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-blue-500 transition"
          value={query}
          onChange={handleSearch}
        />

        {/* DROPDOWN RESULTS */}
        {results.length > 0 && (
          <div className="absolute top-full left-0 w-full bg-slate-800 border border-slate-700 mt-2 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
            {results.map((spot, idx) => (
              <div
                key={idx}
                className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-0"
                onClick={() => fetchReport(spot.name)}
              >
                <div className="font-bold text-sm">{spot.name}</div>
                <div className="text-xs text-slate-400">{spot.country}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="mt-12 animate-pulse text-blue-400">
          📡 Connecting to NOAA Satellites...
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="mt-12 text-red-400 bg-red-900/20 p-4 rounded border border-red-900">
          ⚠️ {error}
        </div>
      )}

      {/* REPORT CARD */}
      {report && !loading && (
        <div className="mt-8 w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl">
          <div className="text-center border-b border-slate-700 pb-4 mb-4">
            <h2 className="text-2xl font-bold">{report.name}</h2>
            <div className="text-slate-400 text-sm">{report.location}</div>
          </div>

          {/* SCORE GAUGE */}
          <div className="flex flex-col items-center justify-center py-6">
            <div
              className={`text-6xl font-black ${getScoreColor(report.score)}`}
            >
              {report.score}
            </div>
            <div className="text-slate-500 text-sm mt-2 uppercase tracking-widest">
              Surf Quality
            </div>
          </div>

          {/* TELEMETRY GRID */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {/* SWELL */}
            <div className="bg-slate-900/50 p-4 rounded-lg text-center border border-slate-700">
              <div className="text-slate-400 text-xs uppercase mb-1">
                Swell Height
              </div>
              <div className="text-xl font-bold text-blue-300">
                {report.conditions.swell.split("@")[0]}
              </div>
              <div className="text-xs text-slate-500">
                Period: {report.conditions.swell.split("@")[1]}
              </div>
            </div>

            {/* WIND */}
            <div className="bg-slate-900/50 p-4 rounded-lg text-center border border-slate-700">
              <div className="text-slate-400 text-xs uppercase mb-1">
                Wind Speed
              </div>
              <div className="text-xl font-bold text-emerald-300">
                {report.conditions.wind}
              </div>
              <div className="text-xs text-slate-500">Live Sensor Data</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
