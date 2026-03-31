"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const AppContext = createContext({
  spots: [],
  selectedSpot: null,
  setSelectedSpot: () => {},
  filters: { month: null, skill: null, region: null },
  setFilters: () => {},
  favorites: [],
  updateHistory: () => {},
  clearHistory: () => {},
  engineOffline: false,
});

export function AppProvider({ children }) {
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [filters, setFilters] = useState({ month: null, skill: null, region: null });
  const [favorites, setFavorites] = useState([]);
  const [engineOffline, setEngineOffline] = useState(false);

  // Fetch all spots on mount
  useEffect(() => {
    fetch(`${API_URL}/all`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        setSpots(data);
        setEngineOffline(false);
      })
      .catch(() => {
        setEngineOffline(true);
      });
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const history = JSON.parse(localStorage.getItem("swell_history") || "[]");
    setFavorites(history.sort((a, b) => b.count - a.count).slice(0, 4));
  }, []);

  const updateHistory = useCallback((spotName) => {
    const history = JSON.parse(localStorage.getItem("swell_history") || "[]");
    const idx = history.findIndex((h) => h.name === spotName);
    if (idx >= 0) {
      history[idx].count += 1;
      history[idx].lastVisited = Date.now();
    } else {
      history.push({ name: spotName, count: 1, lastVisited: Date.now() });
    }
    localStorage.setItem("swell_history", JSON.stringify(history));
    setFavorites(history.sort((a, b) => b.count - a.count).slice(0, 4));
  }, []);

  const clearHistory = useCallback(() => {
    localStorage.removeItem("swell_history");
    setFavorites([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        spots,
        selectedSpot,
        setSelectedSpot,
        filters,
        setFilters,
        favorites,
        updateHistory,
        clearHistory,
        engineOffline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

export { API_URL };
