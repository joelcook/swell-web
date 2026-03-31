"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getBarColor(value) {
  if (value >= 7) return "#22c55e";
  if (value >= 4) return "#f59e0b";
  return "#ef4444";
}

export default function MonthHeatmap({ monthRatings }) {
  if (!monthRatings || monthRatings.length !== 12) {
    return (
      <div className="text-center py-12">
        <div className="text-zinc-600 text-sm">Historical ratings coming soon</div>
        <p className="text-zinc-700 text-xs mt-2">
          Monthly surf quality data will appear here once available
        </p>
        {/* Placeholder bars */}
        <div className="flex items-end justify-center gap-1.5 mt-6 h-20">
          {MONTHS.map((m, i) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <div
                className="w-5 bg-zinc-800 rounded-t"
                style={{ height: `${20 + Math.random() * 40}px`, opacity: 0.3 }}
              />
              <span className="text-[8px] text-zinc-700">{m}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = MONTHS.map((month, i) => ({
    month,
    rating: monthRatings[i],
  }));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-zinc-300">Best Months to Surf</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: "#71717a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#e4e4e7",
              }}
              formatter={(value) => [`${value}/10`, "Rating"]}
            />
            <Bar dataKey="rating" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry.rating)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
