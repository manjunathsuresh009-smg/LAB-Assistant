import { describe, expect, it } from "vitest";
import {
  findAlternativeSlots,
  intervalsOverlap,
  peakConcurrency,
  remainingCapacity,
} from "../services/scheduling";

const at = (iso: string) => new Date(iso);

describe("interval overlap", () => {
  it("detects overlapping ranges", () => {
    expect(intervalsOverlap(at("2026-01-01T09:00:00Z"), at("2026-01-01T12:00:00Z"), at("2026-01-01T11:00:00Z"), at("2026-01-01T13:00:00Z"))).toBe(true);
  });

  it("treats touching endpoints as free", () => {
    expect(intervalsOverlap(at("2026-01-01T09:00:00Z"), at("2026-01-01T12:00:00Z"), at("2026-01-01T12:00:00Z"), at("2026-01-01T14:00:00Z"))).toBe(false);
  });
});

describe("peak concurrency and capacity", () => {
  const busy = [
    { startsAt: at("2026-01-01T09:00:00Z"), endsAt: at("2026-01-01T12:00:00Z") },
    { startsAt: at("2026-01-01T10:00:00Z"), endsAt: at("2026-01-01T13:00:00Z") },
  ];

  it("computes the peak number of held units", () => {
    expect(peakConcurrency(busy, at("2026-01-01T09:00:00Z"), at("2026-01-01T13:00:00Z"))).toBe(2);
  });

  it("reports remaining capacity against quantity", () => {
    expect(remainingCapacity(busy, 3, at("2026-01-01T09:00:00Z"), at("2026-01-01T13:00:00Z"))).toBe(1);
    expect(remainingCapacity(busy, 2, at("2026-01-01T09:00:00Z"), at("2026-01-01T13:00:00Z"))).toBe(0);
  });
});

describe("alternative slot generation", () => {
  it("never offers a slot that is already at capacity", () => {
    const now = at("2026-01-01T08:00:00Z");
    const slots = findAlternativeSlots({
      busy: [{ startsAt: at("2026-01-01T09:00:00Z"), endsAt: at("2026-01-01T13:00:00Z") }],
      quantity: 1,
      durationMinutes: 120,
      from: at("2026-01-01T09:00:00Z"),
      now,
      count: 3,
    });
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(intervalsOverlap(slot.startsAt, slot.endsAt, at("2026-01-01T09:00:00Z"), at("2026-01-01T13:00:00Z"))).toBe(false);
    }
  });

  it("allows a slot when a second unit is free", () => {
    const slots = findAlternativeSlots({
      busy: [{ startsAt: at("2026-01-01T09:00:00Z"), endsAt: at("2026-01-01T13:00:00Z") }],
      quantity: 2,
      durationMinutes: 120,
      from: at("2026-01-01T09:00:00Z"),
      now: at("2026-01-01T08:00:00Z"),
      count: 1,
    });
    expect(slots[0]).toBeDefined();
    expect(slots[0].startsAt.getTime()).toBe(at("2026-01-01T09:00:00Z").getTime());
  });

  it("skips past times and excludes the requested window", () => {
    const slots = findAlternativeSlots({
      busy: [],
      quantity: 1,
      durationMinutes: 60,
      from: at("2026-01-01T09:00:00Z"),
      now: at("2026-01-01T10:30:00Z"),
      count: 2,
      exclude: { startsAt: at("2026-01-01T09:00:00Z"), endsAt: at("2026-01-01T11:00:00Z") },
    });
    for (const slot of slots) {
      expect(slot.startsAt.getTime()).toBeGreaterThanOrEqual(at("2026-01-01T10:30:00Z").getTime());
      expect(intervalsOverlap(slot.startsAt, slot.endsAt, at("2026-01-01T09:00:00Z"), at("2026-01-01T11:00:00Z"))).toBe(false);
    }
  });
});
