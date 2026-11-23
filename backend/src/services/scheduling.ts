export interface Interval {
  startsAt: Date;
  endsAt: Date;
}

export interface AlternativeSlot {
  startsAt: Date;
  endsAt: Date;
}

/** Standard half-open interval overlap: touching endpoints do not overlap. */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

/**
 * Highest number of simultaneously held units within [start, end].
 * Existing intervals are clipped to the window so a long booking that
 * spans the whole requested window still consumes a unit.
 */
export function peakConcurrency(intervals: Interval[], start: Date, end: Date): number {
  if (end.getTime() <= start.getTime()) return 0;
  const events: Array<{ t: number; delta: number }> = [];
  for (const interval of intervals) {
    const s = Math.max(interval.startsAt.getTime(), start.getTime());
    const e = Math.min(interval.endsAt.getTime(), end.getTime());
    if (s >= e) continue;
    events.push({ t: s, delta: 1 });
    events.push({ t: e, delta: -1 });
  }
  events.sort((a, b) => (a.t === b.t ? a.delta - b.delta : a.t - b.t));
  let current = 0;
  let peak = 0;
  for (const event of events) {
    current += event.delta;
    if (current > peak) peak = current;
  }
  return peak;
}

export function remainingCapacity(intervals: Interval[], quantity: number, start: Date, end: Date): number {
  return Math.max(0, quantity - peakConcurrency(intervals, start, end));
}

export interface FindSlotsOptions {
  busy: Interval[];
  quantity: number;
  durationMinutes: number;
  from: Date;
  now: Date;
  count: number;
  daysToScan?: number;
  dayStartHour?: number;
  dayEndHour?: number;
  stepMinutes?: number;
  exclude?: Interval;
}

/**
 * Scans forward day by day for windows where the equipment still has a free
 * unit. Uses a fixed lab operating window so results are deterministic and
 * explainable. Returns alternatives sorted chronologically.
 */
export function findAlternativeSlots(options: FindSlotsOptions): AlternativeSlot[] {
  const {
    busy,
    quantity,
    durationMinutes,
    from,
    now,
    count,
    daysToScan = 14,
    dayStartHour = 8,
    dayEndHour = 20,
    stepMinutes = 30,
    exclude,
  } = options;

  const slots: AlternativeSlot[] = [];
  if (quantity <= 0 || durationMinutes <= 0) return slots;

  const earliest = Math.max(from.getTime(), now.getTime());
  const base = new Date(earliest);
  const baseYear = base.getUTCFullYear();
  const baseMonth = base.getUTCMonth();
  const baseDate = base.getUTCDate();

  for (let day = 0; day < daysToScan && slots.length < count; day += 1) {
    const dayStart = Date.UTC(baseYear, baseMonth, baseDate + day, dayStartHour, 0, 0);
    const dayEnd = Date.UTC(baseYear, baseMonth, baseDate + day, dayEndHour, 0, 0);
    for (
      let startMs = dayStart;
      startMs + durationMinutes * 60_000 <= dayEnd;
      startMs += stepMinutes * 60_000
    ) {
      const start = new Date(startMs);
      const end = new Date(startMs + durationMinutes * 60_000);
      if (start.getTime() < earliest) continue;
      if (exclude && intervalsOverlap(start, end, exclude.startsAt, exclude.endsAt)) continue;
      if (peakConcurrency(busy, start, end) >= quantity) continue;
      slots.push({ startsAt: start, endsAt: end });
      if (slots.length >= count) break;
    }
  }
  return slots;
}
