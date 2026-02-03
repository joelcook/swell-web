"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";

export default function WindLayer() {
  const map = useMap();

  useEffect(() => {
    let velocityLayer; // Create a variable to hold the layer instance

    fetch("https://onaci.github.io/leaflet-velocity/wind-global.json")
      .then((response) => response.json())
      .then((data) => {
        // Initialize the layer
        velocityLayer = L.velocityLayer({
          displayValues: true,
          displayOptions: {
            velocityType: "Global Wind",
            position: "bottomleft",
            speedUnit: "kt",
          },
          data: data,
          maxVelocity: 15,
          velocityScale: 0.005,
        });

        // Add it to the map
        velocityLayer.addTo(map);
      })
      .catch((err) => console.error("Could not load wind data", err));

    // --- THE FIX: CLEANUP FUNCTION ---
    return () => {
      if (velocityLayer) {
        console.log("🌪️ Removing Wind Layer from Leaflet map...");
        map.removeLayer(velocityLayer);

        // Leaflet-velocity adds a canvas to the map pane.
        // We ensure any stray canvas elements are removed.
        const velocityCanvas = document.querySelector(".velocity-overlay");
        if (velocityCanvas) velocityCanvas.remove();
      }
    };
  }, [map]);

  return null;
}
