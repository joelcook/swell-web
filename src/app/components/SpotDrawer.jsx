"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { X, ChevronDown } from "lucide-react";
import { useApp, API_URL } from "../context/AppContext";
import ScoreGauge from "./ScoreGauge";
import ConditionsGrid from "./ConditionsGrid";
import MonthHeatmap from "./MonthHeatmap";
import SkeletonLoader from "./SkeletonLoader";

const fetcher = (url) => fetch(url).then((r) => {
  if (!r.ok) throw new Error("Fetch failed");
  return r.json();
});

const TABS = ["Now", "Best Months", "Wave Profile", "Trip Info"];

export default function SpotDrawer({ onScoreLoaded }) {
  const { selectedSpot, setSelectedSpot, favorites, updateHistory, clearHistory } = useApp();
  const [activeTab, setActiveTab] = useState("Now");
  const isOpen = selectedSpot != null;

  const { data, error, isLoading } = useSWR(
    selectedSpot
      ? `${API_URL}/live/${encodeURIComponent(selectedSpot.name)}`
      : null,
    fetcher,
    { refreshInterval: 1800000, revalidateOnFocus: false }
  );

  // Reset tab when spot changes
  useEffect(() => {
    setActiveTab("Now");
  }, [selectedSpot?.name]);

  // Report score up to parent for pin coloring
  useEffect(() => {
    if (data?.score != null && selectedSpot?.name && onScoreLoaded) {
      onScoreLoaded(selectedSpot.name, data.score);
    }
  }, [data?.score, selectedSpot?.name, onScoreLoaded]);

  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[1999] md:hidden"
          onClick={() => setSelectedSpot(null)}
        />
      )}

      <div
        className={`fixed z-[2000] bg-zinc-900 border-zinc-700 shadow-2xl transition-transform duration-300 ease-out flex flex-col
          md:top-0 md:right-0 md:h-screen md:w-[380px] md:border-l
          top-auto bottom-0 left-0 right-0 h-[70vh] w-full rounded-t-2xl md:rounded-none border-t md:border-t-0
          ${isOpen ? "translate-x-0 translate-y-0" : "md:translate-x-full translate-y-full md:translate-y-0"}`}
      >
        {/* Drag handle (mobile) */}
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-zinc-800 shrink-0">
          <div className="min-w-0 flex-1 mr-3">
            <h2 className="text-lg font-bold text-white truncate">
              {selectedSpot?.name || "Select a spot"}
            </h2>
            <p className="text-xs text-zinc-500 truncate">
              {selectedSpot?.country || ""}
            </p>
          </div>
          <button
            onClick={() => setSelectedSpot(null)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 shrink-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "Now" && (
            <NowTab data={data} error={error} isLoading={isLoading} />
          )}
          {activeTab === "Best Months" && (
            <MonthHeatmap monthRatings={data?.monthRatings} />
          )}
          {activeTab === "Wave Profile" && (
            <WaveProfileTab spot={selectedSpot} />
          )}
          {activeTab === "Trip Info" && <TripInfoTab />}
        </div>

        {/* Favorites footer */}
        <FavoritesFooter
          favorites={favorites}
          clearHistory={clearHistory}
          onSelect={(name) => {
            const fav = { name };
            setSelectedSpot(fav);
            updateHistory(name);
          }}
        />
      </div>
    </>
  );
}

function NowTab({ data, error, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="w-[120px] h-[120px] bg-zinc-800 rounded-full animate-pulse" />
        </div>
        <SkeletonLoader lines={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-sm">
          Could not reach forecast engine
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <ScoreGauge score={data.score} size={140} label="Surf Quality" />
      </div>
      <ConditionsGrid conditions={data.conditions} />
      {data.conditions?.air_temp && (
        <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50 text-center">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Air Temp</span>
          <div className="text-lg font-bold text-orange-300 mt-1">{data.conditions.air_temp}°F</div>
        </div>
      )}
    </div>
  );
}

function WaveProfileTab({ spot }) {
  if (!spot) return null;
  return (
    <div className="space-y-4">
      <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50">
        <h3 className="text-sm font-bold text-zinc-300 mb-3">Spot Data</h3>
        <div className="space-y-2 text-sm">
          {spot.beach_facing_deg != null && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Beach Facing</span>
              <span className="text-zinc-200 font-mono">{spot.beach_facing_deg}°</span>
            </div>
          )}
          {spot.primary_buoy_id && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Swell Buoy</span>
              <span className="text-zinc-200 font-mono">{spot.primary_buoy_id}</span>
            </div>
          )}
          {spot.wind_station_id && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Wind Station</span>
              <span className="text-zinc-200 font-mono">{spot.wind_station_id}</span>
            </div>
          )}
          {spot.lat != null && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Coordinates</span>
              <span className="text-zinc-200 font-mono text-xs">
                {spot.lat?.toFixed(4)}, {(spot.lon ?? spot.lng)?.toFixed(4)}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="text-center text-xs text-zinc-600 py-4">
        Ideal swell windows and skill levels coming soon
      </div>
    </div>
  );
}

function TripInfoTab() {
  return (
    <div className="text-center py-12">
      <div className="text-zinc-600 text-sm">
        Trip planning data coming soon
      </div>
      <p className="text-zinc-700 text-xs mt-2">
        Crowd ratings, costs, airports, and local tips
      </p>
    </div>
  );
}

function FavoritesFooter({ favorites, clearHistory, onSelect }) {
  if (!favorites || favorites.length === 0) return null;

  return (
    <div className="p-3 border-t border-zinc-800 bg-zinc-900/80 shrink-0">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">
          Recent
        </span>
        <button
          onClick={clearHistory}
          className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {favorites.map((fav) => (
          <button
            key={fav.name}
            onClick={() => onSelect(fav.name)}
            className="shrink-0 px-3 py-1.5 bg-zinc-800 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700 transition-colors truncate max-w-[140px]"
          >
            {fav.name}
          </button>
        ))}
      </div>
    </div>
  );
}
