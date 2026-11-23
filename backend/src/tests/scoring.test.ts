import { describe, expect, it } from "vitest";
import {
  availabilityScore,
  clampScore,
  compatibilityScore,
  computePriority,
  deadlineUrgencyScore,
  fairnessScore,
  PRIORITY_WEIGHTS,
} from "../services/scoring";

const equipment = {
  name: "Arduino Uno",
  category: "Microcontrollers",
  description: "Embedded prototyping board for sensors and IoT projects.",
  tags: "arduino, iot, sensors, embedded",
};

describe("priority scoring factors", () => {
  it("clamps scores to 0-100", () => {
    expect(clampScore(-20)).toBe(0);
    expect(clampScore(140)).toBe(100);
  });

  it("scores sooner deadlines higher", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const urgent = deadlineUrgencyScore(new Date("2026-01-02T00:00:00Z"), now);
    const relaxed = deadlineUrgencyScore(new Date("2026-01-20T00:00:00Z"), now);
    expect(urgent).toBeGreaterThan(relaxed);
    expect(urgent).toBeLessThanOrEqual(100);
    expect(relaxed).toBeGreaterThanOrEqual(15);
  });

  it("rewards keyword compatibility", () => {
    const strong = compatibilityScore("Build an IoT soil sensor with arduino", equipment);
    const weak = compatibilityScore("Render a mechanical animation", equipment);
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.matched.length).toBeGreaterThan(0);
  });

  it("rewards free capacity and shorter durations", () => {
    expect(availabilityScore(2, 120)).toBeGreaterThan(availabilityScore(0, 120));
    expect(availabilityScore(1, 60)).toBeGreaterThan(availabilityScore(1, 480));
  });

  it("rewards students with fewer recent approvals", () => {
    expect(fairnessScore(0, 4)).toBeGreaterThan(fairnessScore(4, 4));
  });

  it("applies the documented 35/25/20/20 weights", () => {
    expect(PRIORITY_WEIGHTS.deadlineUrgency).toBe(0.35);
    expect(PRIORITY_WEIGHTS.compatibility).toBe(0.25);
    expect(PRIORITY_WEIGHTS.availability).toBe(0.2);
    expect(PRIORITY_WEIGHTS.fairness).toBe(0.2);
  });
});

describe("computePriority", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  const base = {
    now,
    projectDeadline: new Date("2026-01-03T00:00:00Z"),
    projectText: "Build an IoT soil moisture monitoring system with arduino",
    equipment,
    capacityFree: 1,
    requestedDurationMinutes: 180,
    approvedCountForUser: 0,
    maxApprovedCount: 3,
  };

  it("returns a normalised score and all four explainable factors", () => {
    const result = computePriority(base);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Object.keys(result.breakdown)).toEqual([
      "deadlineUrgency",
      "compatibility",
      "availability",
      "fairness",
    ]);
    expect(result.reasons).toHaveLength(4);
  });

  it("ranks an urgent project above a relaxed one when other factors are equal", () => {
    const urgent = computePriority(base);
    const relaxed = computePriority({
      ...base,
      projectDeadline: new Date("2026-02-15T00:00:00Z"),
    });
    expect(urgent.score).toBeGreaterThan(relaxed.score);
    expect(urgent.breakdown.deadlineUrgency.score).toBeGreaterThan(
      relaxed.breakdown.deadlineUrgency.score
    );
  });

  it("reflects contended capacity in the availability factor", () => {
    const free = computePriority(base);
    const contested = computePriority({ ...base, capacityFree: 0 });
    expect(contested.breakdown.availability.score).toBeLessThan(
      free.breakdown.availability.score
    );
  });
});
