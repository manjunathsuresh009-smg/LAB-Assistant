import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "./ui/Card";
import { cn } from "../lib/format";

const PALETTE = ["#D9B36C", "#7AA7FF", "#5BD6A2", "#F2C063", "#B98E45", "#8C95A8"];

const AXIS = { stroke: "#2A3548", tick: { fill: "#8C95A8", fontSize: 11 } };

interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, action, children, className }: ChartCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-cream">{title}</h3>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: unknown;
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix = "",
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-panel2/95 px-3 py-2 shadow-premium backdrop-blur">
      {label !== undefined && (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      )}
      {payload.map((entry, index) => (
        <p key={index} className="text-xs font-medium text-cream">
          <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {entry.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

export function DepartmentChart({
  data,
}: {
  data: Array<{ name: string; code: string; equipmentCount: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="equipmentCount"
          nameKey="code"
          innerRadius={58}
          outerRadius={92}
          paddingAngle={3}
          stroke="rgba(7,10,18,0.9)"
          strokeWidth={2}
          animationDuration={700}
        >
          {data.map((entry, index) => (
            <Cell key={entry.code} fill={PALETTE[index % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip suffix=" resources" />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function BookingActivityChart({
  data,
}: {
  data: Array<{ label: string; bookings: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D9B36C" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#D9B36C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1D2737" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} />
        <YAxis axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip suffix=" bookings" />} />
        <Area
          type="monotone"
          dataKey="bookings"
          name="Bookings"
          stroke="#D9B36C"
          strokeWidth={2}
          fill="url(#activityFill)"
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function UtilisationChart({
  data,
  height = 240,
}: {
  data: Array<{ name: string; percent: number }>;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1D2737" horizontal={false} />
        <XAxis type="number" axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} unit="%" />
        <YAxis
          type="category"
          dataKey="name"
          width={124}
          axisLine={false}
          tickLine={false}
          tick={{ ...AXIS.tick }}
        />
        <Tooltip content={<ChartTooltip suffix="% utilised" />} />
        <Bar dataKey="percent" name="Utilisation" radius={[0, 6, 6, 0]} animationDuration={800}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={index === 0 ? "#D9B36C" : "#3B4C68"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MostRequestedChart({
  data,
}: {
  data: Array<{ name: string; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1D2737" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ ...AXIS.tick, fontSize: 10 }} interval={0} angle={-16} textAnchor="end" height={54} />
        <YAxis axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip suffix=" requests" />} />
        <Bar dataKey="count" name="Requests" radius={[6, 6, 0, 0]} animationDuration={800}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={index === 0 ? "#D9B36C" : "#7AA7FF"} fillOpacity={index === 0 ? 1 : 0.55} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DepartmentUtilisationChart({
  data,
}: {
  data: Array<{ code: string; utilisationPercent: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1D2737" vertical={false} />
        <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} />
        <YAxis axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} unit="%" />
        <Tooltip content={<ChartTooltip suffix="% utilised" />} />
        <Bar dataKey="utilisationPercent" name="Utilisation" radius={[6, 6, 0, 0]} animationDuration={800}>
          {data.map((entry, index) => (
            <Cell key={entry.code} fill={PALETTE[index % PALETTE.length]} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyUsageChart({
  data,
}: {
  data: Array<{ label: string; hours: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1D2737" vertical={false} />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} />
        <YAxis axisLine={false} tickLine={false} tick={{ ...AXIS.tick }} unit="h" />
        <Tooltip content={<ChartTooltip suffix=" hours" />} />
        <Line
          type="monotone"
          dataKey="hours"
          name="Booked hours"
          stroke="#7AA7FF"
          strokeWidth={2.5}
          dot={{ fill: "#7AA7FF", r: 3 }}
          activeDot={{ r: 5 }}
          animationDuration={900}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export { PALETTE };
