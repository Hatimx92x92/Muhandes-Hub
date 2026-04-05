'use client';

import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  RadarChart as RechartsRadarChart,
  Radar,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Label,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// =============================================================================
// Shared analytics chart primitives — shadcn/ui Chart + Recharts v3
//
// Consistent sizing:
//   Cartesian (Area / Bar / Line)  → CHART_HEIGHT  = 'h-[300px]'
//   Pie / Donut                    → SQUARE_SIZE    = 'mx-auto aspect-square max-h-[300px]'
//   Radar                          → SQUARE_SIZE    = 'mx-auto aspect-square max-h-[300px]'
//   Radial gauge                   → GAUGE_SIZE     = 'mx-auto aspect-square max-h-[250px]'
//   Empty state                    → CHART_HEIGHT
// =============================================================================

const CHART_HEIGHT = 'h-[300px]';
const SQUARE_SIZE = 'mx-auto aspect-square h-[300px] max-h-[300px]';
const GAUGE_SIZE = 'mx-auto aspect-square max-h-[250px]';

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyChart({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn(`flex ${CHART_HEIGHT} items-center justify-center text-sm text-muted-foreground`, className)}>
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Area Chart — gradient fill, smooth curve
// ---------------------------------------------------------------------------

interface AnalyticsAreaChartProps {
  data: { label: string; value: number }[];
  config: ChartConfig;
  locale?: string;
  emptyMessage?: string;
  gradientId?: string;
  className?: string;
  tickFormatter?: (value: number) => string;
}

export function AnalyticsAreaChart({
  data,
  config,
  locale = 'en',
  emptyMessage = 'No data',
  gradientId = 'areaGradient',
  className,
  tickFormatter,
}: AnalyticsAreaChartProps) {
  const isRTL = locale === 'ar';
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  return (
    <ChartContainer config={config} className={cn(`${CHART_HEIGHT} w-full`, className)}>
      <AreaChart accessibilityLayer data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fontSize: 12 }}
          reversed={isRTL}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
          orientation={isRTL ? 'right' : 'left'}
          allowDecimals={false}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Area
          type="natural"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Bar Chart — gradient bars, horizontal or vertical layout
// ---------------------------------------------------------------------------

interface AnalyticsBarChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  config: ChartConfig;
  locale?: string;
  emptyMessage?: string;
  layout?: 'horizontal' | 'vertical';
  className?: string;
  tickFormatter?: (value: number) => string;
  dataKey?: string;
  nameKey?: string;
}

export function AnalyticsBarChart({
  data,
  config,
  locale = 'en',
  emptyMessage = 'No data',
  layout = 'horizontal',
  className,
  tickFormatter,
  dataKey = 'value',
  nameKey = 'label',
}: AnalyticsBarChartProps) {
  const isRTL = locale === 'ar';
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  if (layout === 'vertical') {
    return (
      <ChartContainer config={config} className={cn(`${CHART_HEIGHT} w-full`, className)}>
        <RechartsBarChart accessibilityLayer data={data} layout="vertical">
          <CartesianGrid horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 12 }}
            allowDecimals={false}
            tickFormatter={tickFormatter}
          />
          <YAxis
            dataKey={nameKey}
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            width={90}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey={dataKey} fill="var(--color-value)" radius={[0, 6, 6, 0]} />
        </RechartsBarChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={config} className={cn(`${CHART_HEIGHT} w-full`, className)}>
      <RechartsBarChart accessibilityLayer data={data}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.9} />
            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={nameKey}
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fontSize: 12 }}
          reversed={isRTL}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
          orientation={isRTL ? 'right' : 'left'}
          allowDecimals={false}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey={dataKey} fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
      </RechartsBarChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Line Chart — smooth line with custom dots
// ---------------------------------------------------------------------------

interface AnalyticsLineChartProps {
  data: { label: string; value: number }[];
  config: ChartConfig;
  locale?: string;
  emptyMessage?: string;
  className?: string;
  domain?: [number, number];
  ticks?: number[];
  tickFormatter?: (value: number) => string;
}

export function AnalyticsLineChart({
  data,
  config,
  locale = 'en',
  emptyMessage = 'No data',
  className,
  domain,
  ticks,
  tickFormatter,
}: AnalyticsLineChartProps) {
  const isRTL = locale === 'ar';
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  return (
    <ChartContainer config={config} className={cn(`${CHART_HEIGHT} w-full`, className)}>
      <RechartsLineChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tick={{ fontSize: 12 }}
          reversed={isRTL}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 12 }}
          orientation={isRTL ? 'right' : 'left'}
          allowDecimals={false}
          domain={domain}
          ticks={ticks}
          tickFormatter={tickFormatter}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Line
          type="natural"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'var(--color-value)' }}
          activeDot={{ r: 6 }}
        />
      </RechartsLineChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Donut / Pie Chart — centred total label + legend
// ---------------------------------------------------------------------------

interface AnalyticsDonutChartProps {
  data: { label: string; value: number; color: string }[];
  config: ChartConfig;
  emptyMessage?: string;
  totalLabel?: string;
  className?: string;
}

export function AnalyticsDonutChart({
  data,
  config,
  emptyMessage = 'No data',
  totalLabel,
  className,
}: AnalyticsDonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart message={emptyMessage} />;

  return (
    <ChartContainer config={config} className={cn(SQUARE_SIZE, className)}>
      <RechartsPieChart accessibilityLayer>
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          nameKey="label"
          strokeWidth={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
          {totalLabel && (
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 10} className="fill-foreground text-3xl font-bold">
                        {total.toLocaleString()}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 14} className="fill-muted-foreground text-sm">
                        {totalLabel}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          )}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="label" />} />
      </RechartsPieChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Radar Chart — filled polygon on circular grid
// ---------------------------------------------------------------------------

interface AnalyticsRadarChartProps {
  data: { label: string; value: number }[];
  config: ChartConfig;
  emptyMessage?: string;
  className?: string;
  dataKey?: string;
  nameKey?: string;
}

export function AnalyticsRadarChart({
  data,
  config,
  emptyMessage = 'No data',
  className,
  dataKey = 'value',
  nameKey = 'label',
}: AnalyticsRadarChartProps) {
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  return (
    <ChartContainer config={config} className={cn(SQUARE_SIZE, className)}>
      <RechartsRadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
        <PolarGrid gridType="circle" />
        <Radar
          dataKey={dataKey}
          fill="var(--color-value)"
          fillOpacity={0.6}
          stroke="var(--color-value)"
          strokeWidth={2}
        />
      </RechartsRadarChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Radar Chart (multi-series) — for comparing multiple data series
// ---------------------------------------------------------------------------

interface AnalyticsRadarMultiProps {
  data: { label: string; [key: string]: string | number }[];
  config: ChartConfig;
  dataKeys: string[];
  emptyMessage?: string;
  className?: string;
}

export function AnalyticsRadarMultiChart({
  data,
  config,
  dataKeys,
  emptyMessage = 'No data',
  className,
}: AnalyticsRadarMultiProps) {
  if (data.length === 0) return <EmptyChart message={emptyMessage} />;

  const colors = [
    'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
    'var(--chart-4)', 'var(--chart-5)',
  ];

  return (
    <ChartContainer config={config} className={cn(SQUARE_SIZE, className)}>
      <RechartsRadarChart data={data}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <PolarAngleAxis dataKey="label" tick={{ fontSize: 12 }} />
        <PolarGrid gridType="circle" />
        {dataKeys.map((key, i) => (
          <Radar
            key={key}
            dataKey={key}
            fill={colors[i % colors.length]}
            fillOpacity={0.25}
            stroke={colors[i % colors.length]}
            strokeWidth={2}
          />
        ))}
        <ChartLegend content={<ChartLegendContent />} />
      </RechartsRadarChart>
    </ChartContainer>
  );
}

// ---------------------------------------------------------------------------
// Radial Gauge — single-value percentage (win rate, conversion, etc.)
// ---------------------------------------------------------------------------

interface AnalyticsRadialChartProps {
  value: number; // 0–100
  label: string;
  color?: string;
  emptyMessage?: string;
  className?: string;
}

export function AnalyticsRadialChart({
  value,
  label,
  color = 'var(--chart-1)',
  emptyMessage = 'No data',
  className,
}: AnalyticsRadialChartProps) {
  if (value < 0) return <EmptyChart message={emptyMessage} />;

  const chartData = [{ name: label, value: Math.min(value, 100), fill: color }];
  const chartConfig = {
    value: { label, color },
  } satisfies ChartConfig;

  const endAngle = 360 * (Math.min(value, 100) / 100);

  return (
    <ChartContainer config={chartConfig} className={cn(GAUGE_SIZE, className)}>
      <RadialBarChart
        data={chartData}
        startAngle={0}
        endAngle={endAngle}
        innerRadius={80}
        outerRadius={110}
      >
        <PolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background"
          polarRadius={[86, 74]}
        />
        <RadialBar dataKey="value" background cornerRadius={10} />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 8} className="fill-foreground text-4xl font-bold">
                      {value}%
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 18} className="fill-muted-foreground text-sm">
                      {label}
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
      </RadialBarChart>
    </ChartContainer>
  );
}
