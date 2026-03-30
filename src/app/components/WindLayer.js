"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";

export default function WindLayer() {
  const map = useMap();

  useEffect(() => {
    let velocityLayer;
    let isMounted = true;

    fetch("https://onaci.github.io/leaflet-velocity/wind-global.json")
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) return;

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

        velocityLayer.addTo(map);
      })
      .catch((err) => console.error("Could not load wind data", err));

    return () => {
      isMounted = false;
      if (velocityLayer) {
        try {
          map.removeLayer(velocityLayer);
        } catch (e) {
          // Layer might already be removed
        }

        const velocityCanvas = document.querySelector(".velocity-overlay");
        if (velocityCanvas) velocityCanvas.remove();
      }
    };
  }, [map]);

  return null;
}
