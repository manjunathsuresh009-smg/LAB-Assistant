import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  RefreshCw,
  Scale,
  Sparkles,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { cn, formatDate, formatDateTime, formatTime, relativeDays } from "../lib/format";
import { fadeUp, staggerChildren } from "../lib/motion";
import type { ConflictCandidate, ConflictResponse, Equipment } from "../lib/types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, PageHeader, Spinner } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";

const FACTORS = [
  { key: "deadlineUrgency", label: "Deadline urgency" },
  { key: "compatibility", label: "Compatibility" },
  { key: "availability", label: "Availability" },
  { key: "fairness", label: "Fairness" },
] as const;

function PriorityRing({ score }: { score: number }) {
  return (
    <div
      className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#D9B36C ${Math.max(0, Math.min(100, score)) * 3.6}deg, rgba(255,255,255,0.07) 0deg)`,
      }}
      aria-label={`Priority score ${score} out of 100`}
    >
      <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-panel">
        <span className="text-xl font-semibold leading-none text-cream">{Math.round(score)}</span>
        <span className="text-[9px] uppercase tracking-wide text-muted">/100</span>
      </div>
    </div>
  );
}

function CandidateCard({
  candidate,
  rank,
  onApprove,
  approving,
}: {
  candidate: ConflictCandidate;
  rank: number;
  onApprove: (candidate: ConflictCandidate) => void;
  approving: boolean;
}) {
  const approved = candidate.recommendation === "APPROVE";
  return (
    <Card
      className={cn(
        "p-4",
        approved ? "border-gold/30 bg-gold/[0.025]" : "border-warn/20 bg-warn/[0.015]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Rank #{rank}
            </span>
            <Badge tone={approved ? "success" : "warn"}>{candidate.recommendation}</Badge>
          </div>
          <h4 className="mt-1.5 truncate text-sm font-semibold text-cream">{candidate.student.name}</h4>
          <p className="truncate text-[11px] text-muted">{candidate.projectName}</p>
        </div>
        <PriorityRing score={candidate.priority.score} />
      </div>

      <div className="mt-3 grid gap-1.5 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 text-electric/70" />
          {formatDateTime(candidate.startsAt)} — {formatTime(candidate.endsAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-gold/70" />
          Deadline {formatDate(candidate.projectDeadline)}
          <span className="font-medium text-warn">({relativeDays(candidate.projectDeadline)})</span>
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted/85">
        {candidate.projectDescription}
      </p>

      <div className="mt-3 space-y-1.5">
        {FACTORS.map((factor) => {
          const detail = candidate.priority.breakdown[factor.key];
          return (
            <div key={factor.key}>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted">
                  {factor.label} <span className="text-muted/60">· {Math.round(detail.weight * 100)}%</span>
                </span>
                <span className="font-semibold text-cream/80">{detail.score.toFixed(1)}</span>
              </div>
              <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gold/70"
                  style={{ width: `${Math.max(0, Math.min(100, detail.score))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2 text-[10px] leading-relaxed text-muted">
        {candidate.explanation}
      </p>

      {candidate.alternativeSlots.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-electric">
            Alternative slots
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {candidate.alternativeSlots.map((slot) => (
              <span
                key={slot.startsAt}
                className="rounded-md border border-electric/20 bg-electric/[0.05] px-2 py-1 text-[10px] text-electricsoft"
              >
                {formatDateTime(slot.startsAt)} — {formatTime(slot.endsAt)}
              </span>
            ))}
          </div>
        </div>
      )}

      {candidate.alternativeEquipment.length > 0 && (
        <div className="mt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold/80">
            Compatible equipment
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {candidate.alternativeEquipment.map((equipment) => (
              <Link
                key={equipment.id}
                to={`/equipment/${equipment.id}`}
                className="rounded-md border border-gold/20 bg-gold/[0.05] px-2 py-1 text-[10px] text-goldsoft hover:bg-gold/[0.1]"
              >
                {equipment.name} · {equipment.freeUnits} free
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <Button
          size="sm"
          variant={approved ? "primary" : "secondary"}
          disabled={!approved}
          loading={approving}
          onClick={() => onApprove(candidate)}
          title={approved ? "Approve this recommendation" : "Offer an alternative slot before approving"}
        >
          <Check className="h-3.5 w-3.5" />
          {approved ? "Approve recommendation" : "Defer · alternative needed"}
        </Button>
      </div>
    </Card>
  );
}

export default function ConflictResolver() {
  const { push } = useToast();
  const [data, setData] = useState<ConflictResponse | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [date, setDate] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ equipment: Equipment[] }>("/equipment")
      .then((result) => setEquipment(result.equipment))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload: { date?: string; equipmentId?: string } = {};
      if (date) payload.date = date;
      if (equipmentId) payload.equipmentId = equipmentId;
      setData(await api.post<ConflictResponse>("/ai/resolve-conflicts", payload));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to analyse conflicts.");
    } finally {
      setLoading(false);
    }
  }, [date, equipmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (candidate: ConflictCandidate) => {
    setApprovingId(candidate.bookingId);
    try {
      await api.patch(`/faculty/requests/${candidate.bookingId}/approve`);
      push(`Approved “${candidate.projectName}”. Allocations recalculated.`, "success");
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Unable to approve this request.", "error");
    } finally {
      setApprovingId(null);
    }
  };

  const conflicts = data?.groups.filter((group) => group.conflictDetected).length ?? 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Smart allocation engine"
        title="Conflict resolution"
        description="Compare overlapping requests with an explainable priority model. The engine recommends; faculty approve."
        actions={
          <>
            <Link to="/faculty">
              <Button variant="secondary" size="sm">
                Approval queue
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" /> Recalculate
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FACTORS.map((factor) => (
          <Card key={factor.key} className="p-4">
            <p className="font-display text-2xl gold-text">
              {Math.round((data?.weights[factor.key] ?? 0) * 100)}%
            </p>
            <p className="mt-1 text-[11px] text-muted">{factor.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
          <div>
            <label className="label" htmlFor="conflict-date">
              Filter by date
            </label>
            <input
              id="conflict-date"
              type="date"
              className="field"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="conflict-equipment">
              Filter by equipment
            </label>
            <select
              id="conflict-equipment"
              className="field"
              value={equipmentId}
              onChange={(event) => setEquipmentId(event.target.value)}
            >
              <option value="">All equipment</option>
              {equipment.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                setDate("");
                setEquipmentId("");
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner label="Analysing overlapping requests" />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Analysis unavailable"
          description={error}
          action={<Button onClick={() => void load()}>Retry</Button>}
        />
      ) : data ? (
        <>
          <Card className="border-gold/20 bg-gold/[0.04] p-4">
            <div className="flex items-start gap-2.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div>
                <p className="text-xs font-semibold text-cream">
                  {data.summary}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  Engine: {data.engine} · {conflicts} overlapping group{conflicts === 1 ? "" : "s"} detected ·
                  generated {formatDateTime(data.generatedAt)}
                </p>
              </div>
            </div>
          </Card>

          {data.groups.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="No pending requests to resolve"
              description="When students submit overlapping requests, they will appear here with a recommended order."
            />
          ) : (
            <motion.div initial="hidden" animate="show" variants={staggerChildren} className="space-y-4">
              {data.groups.map((group) => (
                <motion.div key={`${group.equipment.id}-${group.candidates[0]?.bookingId ?? "empty"}`} variants={fadeUp}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-xl text-cream">{group.equipment.name}</h3>
                          <Badge tone={group.conflictDetected ? "warn" : "success"}>
                            {group.conflictDetected ? "Overlap detected" : "Capacity available"}
                          </Badge>
                          <Badge tone="neutral">{group.equipment.quantity} unit(s)</Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {group.equipment.department.code} · {group.equipment.category} · {group.equipment.location}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                        {group.candidates.length} candidate{group.candidates.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <p className="mt-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                      <span className="font-semibold text-cream/90">Recommendation: </span>
                      {group.summary}
                    </p>

                    <div className="mt-4 grid gap-3 xl:grid-cols-2">
                      {group.candidates.map((candidate, index) => (
                        <CandidateCard
                          key={candidate.bookingId}
                          candidate={candidate}
                          rank={index + 1}
                          onApprove={(item) => void approve(item)}
                          approving={approvingId === candidate.bookingId}
                        />
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      ) : null}

      <p className="text-center text-[10px] leading-relaxed text-muted/60">
        Priority scores are computed from live booking data. Overlaps are resolved provisionally; the API
        re-validates capacity on every approval so equipment can never be double-booked.
      </p>
    </div>
  );
}
