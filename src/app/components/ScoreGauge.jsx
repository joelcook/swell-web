"use client";

function getScoreColor(score) {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function ScoreGauge({ score, size = 120, label }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 1.5; // 270-degree arc
  const center = size / 2;

  // Arc from 135deg to 405deg (270-degree sweep)
  const startAngle = 135;
  const endAngle = 405;
  const sweepAngle = endAngle - startAngle;

  const polarToCartesian = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const describeArc = (start, end) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const clampedScore = Math.max(0, Math.min(100, score ?? 0));
  const fillAngle = startAngle + (clampedScore / 100) * sweepAngle;
  const color = getScoreColor(clampedScore);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background arc */}
        <path
          d={describeArc(startAngle, endAngle)}
          fill="none"
          stroke="#27272a"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Score arc */}
        {clampedScore > 0 && (
          <path
            d={describeArc(startAngle, fillAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Score text */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={size * 0.3}
          fontWeight="900"
          fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        >
          {score != null ? Math.round(score) : "--"}
        </text>
      </svg>
      {label && (
        <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
          {label}
        </span>
      )}
    </div>
  );
}
