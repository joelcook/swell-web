"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

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
  const [viewMode, setViewMode] = useState('map');
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [flyToSpot, setFlyToSpot] = useState(null);

  // List view data states
  const [listData, setListData] = useState({});
  const [loadingListData, setLoadingListData] = useState({});
  const [visibleCount, setVisibleCount] = useState(20);
  const [failedSpots, setFailedSpots] = useState({});
  const listContainerRef = useRef(null);
  const fetchingSetRef = useRef(new Set()); 

  useEffect(() => {
    fetch("http://127.0.0.1:8000/all")
      .then((res) => res.json())
      .then((data) => setAllSpots(data))
      .catch((err) => console.error("Map data fetch failed", err));

    loadFavorites();
  }, []);

  const loadFavorites = () => {
    if (typeof window !== "undefined") {
      const history = JSON.parse(localStorage.getItem("swell_history") || "[]");
      const top4 = history.sort((a, b) => b.count - a.count).slice(0, 4);
      setFavorites(top4);
    }
  };

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
    updateHistory(spotName);

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/live/${encodeURIComponent(spotName)}`
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

  const fetchSpotData = async (spotName) => {
    if (fetchingSetRef.current.has(spotName)) return;
    if (listData[spotName] || failedSpots[spotName]) return;
    
    fetchingSetRef.current.add(spotName);
    setLoadingListData(prev => ({ ...prev, [spotName]: true }));
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/live/${encodeURIComponent(spotName)}`);
      
      if (!res.ok) {
        setFailedSpots(prev => ({ ...prev, [spotName]: 'offline' }));
        return;
      }
      
      const data = await res.json();
      
      if (!data || !data.conditions) {
         throw new Error("Invalid data format");
      }

      setListData(prev => ({ ...prev, [spotName]: data }));
    } catch (err) {
      setFailedSpots(prev => ({ ...prev, [spotName]: 'error' }));
    } finally {
      fetchingSetRef.current.delete(spotName);
      setLoadingListData(prev => ({ ...prev, [spotName]: false }));
    }
  };

  const handleMapSearchSelect = useCallback((spot) => {
    setFlyToSpot(spot);
    setMapSearchQuery("");
    if (viewMode === 'list') setViewMode('map'); // Switch to map if searching from list
    handleSpotClick(spot.name);
  }, [handleSpotClick, viewMode]);

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getShortLocation = (name) => {
    const spot = allSpots.find((s) => s.name === name);
    if (!spot) return "---";
    return spot.country.split(",").pop().trim().slice(0, 3).toUpperCase();
  };

  // Filter spots for list view AND map search dropdown
  const filteredSpots = allSpots.filter(spot => 
    spot.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
    spot.country.toLowerCase().includes(mapSearchQuery.toLowerCase())
  );

  const mapSearchResults = mapSearchQuery.length > 0 
    ? filteredSpots.slice(0, 5)
    : [];

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(20);
    setListData({});
    setFailedSpots({});
    fetchingSetRef.current.clear();
  }, [mapSearchQuery]);

  // Infinite scroll handler
  useEffect(() => {
    if (viewMode !== 'list') return;

    const container = listContainerRef.current;
    if (!container) return;

    let debounceTimer;
    const handleScroll = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollTop + clientHeight >= scrollHeight - 400) {
          setVisibleCount(prev => Math.min(prev + 10, filteredSpots.length));
        }
      }, 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(debounceTimer);
    };
  }, [viewMode, filteredSpots.length]);

  // Fetch data for visible spots
  useEffect(() => {
    if (viewMode !== 'list') return;

    const visibleSpots = filteredSpots.slice(0, visibleCount);
    const spotsNeedingData = visibleSpots.filter(spot => 
      !listData[spot.name] && 
      !loadingListData[spot.name] && 
      !failedSpots[spot.name] &&
      !fetchingSetRef.current.has(spot.name)
    );

    const fetchAll = async () => {
      const batchSize = 5;
      for (let i = 0; i < spotsNeedingData.length; i += batchSize) {
        const batch = spotsNeedingData.slice(i, i + batchSize);
        await Promise.all(batch.map(spot => fetchSpotData(spot.name)));
        if (i + batchSize < spotsNeedingData.length) {
          await new Promise(r => setTimeout(r, 50));
        }
      }
    };

    if (spotsNeedingData.length > 0) {
      fetchAll();
    }
  }, [visibleCount, viewMode, filteredSpots]);

  const visibleSpots = filteredSpots.slice(0, visibleCount);

  return (
    <main className="flex h-screen w-screen flex-col bg-slate-950 text-white overflow-hidden">
      
      {/* ------------------------------------------------------------ */}
      {/* HEADER NAV (Surfline Inspired)                               */}
      {/* ------------------------------------------------------------ */}
      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-[2000] relative shrink-0">
        
        {/* LEFT: Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tighter text-white">
              SWELL<span className="text-blue-400 group-hover:text-blue-300 transition-colors">.AI</span>
            </h1>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                viewMode === 'map'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              List
            </button>
            <Link
              href="/about"
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-all"
            >
              About
            </Link>
          </nav>
        </div>

        {/* CENTER: Global Search Bar */}
        <div className="flex-1 max-w-xl mx-4 relative">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-950/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 sm:text-sm transition-all shadow-inner"
              placeholder="Search spots, regions, or buoys..."
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
            />
          </div>

          {/* Search Dropdown Results */}
          {mapSearchQuery.length > 0 && mapSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[2001]">
              <div className="text-[10px] uppercase text-slate-500 bg-slate-900/50 px-3 py-2 border-b border-slate-700 font-bold tracking-wider">
                Sensors Found
              </div>
              {mapSearchResults.map((spot, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMapSearchSelect(spot)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0 flex items-center justify-between group"
                >
                  <div>
                    <div className="text-sm font-medium text-white group-hover:text-blue-300">
                      {spot.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {spot.country}
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-600 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Status */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Network Status</div>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {allSpots.length > 0 ? `${allSpots.length} ONLINE` : "SYNCING..."}
            </div>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ */}
      {/* MAIN CONTENT                                                 */}
      {/* ------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        
        {/* LEFT PANEL: Map or List */}
        <div className="w-full md:w-2/3 h-1/2 md:h-full relative bg-slate-900 border-r border-slate-800">
          
          {viewMode === 'map' ? (
            <SurfMap
              spots={allSpots}
              onSpotSelect={handleSpotClick}
              selectedSpot={selectedSpot}
              flyToSpot={flyToSpot}
              setFlyToSpot={setFlyToSpot}
            />
          ) : (
            // LIST VIEW
            <div 
              ref={listContainerRef}
              className="h-full w-full overflow-y-auto p-4"
            >
              <div className="max-w-2xl mx-auto grid gap-3">
                {filteredSpots.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 opacity-50">
                    <div className="text-6xl mb-4">🌊</div>
                    <p className="text-lg">No spots found matching "{mapSearchQuery}"</p>
                  </div>
                ) : (
                  visibleSpots.map((spot, idx) => {
                    const isSelected = spot.name === selectedSpot;
                    const data = listData[spot.name];
                    const isLoading = loadingListData[spot.name] || fetchingSetRef.current.has(spot.name);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSpotClick(spot.name)}
                        className={`group w-full text-left rounded-xl border transition-all duration-200 overflow-hidden ${
                          isSelected 
                            ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/10' 
                            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-bold text-lg truncate ${
                                isSelected ? 'text-blue-400' : 'text-white group-hover:text-blue-300'
                              }`}>
                                {spot.name}
                              </h3>
                              <p className="text-sm text-slate-400 truncate">
                                {spot.country}
                              </p>
                            </div>
                            {data && (
                              <div className={`text-2xl font-black ${getScoreColor(data.score)}`}>
                                {Math.round(data.score)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isLoading ? (
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-4 gap-2 animate-pulse">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="bg-slate-700/50 rounded h-16"></div>
                              ))}
                            </div>
                          </div>
                        ) : data && data.conditions ? (
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-4 gap-2">
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">Swell</div>
                                <div className="text-sm font-bold text-blue-300">
                                  {data.conditions.swell?.split('@')[0] || '--'}
                                </div>
                                <div className="text-[9px] text-slate-500 mt-0.5">
                                  @{data.conditions.swell?.split('@')[1]?.trim() || '--'}
                                </div>
                              </div>
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">Wind</div>
                                <div className="text-sm font-bold text-emerald-300">
                                  {data.conditions.wind || '--'}
                                </div>
                                <div className="text-[9px] text-slate-500 mt-0.5">
                                  {data.conditions.wind_direction || '--'}
                                </div>
                              </div>
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">Water</div>
                                <div className="text-sm font-bold text-cyan-300">
                                  {data.conditions.water_temp || '--'}
                                </div>
                              </div>
                              <div className="bg-slate-900/50 rounded-lg p-2 text-center">
                                <div className="text-[9px] text-slate-500 uppercase mb-1">Air</div>
                                <div className="text-sm font-bold text-orange-300">
                                  {data.conditions.air_temp || '--'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : failedSpots[spot.name] ? (
                          <div className="px-4 pb-4">
                             <div className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 p-2 rounded text-center">
                               ⚠️ Offline / No Data
                             </div>
                          </div>
                        ) : null}
                      </button>
                    );
                  })
                )}
                
                {visibleCount < filteredSpots.length && (
                  <div className="text-center py-6 text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"></div>
                    <p className="text-xs mt-2">Loading more spots...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Details */}
        <div className="w-full md:w-1/3 h-1/2 md:h-full bg-slate-900 flex flex-col border-l border-slate-800 shadow-xl z-10 relative">
          <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
            {!selectedSpot ? (
              <div className="text-center text-slate-500 animate-pulse">
                <div className="text-6xl mb-4">🌍</div>
                <p>
                  Select a location from the map or list
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
                  <div className={`text-8xl font-black ${getScoreColor(report.score)} drop-shadow-2xl`}>
                    {report.score}
                  </div>
                  <div className="text-slate-500 text-xs mt-4 uppercase tracking-[0.3em]">
                    Surf Quality Index
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                    <div className="text-slate-400 text-[10px] uppercase mb-1">
                      Swell
                    </div>
                    <div className="text-xl font-bold text-blue-300">
                      {report.conditions.swell?.split("@")[0] || "--"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {report.conditions.swell?.split("@")[1] || ""}
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl text-center border border-slate-700">
                    <div className="text-slate-400 text-[10px] uppercase mb-1">
                      Wind
                    </div>
                    <div className="text-xl font-bold text-emerald-300">
                      {report.conditions.wind || "--"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Live Vector</div>
                  </div>

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

          {/* Favorites Footer */}
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
      </div>
    </main>
  );
}