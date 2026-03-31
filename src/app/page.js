"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useApp } from "./context/AppContext";
import SpotDrawer from "./components/SpotDrawer";
import FilterBar from "./components/FilterBar";

const SurfMap = dynamic(() => import("./components/SurfMap"), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
      <div className="text-blue-400 text-sm font-mono animate-pulse">Loading Map...</div>
    </div>
  ),
});

export default function Home() {
  const { engineOffline } = useApp();
  const [flyToSpot, setFlyToSpot] = useState(null);
  const [spotScores, setSpotScores] = useState({});

  const handleFlown = useCallback(() => setFlyToSpot(null), []);

  const handleSearchSelect = useCallback((spot) => {
    setFlyToSpot(spot);
  }, []);

  const handleScoreLoaded = useCallback((name, score) => {
    setSpotScores((prev) => ({ ...prev, [name]: score }));
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* Full-screen map */}
      <SurfMap
        flyToSpot={flyToSpot}
        onFlown={handleFlown}
        spotScores={spotScores}
      />

      {/* Overlay: Filter bar */}
      <FilterBar onSearchSelect={handleSearchSelect} />

      {/* Overlay: Spot drawer */}
      <SpotDrawer onScoreLoaded={handleScoreLoaded} />

      {/* Engine offline banner */}
      {engineOffline && (
        <div className="fixed bottom-0 left-0 right-0 z-[3000] bg-red-900/90 backdrop-blur-sm text-white text-center py-2 text-sm font-medium border-t border-red-700">
          Forecast engine offline — start the backend with{" "}
          <code className="bg-red-800 px-1.5 py-0.5 rounded text-xs">uvicorn api:app --reload</code>
        </div>
      )}
    </main>
  );
}
