import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers,
  MapPin,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import {
  combineDateTime,
  defaultBookingDates,
  formatDateTime,
  formatTime,
} from "../lib/format";
import type { Booking, Department, Equipment as EquipmentType } from "../lib/types";
import { EquipmentVisual } from "../components/EquipmentVisual";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input, Select, Textarea } from "../components/ui/Field";
import { EmptyState, Spinner } from "../components/ui/Feedback";
import { useToast } from "../components/ui/Toast";

function parseFieldErrors(details: unknown): Record<string, string> {
  if (!Array.isArray(details)) return {};
  const map: Record<string, string> = {};
  for (const item of details) {
    if (item && typeof item === "object" && "field" in item && "message" in item) {
      const field = String((item as { field: unknown }).field);
      map[field] = String((item as { message: unknown }).message);
    }
  }
  return map;
}

export default function EquipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const [equipment, setEquipment] = useState<EquipmentType | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const defaults = useMemo(defaultBookingDates, []);
  const [form, setForm] = useState({
    projectName: "",
    projectDescription: "",
    additionalRequirements: "",
    departmentId: "",
    date: defaults.date,
    startTime: defaults.startTime,
    endTime: defaults.endTime,
    deadline: defaults.deadline,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alternatives, setAlternatives] = useState<Array<{ startsAt: string; endsAt: string }>>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get<{ equipment: EquipmentType }>(`/equipment/${id}`),
      api.get<{ departments: Department[] }>("/equipment/meta"),
    ])
      .then(([detail, meta]) => {
        if (!active) return;
        setEquipment(detail.equipment);
        setDepartments(meta.departments);
        setForm((current) => ({
          ...current,
          departmentId: current.departmentId || user?.departmentId || detail.equipment.departmentId,
        }));
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : "Unable to load this equipment.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user?.departmentId]);

  const update = (key: keyof typeof form) => (event: { target: { value: string } }) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!equipment) return;
    setFormError("");
    setFieldErrors({});
    setAlternatives([]);

    const startsAt = combineDateTime(form.date, form.startTime);
    const endsAt = combineDateTime(form.date, form.endTime);
    const deadline = new Date(`${form.deadline}T23:59:00`);

    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || Number.isNaN(deadline.getTime())) {
      setFormError("Please choose a valid date and time.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<{ booking: Booking; warnings: string[] }>("/bookings", {
        projectName: form.projectName,
        projectDescription: form.projectDescription,
        additionalRequirements: form.additionalRequirements || undefined,
        equipmentId: equipment.id,
        departmentId: form.departmentId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        projectDeadline: deadline.toISOString(),
      });
      push(
        data.warnings.length
          ? `Request submitted. ${data.warnings[0]}`
          : "Booking request submitted for faculty review.",
        "success"
      );
      navigate("/bookings");
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        setFieldErrors(parseFieldErrors(err.details));
        const details = err.details as { alternativeSlots?: Array<{ startsAt: string; endsAt: string }> } | undefined;
        if (details?.alternativeSlots?.length) setAlternatives(details.alternativeSlots);
      } else {
        setFormError("Unable to submit the request.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner label="Loading equipment" />;
  if (error || !equipment) {
    return (
      <EmptyState
        icon={TriangleAlert}
        title="Equipment unavailable"
        description={error || "This resource could not be found."}
        action={
          <Link to="/equipment">
            <Button variant="secondary">Back to catalogue</Button>
          </Link>
        }
      />
    );
  }

  const unavailable = equipment.status !== "AVAILABLE";
  const unitsFree = equipment.availableUnitsNow ?? equipment.quantity;

  return (
    <div className="space-y-5">
      <Link
        to="/equipment"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-cream"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to equipment
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="p-4 pb-0">
              <EquipmentVisual category={equipment.category} name={equipment.name} className="aspect-[16/7]" />
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold/80">
                    {equipment.department.code} · {equipment.category}
                  </p>
                  <h1 className="mt-1.5 font-display text-3xl text-cream">{equipment.name}</h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={unavailable ? "danger" : unitsFree > 0 ? "success" : "warn"}>
                    {unavailable ? equipment.status.toLowerCase() : unitsFree > 0 ? `${unitsFree} free now` : "Fully booked"}
                  </Badge>
                  <Badge tone="neutral">
                    <Layers className="h-3 w-3" /> Qty {equipment.quantity}
                  </Badge>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted">{equipment.description}</p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-electric/70" /> {equipment.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-gold/70" /> Bookings up to 8 hours
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {equipment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-cream">Technical specifications</h2>
              <dl className="mt-3 space-y-2">
                {Object.entries(equipment.specs).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between gap-3 border-b border-white/[0.04] pb-2 last:border-0">
                    <dt className="text-[11px] text-muted">{key}</dt>
                    <dd className="text-right text-[11px] font-medium text-cream/90">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-cream">Upcoming approved slots</h2>
              <p className="mt-1 text-[11px] text-muted">Next 7 days · approval state only</p>
              <div className="mt-3 space-y-2">
                {equipment.upcomingApprovedSlots?.length ? (
                  equipment.upcomingApprovedSlots.slice(0, 5).map((slot) => (
                    <div
                      key={`${slot.startsAt}-${slot.endsAt}`}
                      className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-[11px]"
                    >
                      <span className="text-cream/80">{formatDateTime(slot.startsAt)}</span>
                      <span className="text-muted">ends {formatTime(slot.endsAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-success/15 bg-success/[0.04] px-3 py-3 text-[11px] text-success">
                    No approved bookings in the next 7 days.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        <Card className="h-fit p-5 lg:sticky lg:top-24">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gold/25 bg-gold/10 text-gold">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-cream">Request this equipment</h2>
              <p className="text-[11px] text-muted">Faculty reviews every project request.</p>
            </div>
          </div>

          {unavailable && (
            <div className="mt-4 rounded-lg border border-warn/25 bg-warn/[0.06] px-3 py-2.5 text-[11px] text-warn">
              This equipment is currently marked {equipment.status.toLowerCase()} and cannot be booked.
            </div>
          )}

          <form onSubmit={submit} className="mt-4 space-y-3.5" noValidate>
            <Input
              label="Project name"
              required
              value={form.projectName}
              onChange={update("projectName")}
              error={fieldErrors.projectName}
              placeholder="Smart agriculture monitoring"
            />
            <Textarea
              label="Project description"
              required
              value={form.projectDescription}
              onChange={update("projectDescription")}
              error={fieldErrors.projectDescription}
              placeholder="Explain what you are building and how this equipment will be used…"
              className="min-h-[96px]"
            />
            <Select
              label="Requesting department"
              required
              value={form.departmentId}
              onChange={update("departmentId")}
              error={fieldErrors.departmentId}
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.code} — {department.name}
                </option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Booking date"
                type="date"
                required
                value={form.date}
                onChange={update("date")}
                error={fieldErrors.startsAt}
              />
              <Input
                label="Project deadline"
                type="date"
                required
                value={form.deadline}
                onChange={update("deadline")}
                error={fieldErrors.projectDeadline}
              />
              <Input
                label="Start time"
                type="time"
                required
                value={form.startTime}
                onChange={update("startTime")}
              />
              <Input
                label="End time"
                type="time"
                required
                value={form.endTime}
                onChange={update("endTime")}
                error={fieldErrors.endsAt}
              />
            </div>
            <p className="text-[10px] text-muted">30 minutes to 8 hours · up to 90 days ahead · must finish before the deadline.</p>

            <Textarea
              label="Additional requirements"
              value={form.additionalRequirements}
              onChange={update("additionalRequirements")}
              placeholder="Power supply, technician support, software licences…"
              className="min-h-[70px]"
            />

            {formError && (
              <div role="alert" className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2.5 text-[11px] text-danger">
                {formError}
              </div>
            )}

            {alternatives.length > 0 && (
              <div className="rounded-lg border border-warn/25 bg-warn/[0.04] px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-warn">
                  <CalendarClock className="h-3.5 w-3.5" /> Alternative free slots
                </p>
                <ul className="mt-1.5 space-y-1 text-[11px] text-muted">
                  {alternatives.map((slot) => (
                    <li key={slot.startsAt}>{formatDateTime(slot.startsAt)} — {formatTime(slot.endsAt)}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" loading={submitting} disabled={unavailable}>
              <CheckCircle2 className="h-4 w-4" /> Submit booking request
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
