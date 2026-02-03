"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-velocity";
import "leaflet-velocity/dist/leaflet-velocity.css";

export default function WindLayer() {
  const map = useMap();

  useEffect(() => {
    // 1. Fetch a Sample GFS Wind File (This is the tricky part!)
    // For now, we use a static demo file to initialize the UI.
    // In the future, your Python backend will generate this from NOAA GFS data.
    fetch("https://onaci.github.io/leaflet-velocity/wind-global.json")
      .then((response) => response.json())
      .then((data) => {
        const velocityLayer = L.velocityLayer({
          displayValues: true,
          displayOptions: {
            velocityType: "Global Wind",
            position: "bottomleft",
            emptyString: "No wind data",
            angleConvention: "bearingCW",
            displayPosition: "bottomleft",
            displayEmptyString: "No wind data",
            speedUnit: "kt",
          },
          data: data, // <--- The Grid Data
          maxVelocity: 15,
          velocityScale: 0.005, // Adjust this to make particles faster/slower
        });

        velocityLayer.addTo(map);

        // Cleanup: Remove layer when component unmounts
        return () => {
          velocityLayer.remove();
        };
      })
      .catch((err) => console.error("Could not load wind data", err));
  }, [map]);

  return null;
}
