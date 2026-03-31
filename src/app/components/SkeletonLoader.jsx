"use client";

export default function SkeletonLoader({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-zinc-800 rounded animate-pulse"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
