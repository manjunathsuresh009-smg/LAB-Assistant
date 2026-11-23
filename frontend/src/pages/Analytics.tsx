import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarRange,
  Clock3,
  Gauge,
  RefreshCw,
  ServerCog,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { formatPercent } from "../lib/format";
import type { UtilisationAnalytics } from "../lib/types";
import {
  ChartCard,
  DepartmentUtilisationChart,
  MonthlyUsageChart,
  MostRequestedChart,
  UtilisationChart,
} from "../components/Charts";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, PageHeader, Spinner } from "../components/ui/Feedback";
import { StatCard } from "../components/ui/StatCard";

const TONE_STYLES = {
  warning: "border-warn/20 bg-warn/[0.05] text-warn",
  opportunity: "border-success/20 bg-success/[0.05] text-success",
  info: "border-electric/20 bg-electric/[0.05] text-electric",
};

export default function Analytics() {
  const [data, setData] = useState<UtilisationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.get<UtilisationAnalytics>("/analytics/utilisation"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) return <Spinner label="Calculating utilisation" />;

  if (error && !data) {
    return (
      <EmptyState
        icon={Gauge}
        title="Analytics unavailable"
        description={error}
        action={<Button onClick={() => void load()}>Retry</Button>}
      />
    );
  }

  if (!data) return null;

  const lastMonth = data.monthlyUsage[data.monthlyUsage.length - 1];
  const topEquipment = data.byEquipment.slice(0, 8).map((row) => ({
    name: row.name,
    percent: row.utilisationPercent,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Resource intelligence"
        title="Utilisation analytics"
        description="Department-wise utilisation, demand patterns and underused resources computed from live booking records."
        actions={
          <>
            <Link to="/conflicts">
              <Button variant="secondary" size="sm">
                Resolve conflicts
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Overall utilisation"
          value={formatPercent(data.utilisationPercent)}
          hint={`${data.window.days}-day rolling window`}
          icon={Gauge}
          accent="green"
        />
        <StatCard
          label="Operating hours"
          value={`${data.window.operatingHoursPerDay}h`}
          hint="Modelled bookable hours per day"
          icon={Clock3}
        />
        <StatCard
          label="Resources tracked"
          value={data.byEquipment.length}
          hint="Across every department"
          icon={ServerCog}
          accent="blue"
        />
        <StatCard
          label="Last month"
          value={`${lastMonth?.hours ?? 0}h`}
          hint="Booked lab hours"
          icon={CalendarRange}
          accent="blue"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Monthly usage trend" subtitle="Approved and completed booking hours">
          <MonthlyUsageChart data={data.monthlyUsage} />
        </ChartCard>
        <ChartCard title="Department utilisation" subtitle="Booked hours against modelled capacity">
          <DepartmentUtilisationChart data={data.byDepartment} />
        </ChartCard>
        <ChartCard title="Top equipment utilisation" subtitle="Highest demand resources">
          {topEquipment.length ? (
            <UtilisationChart data={topEquipment} height={280} />
          ) : (
            <EmptyState icon={Gauge} title="No equipment data" className="border-0 py-10" />
          )}
        </ChartCard>
        <ChartCard title="Most requested equipment" subtitle="Total request volume by resource">
          <MostRequestedChart data={data.mostRequested.slice(0, 6)} />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-cream">Underutilised resources</h3>
              <p className="text-[11px] text-muted">Below 5% utilisation in the current window</p>
            </div>
            <Badge tone="warn">
              <TrendingUp className="h-3 w-3" /> Opportunity
            </Badge>
          </div>
          {data.underutilised.length ? (
            <div className="space-y-2">
              {data.underutilised.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <Link to={`/equipment/${item.id}`} className="truncate text-xs font-semibold text-cream hover:text-goldsoft">
                      {item.name}
                    </Link>
                    <p className="truncate text-[10px] text-muted">
                      {item.department} · {item.category} · {item.quantity} unit(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-warn">{formatPercent(item.utilisationPercent)}</p>
                    <p className="text-[9px] text-muted">{item.bookedHours}h booked</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-success/15 bg-success/[0.04] px-3 py-3 text-[11px] text-success">
              Every resource is above the 5% utilisation threshold.
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <div>
              <h3 className="text-sm font-semibold text-cream">Actionable recommendations</h3>
              <p className="text-[11px] text-muted">Generated from the current utilisation data</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {data.recommendations.map((item) => (
              <div key={item.title} className={`rounded-xl border px-3.5 py-3 ${TONE_STYLES[item.tone]}`}>
                <p className="text-xs font-semibold text-cream">{item.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <p className="text-[10px] leading-relaxed text-muted/70">
          Utilisation is calculated as booked hours divided by modelled capacity ({data.window.days} days ×{" "}
          {data.window.operatingHoursPerDay} operating hours × equipment quantity) for approved and completed
          bookings within {new Date(data.window.start).toLocaleDateString()} –{" "}
          {new Date(data.window.end).toLocaleDateString()}. No metrics are hardcoded.
        </p>
      </Card>
    </div>
  );
}
