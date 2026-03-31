"use client";
import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
  LayersControl,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import WindLayer from "./WindLayer";
import { useApp } from "../context/AppContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function getScoreColor(score) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function FlyToHandler({ flyToSpot, onFlown }) {
  const map = useMap();
  useEffect(() => {
    if (flyToSpot) {
      map.flyTo([flyToSpot.lat, flyToSpot.lng], 10, { duration: 1.5 });
      onFlown();
    }
  }, [flyToSpot, map, onFlown]);
  return null;
}

export default function SurfMap({ flyToSpot, onFlown, spotScores }) {
  const [showWind, setShowWind] = useState(true);
  const { spots, selectedSpot, setSelectedSpot, updateHistory, filters } = useApp();

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    updateHistory(spot.name);
  };

  // Determine pin visibility based on filters
  const getOpacity = (spot) => {
    if (filters.region && spot.country !== filters.region) return 0.15;
    return selectedSpot?.name === spot.name ? 0.95 : 0.7;
  };

  return (
    <div className="relative w-full h-full">
      <button
        onClick={() => setShowWind(!showWind)}
        className={`absolute top-4 right-14 z-[1000] px-4 py-2 rounded-lg font-bold text-sm shadow-xl transition-all border ${
          showWind
            ? "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400"
            : "bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white"
        }`}
      >
        {showWind ? "Wind: ON" : "Wind: OFF"}
      </button>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
      >
        <ZoomControl position="topright" />
        <FlyToHandler flyToSpot={flyToSpot} onFlown={onFlown} />

        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark Mode">
            <TileLayer
              attribution="&copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution="&copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {showWind && <WindLayer />}

        {spots.map((spot, idx) => {
          const isSelected = selectedSpot?.name === spot.name;
          const score = spotScores?.[spot.name];
          const pinColor = score != null ? getScoreColor(score) : "#38bdf8";

          return (
            <CircleMarker
              key={idx}
              center={[spot.lat, spot.lng]}
              radius={isSelected ? 10 : 6}
              pathOptions={{
                color: isSelected ? "#ffffff" : pinColor,
                fillColor: pinColor,
                fillOpacity: getOpacity(spot),
                weight: isSelected ? 3 : 1.5,
              }}
              eventHandlers={{ click: () => handleSpotClick(spot) }}
            >
              <Popup className="text-black font-bold">
                {spot.name}
                <br />
                <span className="text-gray-500 text-xs">{spot.country}</span>
                {score != null && (
                  <>
                    <br />
                    <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
                      Score: {Math.round(score)}
                    </span>
                  </>
                )}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
