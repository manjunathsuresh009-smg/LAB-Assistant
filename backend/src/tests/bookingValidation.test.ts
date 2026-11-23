import { describe, expect, it } from "vitest";
import { validateBookingWindow } from "../services/bookingService";

const now = new Date("2026-01-01T08:00:00Z");
const start = new Date("2026-01-02T09:00:00Z");

function hoursAfter(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

describe("booking window validation", () => {
  it("accepts a valid booking window", () => {
    const result = validateBookingWindow(start, hoursAfter(start, 3), hoursAfter(start, 72), now);
    expect(result.durationMinutes).toBe(180);
  });

  it("rejects an end time before the start time", () => {
    expect(() => validateBookingWindow(start, hoursAfter(start, -1), hoursAfter(start, 72), now)).toThrow(
      /End time must be after/i
    );
  });

  it("rejects bookings shorter than 30 minutes", () => {
    expect(() =>
      validateBookingWindow(start, new Date(start.getTime() + 10 * 60_000), hoursAfter(start, 72), now)
    ).toThrow(/at least 30 minutes/i);
  });

  it("rejects bookings longer than 8 hours", () => {
    expect(() => validateBookingWindow(start, hoursAfter(start, 9), hoursAfter(start, 72), now)).toThrow(
      /cannot exceed 8 hours/i
    );
  });

  it("rejects start times in the past", () => {
    expect(() =>
      validateBookingWindow(new Date("2025-12-31T09:00:00Z"), new Date("2025-12-31T12:00:00Z"), start, now)
    ).toThrow(/future/i);
  });

  it("rejects bookings more than 90 days ahead", () => {
    const far = new Date(now.getTime() + 100 * 86_400_000);
    expect(() => validateBookingWindow(far, hoursAfter(far, 2), hoursAfter(far, 48), now)).toThrow(
      /90 days/i
    );
  });

  it("rejects a project deadline before the booking ends", () => {
    expect(() => validateBookingWindow(start, hoursAfter(start, 3), hoursAfter(start, 1), now)).toThrow(
      /deadline/i
    );
  });
});
