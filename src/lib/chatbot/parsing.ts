/**
 * Small, dependency-free parsers for the rule-based chat engine. Deliberately
 * conservative: when unsure, return null and let the conversation ask again
 * rather than guess silently. Every parsed value gets echoed back to the
 * guest for confirmation, so a misparse is always visible.
 */

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export function parseDate(text: string, now = new Date()): string | null {
  const lower = text.toLowerCase();

  if (/\btoday\b/.test(lower)) return toISODate(now);
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toISODate(d);
  }

  const iso = lower.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) {
    const [, y, m, d] = iso;
    return toISODate(new Date(Number(y), Number(m) - 1, Number(d)));
  }

  const slash = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash) {
    const [, m, d, y] = slash;
    const year = y ? (y.length === 2 ? 2000 + Number(y) : Number(y)) : now.getFullYear();
    return rollToFuture(new Date(year, Number(m) - 1, Number(d)), now, !!y);
  }

  const monthWordFirst = lower.match(
    new RegExp(`\\b(${MONTHS.join("|")})\\.?\\s+(\\d{1,2})(st|nd|rd|th)?(?:,?\\s*(20\\d{2}))?\\b`)
  );
  if (monthWordFirst) {
    const [, monthName, day, , year] = monthWordFirst;
    const monthIdx = MONTHS.indexOf(monthName);
    const y = year ? Number(year) : now.getFullYear();
    return rollToFuture(new Date(y, monthIdx, Number(day)), now, !!year);
  }

  const dayMonthFirst = lower.match(
    new RegExp(`\\b(\\d{1,2})(st|nd|rd|th)?\\s+(${MONTHS.join("|")})\\.?(?:,?\\s*(20\\d{2}))?\\b`)
  );
  if (dayMonthFirst) {
    const [, day, , monthName, year] = dayMonthFirst;
    const monthIdx = MONTHS.indexOf(monthName);
    const y = year ? Number(year) : now.getFullYear();
    return rollToFuture(new Date(y, monthIdx, Number(day)), now, !!year);
  }

  return null;
}

function rollToFuture(date: Date, now: Date, yearWasExplicit: boolean): string {
  if (!yearWasExplicit) {
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date < todayMidnight) date.setFullYear(date.getFullYear() + 1);
  }
  return toISODate(date);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** Parses a single clock time (e.g. "6pm", "18:00", "noon") to 24h "HH:MM". */
export function parseSingleTime(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\bnoon\b/.test(lower)) return "12:00";
  if (/\bmidnight\b/.test(lower)) return "00:00";

  const withAmPm = lower.match(/\b(\d{1,2})(:(\d{2}))?\s*(am|pm)\b/);
  if (withAmPm) {
    let h = Number(withAmPm[1]);
    const m = withAmPm[3] ? Number(withAmPm[3]) : 0;
    const isPm = withAmPm[4] === "pm";
    if (h === 12) h = isPm ? 12 : 0;
    else if (isPm) h += 12;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const bare24 = lower.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (bare24) {
    return `${String(Number(bare24[1])).padStart(2, "0")}:${bare24[2]}`;
  }

  return null;
}

/** Parses "from 6pm to 10pm" / "6-10pm" / "6pm until 11pm" into [start, end]. */
export function parseTimeRange(text: string): [string, string] | null {
  const parts = text.split(/\b(?:to|until|-|–)\b/i);
  if (parts.length < 2) return null;
  const start = parseSingleTime(parts[0]);
  const end = parseSingleTime(parts.slice(1).join(" "));
  if (start && end) return [start, end];
  return null;
}

export function parseDurationHours(text: string): number | null {
  const m = text.toLowerCase().match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
  return m ? Number(m[1]) : null;
}

export function parseGuestCount(text: string): number | null {
  const m = text.toLowerCase().match(/\b(\d{1,4})\s*(guests?|people|pax|attendees?)\b/);
  if (m) return Number(m[1]);
  const forN = text.toLowerCase().match(/\bfor\s+(\d{1,4})\b/);
  if (forN) return Number(forN[1]);
  return null;
}

export function parseEmail(text: string): string | null {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return m ? m[0] : null;
}

export function parsePhone(text: string): string | null {
  const m = text.match(/\+?\d[\d\s().-]{6,}\d/);
  return m ? m[0].trim() : null;
}

export function isAffirmative(text: string): boolean {
  return /^\s*(y|yes|yep|yeah|yup|correct|confirm|confirmed|book it|sounds good|that's right|looks good|go ahead|sure)\b/i.test(
    text.trim()
  );
}

export function isNegative(text: string): boolean {
  return /^\s*(n|no|nope|cancel|wait|actually|hold on|change)\b/i.test(text.trim());
}
