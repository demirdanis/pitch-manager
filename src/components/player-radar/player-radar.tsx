'use client';

import { FieldRadarStats, GkRadarStats } from '@/types';
import { ratingColor } from '@/utils';

interface FieldRadarProps {
  stats: FieldRadarStats;
  size?: number;
}

interface GkRadarProps {
  stats: GkRadarStats;
  size?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleIndex: number, total: number) {
  const angle = (Math.PI * 2 * angleIndex) / total - Math.PI / 2;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function buildPolygonPoints(
  labels: string[],
  values: number[],
  cx: number,
  cy: number,
  maxR: number
): string {
  return values
    .map((v, i) => {
      const r = (v / 99) * maxR;
      const pt = polarToCartesian(cx, cy, r, i, values.length);
      return `${pt.x},${pt.y}`;
    })
    .join(' ');
}

function buildGridPoints(cx: number, cy: number, r: number, total: number): string {
  return Array.from({ length: total }, (_, i) => {
    const pt = polarToCartesian(cx, cy, r, i, total);
    return `${pt.x},${pt.y}`;
  }).join(' ');
}

export function FieldRadarChart({ stats, size = 200 }: FieldRadarProps) {
  const labels = Object.keys(stats) as (keyof FieldRadarStats)[];
  const values = labels.map((k) => stats[k]);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const labelR = size * 0.48;

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={buildGridPoints(cx, cy, maxR * level, labels.length)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {labels.map((_, i) => {
        const outer = polarToCartesian(cx, cy, maxR, i, labels.length);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x} y2={outer.y}
            stroke="#1e293b"
            strokeWidth="1"
          />
        );
      })}

      {/* Filled polygon */}
      <polygon
        points={buildPolygonPoints(labels, values, cx, cy, maxR)}
        fill="rgba(34,197,94,0.25)"
        stroke="#22c55e"
        strokeWidth="2"
      />

      {/* Value dots */}
      {values.map((v, i) => {
        const r = (v / 99) * maxR;
        const pt = polarToCartesian(cx, cy, r, i, values.length);
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill={ratingColor(v)}
            stroke="white"
            strokeWidth="1"
          />
        );
      })}

      {/* Labels */}
      {labels.map((label, i) => {
        const pt = polarToCartesian(cx, cy, labelR, i, labels.length);
        const value = values[i];
        return (
          <g key={i}>
            <text
              x={pt.x}
              y={pt.y - 4}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              fontWeight="700"
              letterSpacing="0.5"
            >
              {label}
            </text>
            <text
              x={pt.x}
              y={pt.y + 8}
              textAnchor="middle"
              fill={ratingColor(value)}
              fontSize="10"
              fontWeight="800"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function GkRadarChart({ stats, size = 200 }: GkRadarProps) {
  const labels = Object.keys(stats) as (keyof GkRadarStats)[];
  const values = labels.map((k) => stats[k]);
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const labelR = size * 0.48;

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={buildGridPoints(cx, cy, maxR * level, labels.length)}
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
        />
      ))}

      {labels.map((_, i) => {
        const outer = polarToCartesian(cx, cy, maxR, i, labels.length);
        return (
          <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#1e293b" strokeWidth="1" />
        );
      })}

      <polygon
        points={buildPolygonPoints(labels, values, cx, cy, maxR)}
        fill="rgba(234,179,8,0.25)"
        stroke="#eab308"
        strokeWidth="2"
      />

      {values.map((v, i) => {
        const r = (v / 99) * maxR;
        const pt = polarToCartesian(cx, cy, r, i, labels.length);
        return (
          <circle key={i} cx={pt.x} cy={pt.y} r={3} fill={ratingColor(v)} stroke="white" strokeWidth="1" />
        );
      })}

      {labels.map((label, i) => {
        const pt = polarToCartesian(cx, cy, labelR, i, labels.length);
        const value = values[i];
        return (
          <g key={i}>
            <text x={pt.x} y={pt.y - 4} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="700" letterSpacing="0.5">
              {label}
            </text>
            <text x={pt.x} y={pt.y + 8} textAnchor="middle" fill={ratingColor(value)} fontSize="10" fontWeight="800">
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
