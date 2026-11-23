import { useCallback, useEffect, useState } from "react";
import { CalendarX2, ClipboardList, RefreshCw } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { useToast } from "../components/ui/Toast";
import type { Booking, BookingStatus } from "../lib/types";
import { BookingCard } from "../components/BookingCard";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState, PageHeader, Spinner } from "../components/ui/Feedback";
import { Modal } from "../components/ui/Modal";

const TABS: Array<{ value: "ALL" | BookingStatus; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MyBookings() {
  const { push } = useToast();
  const [status, setStatus] = useState<"ALL" | BookingStatus>("ALL");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = status === "ALL" ? "" : `?status=${status}`;
      const data = await api.get<{ bookings: Booking[] }>(`/bookings${query}`);
      setBookings(data.bookings);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async () => {
    if (!selected) return;
    setCancelling(true);
    try {
      await api.patch(`/bookings/${selected.id}/cancel`);
      push("Booking cancelled.", "success");
      setSelected(null);
      await load();
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Unable to cancel booking.", "error");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Project access"
        title="My bookings"
        description="Track every request from submission through faculty review to completion."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
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

      {error && (
        <Card className="border-danger/25 bg-danger/[0.05] p-4 text-sm text-danger">
          {error}
          <button type="button" onClick={() => void load()} className="ml-2 font-semibold underline">
            Retry
          </button>
        </Card>
      )}

      {loading ? (
        <Spinner label="Loading your requests" />
      ) : bookings.length ? (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const canCancel =
              (booking.status === "PENDING" || booking.status === "APPROVED") &&
              new Date(booking.endsAt).getTime() > Date.now();
            return (
              <BookingCard
                key={booking.id}
                booking={booking}
                actions={
                  canCancel ? (
                    <Button variant="danger" size="sm" onClick={() => setSelected(booking)}>
                      <CalendarX2 className="h-3.5 w-3.5" /> Cancel request
                    </Button>
                  ) : undefined
                }
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ClipboardList}
          title="No bookings in this view"
          description="Browse the equipment catalogue and submit your first project request."
        />
      )}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Cancel this booking?"
        description={selected ? `${selected.projectName} · ${selected.equipment?.name ?? "equipment"}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Keep booking
            </Button>
            <Button variant="danger" loading={cancelling} onClick={() => void cancel()}>
              Confirm cancellation
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Cancelling frees the slot for other students immediately. This cannot be undone — you would
          need to submit a new request.
        </p>
      </Modal>
    </div>
  );
}
