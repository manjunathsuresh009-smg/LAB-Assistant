import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Clock3,
  Gauge,
  Scale,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatPercent } from "../lib/format";
import { fadeUp, staggerChildren } from "../lib/motion";
import type { DashboardAnalytics } from "../lib/types";
import {
  BookingActivityChart,
  ChartCard,
  DepartmentChart,
  MostRequestedChart,
  UtilisationChart,
} from "../components/Charts";
import { Badge, StatusBadge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, PageHeader, Spinner } from "../components/ui/Feedback";
import { StatCard } from "../components/ui/StatCard";

const TONE_STYLES = {
  warning: "border-warn/20 bg-warn/[0.05] text-warn",
  opportunity: "border-success/20 bg-success/[0.05] text-success",
  info: "border-electric/20 bg-electric/[0.05] text-electric",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await api.get<DashboardAnalytics>("/analytics/dashboard"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isStaff = user?.role === "FACULTY" || user?.role === "ADMIN";

  if (loading && !data) return <Spinner label="Loading campus intelligence" />;

  if (error && !data) {
    return (
      <EmptyState
        icon={Gauge}
        title="Dashboard unavailable"
        description={error}
        action={<Button onClick={() => void load()}>Try again</Button>}
      />
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campus overview"
        title={`${greeting()}, ${user?.name?.split(" ")[0] ?? "there"}.`}
        description={
          isStaff
            ? "Monitor lab demand, pending approvals and utilisation across every department."
            : "Discover specialised equipment, plan your project access and track your requests."
        }
        actions={
          <>
            <Link to="/equipment">
              <Button variant="secondary" size="sm">
                <Boxes className="h-4 w-4" /> Browse equipment
              </Button>
            </Link>
            <Link to={isStaff ? "/conflicts" : "/assistant"}>
              <Button size="sm">
                {isStaff ? <Scale className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {isStaff ? "Resolve conflicts" : "AI assistant"}
              </Button>
            </Link>
          </>
        }
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={staggerChildren}
        className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      >
        <StatCard label="Equipment" value={data.counts.equipment} icon={Boxes} hint="Across all departments" />
        <StatCard
          label="Available"
          value={data.counts.availableEquipment}
          icon={CheckCircle2}
          accent="green"
          hint="Ready to book"
        />
        <StatCard
          label="Active bookings"
          value={data.counts.activeBookings}
          icon={Activity}
          accent="blue"
          hint="Happening now"
        />
        <StatCard label="Pending" value={data.counts.pendingRequests} icon={Clock3} hint="Awaiting faculty" />
        <StatCard
          label="Departments"
          value={data.counts.departments}
          icon={Building2}
          accent="blue"
          hint="Contributing resources"
        />
        <StatCard
          label="Utilisation"
          value={formatPercent(data.utilisationPercent)}
          icon={Gauge}
          accent="green"
          hint={`${data.window.days}-day window`}
        />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Department-wise equipment" subtitle="Distribution of physical lab resources">
          <DepartmentChart data={data.departmentDistribution} />
        </ChartCard>
        <ChartCard title="Booking activity" subtitle="Requests by scheduled start date · last 7 days">
          <BookingActivityChart data={data.bookingActivity} />
        </ChartCard>
        <ChartCard title="Equipment utilisation" subtitle="Top resources within the 14-day window">
          {data.utilisationByEquipment.length ? (
            <UtilisationChart data={data.utilisationByEquipment} />
          ) : (
            <EmptyState icon={Gauge} title="No utilisation data yet" className="border-0 py-10" />
          )}
        </ChartCard>
        <ChartCard title="Most requested equipment" subtitle="Ranked by total booking requests">
          {data.mostRequested.length ? (
            <MostRequestedChart data={data.mostRequested} />
          ) : (
            <EmptyState icon={TrendingUp} title="No requests yet" className="border-0 py-10" />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-cream">Actionable insights</h3>
              <p className="text-[11px] text-muted">Generated from live booking records</p>
            </div>
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          {data.recommendations.length ? (
            <div className="space-y-2.5">
              {data.recommendations.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-xl border px-3.5 py-3 ${TONE_STYLES[item.tone]}`}
                >
                  <p className="text-xs font-semibold text-cream">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">Utilisation is balanced across departments.</p>
          )}
          {isStaff && (
            <Link
              to="/analytics"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:underline"
            >
              Open analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-cream">Recent activity</h3>
              <p className="text-[11px] text-muted">Latest requests across the campus</p>
            </div>
            <Link
              to={isStaff ? "/faculty" : "/bookings"}
              className="text-[11px] font-semibold text-gold hover:underline"
            >
              View all
            </Link>
          </div>
          <motion.div initial="hidden" animate="show" variants={staggerChildren} className="space-y-2">
            {data.recentActivity.map((item) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-cream">{item.projectName}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted">
                    {item.student} · {item.equipment}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={item.status} />
                  <span className="text-[9px] text-muted/60">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
          {!data.recentActivity.length && (
            <p className="py-6 text-center text-xs text-muted">No recent activity.</p>
          )}
        </Card>
      </div>

      <Card className="flex flex-col items-start justify-between gap-4 border-gold/15 bg-gold/[0.03] p-5 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold text-gold">
            <Badge tone="gold">Demo data</Badge> 16 resources · 5 departments · persistent SQLite storage
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Every number on this dashboard is calculated live from the database — no hardcoded analytics.
          </p>
        </div>
        <Link to={isStaff ? "/faculty" : "/equipment"}>
          <Button variant="secondary" size="sm">
            {isStaff ? "Review pending requests" : "Find equipment"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </Card>
    </div>
  );
}
