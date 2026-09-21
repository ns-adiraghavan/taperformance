/**
 * Business-day utilities.
 * All day math in the dashboard uses these — never raw calendar-day subtraction.
 */

/**
 * Count business days from `start` (exclusive) to `end` (inclusive).
 * Returns a positive integer if end > start, negative if end < start, 0 if same.
 * Weekends (Sat/Sun) and holidays are excluded.
 */
export function businessDaysBetween(
  start: Date,
  end: Date,
  holidays: string[] = []   // YYYY-MM-DD strings
): number {
  if (!start || !end) return 0;

  const holidaySet = new Set(holidays);
  const forward = end >= start;
  const [from, to] = forward ? [start, end] : [end, start];

  let count = 0;
  const cur = new Date(from);

  while (cur < to) {
    cur.setDate(cur.getDate() + 1);
    const dow = cur.getDay();
    const ds = toISODate(cur);
    if (dow !== 0 && dow !== 6 && !holidaySet.has(ds)) count++;
  }

  return forward ? count : -count;
}

/** Add N business days to a date, skipping weekends + holidays. */
export function addBusinessDays(
  date: Date,
  days: number,
  holidays: string[] = []
): Date {
  const holidaySet = new Set(holidays);
  const result = new Date(date);
  let remaining = Math.abs(days);
  const dir = days >= 0 ? 1 : -1;

  while (remaining > 0) {
    result.setDate(result.getDate() + dir);
    const dow = result.getDay();
    const ds = toISODate(result);
    if (dow !== 0 && dow !== 6 && !holidaySet.has(ds)) remaining--;
  }

  return result;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse a date string in various formats → Date | null */
export function parseDate(raw: unknown): Date | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s || s === '-' || s === 'N/A' || s === 'n/a') return null;

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`);
    return isNaN(d.getTime()) ? null : d;
  }

  // DD-Mon-YYYY  (e.g. 15-Jan-2026)
  const monMap: Record<string,string> = {
    jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
    jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'
  };
  const dMY = s.match(/^(\d{1,2})[- ]([A-Za-z]{3})[- ](\d{4})/);
  if (dMY) {
    const mon = monMap[dMY[2].toLowerCase()];
    if (mon) {
      const d = new Date(`${dMY[3]}-${mon}-${dMY[1].padStart(2,'0')}`);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // Fallback: let JS try
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date | null | string): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toISODateStr(d: Date | null): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}
