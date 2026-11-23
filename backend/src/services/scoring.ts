import { matchedKeywords } from "../utils/text";

export const PRIORITY_WEIGHTS = {
  deadlineUrgency: 0.35,
  compatibility: 0.25,
  availability: 0.2,
  fairness: 0.2,
} as const;

export interface PriorityFactor {
  score: number;
  weight: number;
  weighted: number;
  reason: string;
}

export interface PriorityBreakdown {
  deadlineUrgency: PriorityFactor;
  compatibility: PriorityFactor;
  availability: PriorityFactor;
  fairness: PriorityFactor;
}

export interface PriorityResult {
  score: number;
  breakdown: PriorityBreakdown;
  reasons: string[];
}

export interface ScoringInput {
  now: Date;
  projectDeadline: Date;
  projectText: string;
  equipment: { name: string; category: string; description: string; tags: string | string[] };
  capacityFree: number;
  requestedDurationMinutes: number;
  approvedCountForUser: number;
  maxApprovedCount: number;
}

export function clampScore(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Sooner project deadlines produce a higher urgency score (0-100). */
export function deadlineUrgencyScore(projectDeadline: Date, now: Date): number {
  const daysRemaining = (projectDeadline.getTime() - now.getTime()) / 86_400_000;
  if (daysRemaining <= 0) return 100;
  return clampScore(100 - daysRemaining * 2.8, 15, 100);
}

/** Overlap between project language and the equipment's metadata (0-100). */
export function compatibilityScore(projectText: string, equipment: ScoringInput["equipment"]): {
  score: number;
  matched: string[];
} {
  const corpus = [
    equipment.name,
    equipment.category,
    equipment.description,
    Array.isArray(equipment.tags) ? equipment.tags.join(" ") : equipment.tags,
  ].join(" ");
  const matched = matchedKeywords(projectText, corpus);
  const projectTokens = new Set(
    projectText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3)
  );
  const ratio = projectTokens.size === 0 ? 0 : matched.length / projectTokens.size;
  return { score: clampScore(40 + ratio * 60, 40, 100), matched };
}

/** Shorter requests against free capacity are more feasible (0-100). */
export function availabilityScore(capacityFree: number, requestedDurationMinutes: number): number {
  const base = capacityFree > 0 ? 100 : 50;
  const durationRatio = clampScore((requestedDurationMinutes - 60) / (8 * 60 - 60), 0, 1);
  return clampScore(base - durationRatio * 25, 25, 100);
}

/** Students with fewer recent approvals receive a higher fairness score (0-100). */
export function fairnessScore(approvedCountForUser: number, maxApprovedCount: number): number {
  if (maxApprovedCount <= 0) return 100;
  return clampScore(100 - (approvedCountForUser / maxApprovedCount) * 80, 20, 100);
}

export function computePriority(input: ScoringInput): PriorityResult {
  const deadline = deadlineUrgencyScore(input.projectDeadline, input.now);
  const compatibility = compatibilityScore(input.projectText, input.equipment);
  const availability = availabilityScore(input.capacityFree, input.requestedDurationMinutes);
  const fairness = fairnessScore(input.approvedCountForUser, input.maxApprovedCount);

  const factor = (score: number, weight: number, reason: string): PriorityFactor => ({
    score: Math.round(score * 10) / 10,
    weight,
    weighted: Math.round(score * weight * 10) / 10,
    reason,
  });

  const daysRemaining = Math.max(
    0,
    Math.round(((input.projectDeadline.getTime() - input.now.getTime()) / 3_600_000) * 10) / 10
  );

  const breakdown: PriorityBreakdown = {
    deadlineUrgency: factor(
      deadline,
      PRIORITY_WEIGHTS.deadlineUrgency,
      daysRemaining < 24
        ? `Deadline is within ${Math.max(1, Math.round(daysRemaining))} hour(s), so urgency is at its highest.`
        : `Project deadline is about ${Math.round(daysRemaining / 24)} day(s) away.`
    ),
    compatibility: factor(
      compatibility.score,
      PRIORITY_WEIGHTS.compatibility,
      compatibility.matched.length
        ? `Project language matches equipment metadata on: ${compatibility.matched.slice(0, 4).join(", ")}.`
        : "No strong keyword match between the project brief and this equipment."
    ),
    availability: factor(
      availability,
      PRIORITY_WEIGHTS.availability,
      input.capacityFree > 0
        ? `${input.capacityFree} unit(s) remain free during the requested window.`
        : "No free unit remains in the requested window, so a deferral is likely."
    ),
    fairness: factor(
      fairness,
      PRIORITY_WEIGHTS.fairness,
      input.maxApprovedCount > 0
        ? `The student has ${input.approvedCountForUser} recent approval(s); the busiest requester has ${input.maxApprovedCount}.`
        : "No recent approvals on record for the competing group."
    ),
  };

  const score =
    Math.round(
      (breakdown.deadlineUrgency.weighted +
        breakdown.compatibility.weighted +
        breakdown.availability.weighted +
        breakdown.fairness.weighted) *
        10
    ) / 10;

  return {
    score,
    breakdown,
    reasons: [
      breakdown.deadlineUrgency.reason,
      breakdown.compatibility.reason,
      breakdown.availability.reason,
      breakdown.fairness.reason,
    ],
  };
}
