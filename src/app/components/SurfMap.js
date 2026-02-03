"use client";
import { useState } from "react"; // <--- 1. Import useState
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import WindLayer from "./WindLayer";

// Fix for default Leaflet icons (keep this)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function SurfMap({ spots, onSpotSelect, selectedSpot }) {
  // 2. State to control the heavy wind layer (Default to FALSE to save CPU)
  const [showWind, setShowWind] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* 3. Custom Toggle Button (Top Right) */}
      <button
        onClick={() => setShowWind(!showWind)}
        className={`absolute top-4 right-14 z-[1000] px-4 py-2 rounded-lg font-bold text-sm shadow-xl transition-all border ${
          showWind
            ? "bg-cyan-500 text-black border-cyan-400 hover:bg-cyan-400"
            : "bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white"
        }`}
      >
        {showWind ? "🌪️ Wind: ON" : "🌪️ Wind: OFF"}
      </button>

      <MapContainer
        center={[27.46, -80.32]}
        zoom={6}
        zoomControl={false}
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
      >
        <ZoomControl position="topright" />

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

        {/* 4. Conditionally Render WindLayer */}
        {/* If showWind is false, this component unmounts and stops the WebGL loop completely */}
        {showWind && <WindLayer />}

        {spots.map((spot, idx) => {
          const isSelected = spot.name === selectedSpot;
          return (
            <CircleMarker
              key={idx}
              center={[spot.lat, spot.lng]}
              radius={isSelected ? 8 : 5}
              pathOptions={{
                color: isSelected ? "#4ade80" : "#38bdf8",
                fillColor: isSelected ? "#4ade80" : "#38bdf8",
                fillOpacity: 0.7,
              }}
              eventHandlers={{ click: () => onSpotSelect(spot.name) }}
            >
              <Popup className="text-black font-bold">
                {spot.name} <br />
                <span className="text-gray-500 text-xs">{spot.country}</span>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
