/** Navršene godine na dan `now` (datum rođenja "YYYY-MM-DD"). */
export function ageOn(birth: string, now = new Date()) {
  const b = new Date(birth + "T00:00:00");
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
