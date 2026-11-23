import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ClipboardCheck, RefreshCw, Scale, X } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { formatDateTime, formatTime } from "../lib/format";
import { useToast } from "../components/ui/Toast";
import type { Booking, BookingStatus, PriorityResult } from "../lib/types";
import { BookingCard } from "../components/BookingCard";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, PageHeader, Spinner } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";
import { Textarea } from "../components/ui/Field";

const TABS: Array<{ value: BookingStatus | "ALL"; label: string }> = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
];

interface ConflictNotice {
  message: string;
  slots: Array<{ startsAt: string; endsAt: string }>;
}

export default function FacultyApprovals() {
  const { push } = useToast();
  const [status, setStatus] = useState<BookingStatus | "ALL">("PENDING");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [notice, setNotice] = useState<ConflictNotice | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = status === "ALL" ? "" : `?status=${status}`;
      const data = await api.get<{ bookings: Booking[] }>(`/faculty/requests${query}`);
      setBookings(data.bookings);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (booking: Booking) => {
    setWorkingId(booking.id);
    setNotice(null);
    try {
      const data = await api.patch<{ booking: Booking; priority: PriorityResult }>(
        `/faculty/requests/${booking.id}/approve`
      );
      push(`Approved “${booking.projectName}” · priority ${data.priority.score}/100.`, "success");
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.details as
          | { alternativeSlots?: Array<{ startsAt: string; endsAt: string }> }
          | undefined;
        setNotice({ message: err.message, slots: details?.alternativeSlots ?? [] });
        push(err.message, "error");
      } else {
        push("Unable to approve this request.", "error");
      }
    } finally {
      setWorkingId(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    if (reason.trim().length < 5) {
      setReasonError("Provide a reason of at least 5 characters.");
      return;
    }
    setRejecting(true);
    try {
      await api.patch(`/faculty/requests/${rejectTarget.id}/reject`, { reason: reason.trim() });
      push("Request rejected and the student has been given a reason.", "success");
      setRejectTarget(null);
      setReason("");
      await load();
    } catch (err) {
      setReasonError(err instanceof ApiError ? err.message : "Unable to reject this request.");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Faculty review"
        title="Approval queue"
        description="Review project requests, verify availability and make the final allocation decision."
        actions={
          <>
            <Link to="/conflicts">
              <Button variant="secondary" size="sm">
                <Scale className="h-3.5 w-3.5" /> Conflict resolver
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/[0.06] bg-panel/60 p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              status === tab.value
                ? "bg-gold/15 text-gold"
                : "text-muted hover:bg-white/[0.04] hover:text-cream"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {notice && (
        <Card className="border-warn/25 bg-warn/[0.05] p-4">
          <p className="text-xs font-semibold text-warn">{notice.message}</p>
          {notice.slots.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {notice.slots.map((slot) => (
                <Badge key={slot.startsAt} tone="neutral">
                  {formatDateTime(slot.startsAt)} — {formatTime(slot.endsAt)}
                </Badge>
              ))}
            </div>
          )}
          <p className="mt-2 text-[11px] text-muted">
            Open the conflict resolver to compare competing requests and offer alternatives.
          </p>
        </Card>
      )}

      {error && (
        <Card className="border-danger/25 bg-danger/[0.05] p-4 text-sm text-danger">
          {error}
          <button type="button" onClick={() => void load()} className="ml-2 font-semibold underline">
            Retry
          </button>
        </Card>
      )}

      {loading ? (
        <Spinner label="Loading approval queue" />
      ) : bookings.length ? (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              showStudent
              actions={
                booking.status === "PENDING" ? (
                  <>
                    <Button
                      size="sm"
                      loading={workingId === booking.id}
                      onClick={() => void approve(booking)}
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        setRejectTarget(booking);
                        setReason("");
                        setReasonError("");
                      }}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                ) : null
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardCheck}
          title={status === "PENDING" ? "Queue is clear" : "No requests in this view"}
          description="New project requests will appear here for review as students submit them."
        />
      )}

      <Modal
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title="Reject this request"
        description={rejectTarget?.projectName}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={rejecting} onClick={() => void submitReject()}>
              Confirm rejection
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for rejection"
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={reasonError}
          placeholder="Explain why this request cannot be approved so the student can adjust…"
          hint="The student sees this reason in their booking history."
        />
      </Modal>
    </div>
  );
}
