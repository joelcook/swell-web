"use client";
import { Waves, Wind, Compass, Thermometer, Droplets, Sun } from "lucide-react";

function Cell({ icon: Icon, label, value, unit, color = "text-zinc-100" }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-3 flex flex-col items-center text-center border border-zinc-700/50">
      <Icon className="w-4 h-4 text-zinc-500 mb-1.5" />
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value ?? "--"}</span>
      {unit && <span className="text-[10px] text-zinc-600 mt-0.5">{unit}</span>}
    </div>
  );
}

export default function ConditionsGrid({ conditions }) {
  if (!conditions) return null;

  // Parse swell string like "4.3ft @ 13s"
  const swellParts = conditions.swell?.split("@") || [];
  const swellHeight = swellParts[0]?.trim() || "--";
  const swellPeriod = swellParts[1]?.trim() || "--";

  const swellDir = conditions.swell_dir != null
    ? `${Math.round(conditions.swell_dir)}°`
    : "--";

  const windDir = conditions.wind_direction || conditions.wind_dir || "--";
  const windDisplay = typeof windDir === "number" ? `${Math.round(windDir)}°` : windDir;

  return (
    <div className="grid grid-cols-3 gap-2">
      <Cell icon={Waves} label="Swell" value={swellHeight} color="text-blue-300" />
      <Cell icon={Waves} label="Period" value={swellPeriod} color="text-blue-200" />
      <Cell icon={Compass} label="Swell Dir" value={swellDir} color="text-blue-100" />
      <Cell icon={Wind} label="Wind" value={conditions.wind || "--"} color="text-emerald-300" />
      <Cell icon={Wind} label="Wind Dir" value={windDisplay} color="text-emerald-200" />
      <Cell icon={Droplets} label="Water" value={conditions.water_temp ? `${conditions.water_temp}°` : "--"} color="text-cyan-300" />
    </div>
  );
}
