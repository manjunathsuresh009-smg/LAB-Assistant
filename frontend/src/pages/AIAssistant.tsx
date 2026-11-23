import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  Info,
  Sparkles,
  Wand2,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { combineDateTime, defaultBookingDates } from "../lib/format";
import { fadeUp, staggerChildren } from "../lib/motion";
import type { AiRecommendationResponse, Booking, Department } from "../lib/types";
import { EquipmentVisual } from "../components/EquipmentVisual";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Select, Textarea } from "../components/ui/Field";
import { PageHeader, Spinner } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";

const EXAMPLES = [
  "I want to build an IoT-based smart agriculture monitoring system with soil moisture sensors.",
  "Train and deploy an edge AI computer vision model for defect detection.",
  "Build an autonomous robotics rover with motor control and navigation sensors.",
];

export default function AIAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();
  const defaults = useMemo(defaultBookingDates, []);

  const [description, setDescription] = useState("");
  const [result, setResult] = useState<AiRecommendationResponse | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [plan, setPlan] = useState({
    projectName: "",
    projectDescription: "",
    departmentId: "",
    date: defaults.date,
    startTime: defaults.startTime,
    endTime: defaults.endTime,
    deadline: defaults.deadline,
  });
  const [planError, setPlanError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<{ created: number; failed: string[] } | null>(null);

  useEffect(() => {
    api
      .get<{ departments: Department[] }>("/equipment/meta")
      .then((data) => {
        setDepartments(data.departments);
        setPlan((current) => ({ ...current, departmentId: current.departmentId || user?.departmentId || "" }));
      })
      .catch(() => undefined);
  }, [user?.departmentId]);

  const updatePlan = (key: keyof typeof plan) => (event: { target: { value: string } }) =>
    setPlan((current) => ({ ...current, [key]: event.target.value }));

  const recommend = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSummary(null);
    if (description.trim().length < 10) {
      setError("Describe your project in at least 10 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<AiRecommendationResponse>("/ai/recommend-equipment", {
        description: description.trim(),
      });
      setResult(data);
      setSelected(new Set(data.recommendations.slice(0, 3).map((item) => item.equipment.id)));
      setPlan((current) => ({
        ...current,
        projectDescription: current.projectDescription || description.trim(),
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (equipmentId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(equipmentId)) next.delete(equipmentId);
      else next.add(equipmentId);
      return next;
    });
  };

  const createRequests = async () => {
    if (!result) return;
    setPlanError("");
    setSummary(null);
    if (selected.size === 0) {
      setPlanError("Select at least one recommended resource.");
      return;
    }
    if (plan.projectName.trim().length < 3) {
      setPlanError("Give your project a name of at least 3 characters.");
      return;
    }
    if (!plan.departmentId) {
      setPlanError("Select your requesting department.");
      return;
    }
    const startsAt = combineDateTime(plan.date, plan.startTime);
    const endsAt = combineDateTime(plan.date, plan.endTime);
    const deadline = new Date(`${plan.deadline}T23:59:00`);
    if (
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      Number.isNaN(deadline.getTime())
    ) {
      setPlanError("Choose a valid date, time and deadline.");
      return;
    }

    setSubmitting(true);
    const failures: string[] = [];
    let created = 0;

    for (const item of result.recommendations.filter((rec) => selected.has(rec.equipment.id))) {
      try {
        await api.post<{ booking: Booking }>("/bookings", {
          projectName: plan.projectName.trim(),
          projectDescription: (plan.projectDescription || description).trim(),
          equipmentId: item.equipment.id,
          departmentId: plan.departmentId,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          projectDeadline: deadline.toISOString(),
        });
        created += 1;
      } catch (err) {
        failures.push(
          `${item.equipment.name}: ${err instanceof ApiError ? err.message : "request failed"}`
        );
      }
    }

    setSubmitting(false);
    setSummary({ created, failed: failures });
    if (created > 0) {
      push(`${created} booking request${created === 1 ? "" : "s"} submitted for faculty review.`, "success");
    }
    if (failures.length) push(failures[0], "error");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="AI project assistant"
        title="Describe it. We’ll find the kit."
        description="Tell the assistant what you are building. It maps your brief to specialised lab resources and can submit the requests for you."
      />

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <form onSubmit={recommend} className="space-y-4">
              <Textarea
                label="Your project brief"
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Example: I want to build an IoT-based smart agriculture monitoring system that reads soil moisture and controls irrigation…"
                className="min-h-[130px]"
                hint="The more specific the brief, the better the equipment match."
              />
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setDescription(example)}
                    className="rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-1 text-[10px] text-muted transition hover:border-gold/30 hover:text-cream"
                  >
                    {example.length > 48 ? `${example.slice(0, 48)}…` : example}
                  </button>
                ))}
              </div>
              {error && (
                <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-xs text-danger">
                  {error}
                </p>
              )}
              <Button type="submit" loading={loading} className="w-full sm:w-auto">
                <Wand2 className="h-4 w-4" /> Recommend equipment
              </Button>
            </form>
          </Card>

          {loading && <Spinner label="Matching your brief to the catalogue" />}

          {result && !loading && (
            <motion.div initial="hidden" animate="show" variants={staggerChildren} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-cream">Recommendations</h2>
                  <Badge tone={result.source === "gemini" ? "gold" : "blue"}>
                    <BrainCircuit className="h-3 w-3" />
                    {result.source === "gemini" ? "Gemini" : "Rule-based engine"}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      selected.size === result.recommendations.length
                        ? new Set()
                        : new Set(result.recommendations.map((item) => item.equipment.id))
                    )
                  }
                  className="text-[11px] font-medium text-muted hover:text-cream"
                >
                  {selected.size === result.recommendations.length ? "Select none" : "Select all"}
                </button>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 text-[11px] leading-relaxed text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric" />
                <div>
                  <p>{result.summary}</p>
                  <p className="mt-1 text-muted/80">{result.note}</p>
                </div>
              </div>

              {result.recommendations.map((item) => {
                const isSelected = selected.has(item.equipment.id);
                return (
                  <motion.div key={item.equipment.id} variants={fadeUp}>
                    <Card
                      className={`p-4 transition-colors ${
                        isSelected ? "border-gold/35 bg-gold/[0.03]" : "border-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggle(item.equipment.id)}
                          aria-pressed={isSelected}
                          aria-label={`${isSelected ? "Remove" : "Add"} ${item.equipment.name}`}
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                            isSelected
                              ? "border-gold bg-gold text-ink"
                              : "border-white/20 bg-white/[0.02] text-transparent hover:border-gold/50"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <EquipmentVisual category={item.equipment.category} name={item.equipment.name} compact />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <Link
                                to={`/equipment/${item.equipment.id}`}
                                className="text-sm font-semibold text-cream hover:text-goldsoft"
                              >
                                {item.equipment.name}
                              </Link>
                              <p className="text-[10px] uppercase tracking-[0.14em] text-gold/70">
                                {item.equipment.department.code} · {item.equipment.category}
                              </p>
                            </div>
                            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold text-muted">
                              {item.confidence}% match
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] leading-relaxed text-muted">{item.reason}</p>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gold-sheen"
                              style={{ width: `${Math.min(100, item.confidence)}%` }}
                            />
                          </div>
                          {item.matchedKeywords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.matchedKeywords.map((keyword) => (
                                <span key={keyword} className="rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-muted">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-cream">Plan your session</h2>
                <p className="text-[11px] text-muted">{selected.size} resource(s) selected</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Input
                label="Project name"
                value={plan.projectName}
                onChange={updatePlan("projectName")}
                placeholder="Smart agriculture prototype"
              />
              <Textarea
                label="Project description"
                value={plan.projectDescription}
                onChange={updatePlan("projectDescription")}
                className="min-h-[72px]"
                placeholder="Uses the AI brief if left empty"
              />
              <Select label="Requesting department" value={plan.departmentId} onChange={updatePlan("departmentId")}>
                <option value="">Select department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.code} — {department.name}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" value={plan.date} onChange={updatePlan("date")} />
                <Input label="Deadline" type="date" value={plan.deadline} onChange={updatePlan("deadline")} />
                <Input label="Start" type="time" value={plan.startTime} onChange={updatePlan("startTime")} />
                <Input label="End" type="time" value={plan.endTime} onChange={updatePlan("endTime")} />
              </div>
              {planError && (
                <p role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[11px] text-danger">
                  {planError}
                </p>
              )}
              <Button
                className="w-full"
                loading={submitting}
                disabled={!result || selected.size === 0}
                onClick={() => void createRequests()}
              >
                <CheckCircle2 className="h-4 w-4" /> Request {selected.size || ""} selected
              </Button>
            </div>

            {summary && (
              <div className="mt-3 rounded-lg border border-success/20 bg-success/[0.05] px-3 py-2.5 text-[11px] text-success">
                <p className="font-semibold">{summary.created} request(s) submitted.</p>
                {summary.failed.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-danger">
                    {summary.failed.map((failure) => (
                      <li key={failure}>{failure}</li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/bookings")}
                  className="mt-2 inline-flex items-center gap-1 font-semibold underline"
                >
                  View my bookings <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </Card>

          <Card className="border-electric/15 bg-electric/[0.03] p-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-electric">
              <Info className="h-3.5 w-3.5" /> How recommendations work
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              When a Gemini key is configured server-side, the assistant uses Gemini with the live
              catalogue. Otherwise it uses a deterministic keyword engine — clearly labelled as
              rule-based, never presented as an LLM. Requests still require faculty approval.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
