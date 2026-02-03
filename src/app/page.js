"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const SurfMap = dynamic(() => import("./components/SurfMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-slate-900 text-blue-400">
      Loading Map...
    </div>
  ),
});

export default function Home() {
  const [allSpots, setAllSpots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // 1. LOAD DATA & HISTORY ON BOOT
  useEffect(() => {
    // Fetch Map Data
    fetch("http://127.0.0.1:8000/all")
      .then((res) => res.json())
      .then((data) => setAllSpots(data))
      .catch((err) => console.error("Map data fetch failed", err));

    // Load History from Local Storage
    loadFavorites();
  }, []);

  // Helper: Read Local Storage and get Top 4
  const loadFavorites = () => {
    const history = JSON.parse(localStorage.getItem("swell_history") || "[]");
    const top4 = history.sort((a, b) => b.count - a.count).slice(0, 4);
    setFavorites(top4);
  };

  // Helper: Add a visit to the history
  const updateHistory = (spotName) => {
    const history = JSON.parse(localStorage.getItem("swell_history") || "[]");
    const existingIndex = history.findIndex((h) => h.name === spotName);

    if (existingIndex >= 0) {
      history[existingIndex].count += 1;
      history[existingIndex].lastVisited = Date.now();
    } else {
      history.push({ name: spotName, count: 1, lastVisited: Date.now() });
    }

    localStorage.setItem("swell_history", JSON.stringify(history));
    loadFavorites();
  };

  const handleSpotClick = async (spotName) => {
    setSelectedSpot(spotName);
    setLoadingReport(true);
    setReport(null);

    // TRACK THE VISIT
    updateHistory(spotName);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/live/${encodeURIComponent(spotName)}`,
      );
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  // Helper to get a short code (e.g. "USA, Hawaii" -> "HI")
  const getShortLocation = (name) => {
    const spot = allSpots.find((s) => s.name === name);
    if (!spot) return "---";
    return spot.country.split(",").pop().trim().slice(0, 3).toUpperCase();
  };

  return (
    <main className="flex h-screen w-screen flex-col md:flex-row bg-slate-950 text-white overflow-hidden">
      {/* LEFT PANEL: MAP */}
      <div className="w-full md:w-2/3 h-1/2 md:h-full relative border-r border-slate-800">
        <SurfMap
          spots={allSpots}
          onSpotSelect={handleSpotClick}
          selectedSpot={selectedSpot}
        />
        <div className="absolute top-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-700 shadow-2xl">
          <h1 className="text-2xl font-black tracking-tighter text-blue-400">
            SWELL<span className="text-white">.AI</span>
          </h1>
          <div className="text-xs text-slate-400 flex gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            {allSpots.length > 0
              ? `${allSpots.length} Sensors Online`
              : "Connecting..."}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-1/3 h-1/2 md:h-full bg-slate-900 flex flex-col border-l border-slate-800 shadow-xl z-10 relative">
        {/* REPORT AREA */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
          {!selectedSpot ? (
            <div className="text-center text-slate-500 animate-pulse">
              <div className="text-6xl mb-4">🌍</div>
              <p>
                Select a location on the map
                <br />
                to initialize physics engine.
              </p>
            </div>
          ) : loadingReport ? (
            <div className="text-blue-400 text-center">
              <div className="text-4xl mb-4 animate-spin">📡</div>
              Scanning NOAA Buoys...
            </div>
          ) : report ? (
            <div className="w-full max-w-sm animate-in fade-in slide-in-from-right duration-500">
              <div className="text-center border-b border-slate-700 pb-6 mb-6">
                <h2 className="text-3xl font-bold leading-tight">
                  {report.name}
                </h2>
                <div className="text-slate-400 mt-2 text-sm uppercase tracking-widest">
                  {report.location}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center py-4">
                <div
                  className={`text-8xl font-black ${getScoreColor(report.score)} drop-shadow-2xl`}
                >
                  {report.score}
                </div>
                <div className="text-slate-500 text-xs mt-4 uppercase tracking-[0.3em]">
                  Surf Quality Index
                </div>
              </div>

              {/* METRICS GRID */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {/* Swell Card */}
                <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase mb-1">
                    Swell
                  </div>
                  <div className="text-xl font-bold text-blue-300">
                    {report.conditions.swell.split("@")[0] || "--"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {report.conditions.swell.split("@")[1] || ""}
                  </div>
                </div>

                {/* Wind Card */}
                <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase mb-1">
                    Wind
                  </div>
                  <div className="text-xl font-bold text-emerald-300">
                    {report.conditions.wind}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Live Vector</div>
                </div>

                {/* NEW: Water & Air Temp Card */}
                <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700 col-span-2 flex items-center justify-between px-8">
                  <div className="text-left">
                    <div className="text-slate-400 text-[10px] uppercase mb-1">
                      Water
                    </div>
                    <div className="text-2xl font-bold text-cyan-300">
                      {report.conditions.water_temp || "--"}
                    </div>
                  </div>
                  <div className="text-right border-l border-slate-700 pl-8">
                    <div className="text-slate-400 text-[10px] uppercase mb-1">
                      Air
                    </div>
                    <div className="text-2xl font-bold text-orange-300">
                      {report.conditions.air_temp || "--"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-400 text-center border border-red-900/50 p-4 rounded bg-red-900/10">
              ⚠️ Station Offline
            </div>
          )}
        </div>

        {/* DYNAMIC HISTORY FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-end mb-2">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              Frequently Visited
            </div>
            {favorites.length > 0 && (
              <button
                onClick={() => {
                  localStorage.removeItem("swell_history");
                  loadFavorites();
                }}
                className="text-[10px] text-slate-600 hover:text-red-400"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {favorites.length === 0 ? (
              <div className="col-span-2 text-center text-xs text-slate-600 py-4 italic">
                Start clicking spots to build your history...
              </div>
            ) : (
              favorites.map((fav, idx) => (
                <button
                  key={fav.name}
                  onClick={() => handleSpotClick(fav.name)}
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-800/80 transition-all text-left"
                >
                  <div className="overflow-hidden">
                    <div className="text-[10px] text-blue-400 group-hover:text-blue-300 font-bold">
                      #{idx + 1} • {fav.count} Visits
                    </div>
                    <div className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
                      {fav.name}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 font-mono bg-slate-900 p-1 rounded ml-2">
                    {getShortLocation(fav.name)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
