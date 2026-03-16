'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

// =============================================================================
// Simple Chart Components — SVG-based, no external dependencies
// =============================================================================

// ---------------------------------------------------------------------------
// Bar Chart
// ---------------------------------------------------------------------------

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  barColor?: string;
  className?: string;
}

export function BarChart({ data, height = 200, barColor = 'var(--color-primary)', className }: BarChartProps) {
  const t = useTranslations('features.charts');
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(20, Math.min(60, 600 / data.length));
  const gap = 8;
  const svgWidth = data.length * (barWidth + gap);

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-[200px] text-sm text-muted-foreground', className)}>
        {t('noData')}
      </div>
    );
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <svg width={svgWidth} height={height + 30} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const barHeight = (d.value / max) * height;
          const x = i * (barWidth + gap);
          return (
            <g key={i}>
              <rect
                x={x}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx={4}
              />
              <text
                x={x + barWidth / 2}
                y={height - barHeight - 6}
                textAnchor="middle"
                className="fill-foreground text-[10px]"
              >
                {d.value.toLocaleString()}
              </text>
              <text
                x={x + barWidth / 2}
                y={height + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line Chart
// ---------------------------------------------------------------------------

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  lineColor?: string;
  className?: string;
}

export function LineChart({ data, height = 200, lineColor = 'var(--color-primary)', className }: LineChartProps) {
  const t = useTranslations('features.charts');
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = 30;
  const chartWidth = Math.max(300, data.length * 60);
  const chartHeight = height;

  if (data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-[200px] text-sm text-muted-foreground', className)}>
        {t('noData')}
      </div>
    );
  }

  const points = data.map((d, i) => ({
    x: padding + (i / Math.max(data.length - 1, 1)) * (chartWidth - 2 * padding),
    y: chartHeight - padding - (d.value / max) * (chartHeight - 2 * padding),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className={cn('overflow-x-auto', className)}>
      <svg width={chartWidth} height={chartHeight + 20} role="img" aria-label="Line chart">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding}
            y1={chartHeight - padding - pct * (chartHeight - 2 * padding)}
            x2={chartWidth - padding}
            y2={chartHeight - padding - pct * (chartHeight - 2 * padding)}
            stroke="currentColor"
            strokeOpacity={0.1}
          />
        ))}
        {/* Line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" />
        {/* Dots + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={lineColor} />
            <text
              x={p.x}
              y={chartHeight + 10}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {data[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut/Pie Chart
// ---------------------------------------------------------------------------

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  className?: string;
}

export function DonutChart({ data, size = 160, className }: DonutChartProps) {
  const t = useTranslations('features.charts');
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className={cn('flex items-center justify-center text-sm text-muted-foreground', className)} style={{ height: size }}>
        {t('noData')}
      </div>
    );
  }

  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;
  const cx = size / 2;
  const cy = size / 2;
  let cumulative = 0;

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <svg width={size} height={size} role="img" aria-label="Donut chart">
        {data.map((d, i) => {
          const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
          cumulative += d.value;
          const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
          const largeArc = d.value / total > 0.5 ? 1 : 0;

          const x1 = cx + radius * Math.cos(startAngle);
          const y1 = cy + radius * Math.sin(startAngle);
          const x2 = cx + radius * Math.cos(endAngle);
          const y2 = cy + radius * Math.sin(endAngle);
          const ix1 = cx + innerRadius * Math.cos(endAngle);
          const iy1 = cy + innerRadius * Math.sin(endAngle);
          const ix2 = cx + innerRadius * Math.cos(startAngle);
          const iy2 = cy + innerRadius * Math.sin(startAngle);

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`}
              fill={d.color}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium">{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number; // percentage change
  className?: string;
}

export function StatCard({ label, value, change, className }: StatCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-1', className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {change !== undefined && (
        <p className={cn('text-xs font-medium', change >= 0 ? 'text-status-completed' : 'text-destructive')}>
          {change >= 0 ? '+' : ''}{change}%
        </p>
      )}
    </div>
  );
}
