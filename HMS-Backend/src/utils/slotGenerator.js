/**
 * Parse "HH:MM" → total minutes since midnight
 */
const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
};

/**
 * Format minutes since midnight → "HH:MM"
 */
const minutesToTime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Check if two time ranges overlap
 */
const doTimeSlotsOverlap = (slot1, slot2) => {
    const [s1, e1] = slot1.split('-').map(timeToMinutes);
    const [s2, e2] = slot2.split('-').map(timeToMinutes);
    return s1 < e2 && s2 < e1;
};

/**
 * Merge overlapping time ranges into minimal set.
 *
 * Example:
 *   ["09:00-12:00", "10:00-13:00"] → ["09:00-13:00"]
 */
const mergeRanges = (ranges) => {
    if (!ranges || ranges.length === 0) return [];

    // Parse & sort by start time
    const parsed = ranges
        .map((r) => {
            const [s, e] = r.split('-').map(timeToMinutes);
            return { start: s, end: e };
        })
        .sort((a, b) => a.start - b.start);

    const merged = [parsed[0]];

    for (let i = 1; i < parsed.length; i++) {
        const last = merged[merged.length - 1];
        const curr = parsed[i];

        if (curr.start <= last.end) {
            // Overlap — merge by extending end if needed
            last.end = Math.max(last.end, curr.end);
        } else {
            // No overlap — push as new range
            merged.push(curr);
        }
    }

    return merged.map((m) => `${minutesToTime(m.start)}-${minutesToTime(m.end)}`);
};

/**
 * Expand a merged time range into individual bookable slots.
 *
 * @param {string} range   - "HH:MM-HH:MM" (merged, non-overlapping)
 * @param {number} duration - slot duration in minutes (default 30)
 * @returns {string[]}      - e.g. ["09:00-09:30", "09:30-10:00", ...]
 */
const expandRange = (range, duration = 30) => {
    const [startStr, endStr] = range.split('-');
    const startMin = timeToMinutes(startStr);
    const endMin = timeToMinutes(endStr);

    const slots = [];
    for (let t = startMin; t + duration <= endMin; t += duration) {
        slots.push(`${minutesToTime(t)}-${minutesToTime(t + duration)}`);
    }
    return slots;
};

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────

/**
 * Generate all bookable time slots for a doctor on a given date.
 *
 * @param {string[]} availabilitySlots - doctor's broad ranges, e.g. ["09:00-12:00", "14:00-17:00"]
 * @param {string[]} bookedSlots       - already-booked slots for the date, e.g. ["09:00-09:30"]
 * @param {number}   duration           - desired appointment duration in minutes (default 30)
 * @returns {{ available: string[], allGenerated: string[], mergedRanges: string[] }}
 */
const generateBookableSlots = (availabilitySlots, bookedSlots, duration = 30) => {
    // Step 1: Merge overlapping availability ranges
    const merged = mergeRanges(availabilitySlots);

    // Step 2: Expand each merged range into duration-based slots
    let allSlots = [];
    for (const range of merged) {
        allSlots = allSlots.concat(expandRange(range, duration));
    }

    // Step 3: Deduplicate (shouldn't be needed after merge, but belt-and-suspenders)
    const uniqueSlots = [...new Set(allSlots)].sort();

    // Step 4: Filter out slots that overlap with any booked slot
    const booked = bookedSlots || [];
    const available = uniqueSlots.filter(
        (slot) => !booked.some((b) => doTimeSlotsOverlap(slot, b))
    );

    return {
        available,
        allGenerated: uniqueSlots,
        mergedRanges: merged,
    };
};

module.exports = { generateBookableSlots, mergeRanges, expandRange, doTimeSlotsOverlap };