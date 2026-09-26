const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Compact inbox date: "14:05", "Mon", "12 Sep", "12 Sep 2024". */
export function shortDate(ms: number, now = new Date()): string {
  const d = new Date(ms);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (ms >= startOfToday) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (ms >= startOfToday - 6 * 86400000) return DAYS[d.getDay()];
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

/** Reader byline date: "Monday 12 September 2026 · 14:05". */
export function longDate(ms: number): string {
  const d = new Date(ms);
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][d.getMonth()];
  return `${day} ${d.getDate()} ${month} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
