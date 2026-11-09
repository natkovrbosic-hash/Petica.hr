// Formatiranje vremena — uvijek u zoni Europe/Zagreb (isti prikaz na serveru i u pregledniku).
const TZ = "Europe/Zagreb";

export const dayKey = (d: string | Date) => new Date(d).toLocaleDateString("sv-SE", { timeZone: TZ }); // 2026-11-10

export const timeHM = (d: string | Date) =>
  new Date(d).toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

export const dayLong = (d: string | Date) =>
  new Date(d).toLocaleDateString("hr-HR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });

export const dayShort = (d: string | Date) =>
  new Date(d).toLocaleDateString("hr-HR", { weekday: "short", day: "numeric", month: "numeric", timeZone: TZ });

/** "danas 17:00", "sutra 9:30", "uto 12. 11. 16:00" */
export function relativeSlot(d: string | Date, now = new Date()) {
  const k = dayKey(d);
  const today = dayKey(now);
  const tomorrow = dayKey(new Date(now.getTime() + 86400000));
  const prefix = k === today ? "danas" : k === tomorrow ? "sutra" : dayShort(d);
  return `${prefix} ${timeHM(d)}`;
}
