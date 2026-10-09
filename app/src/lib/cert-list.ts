import type { Certificate } from "./portfolio";

const time = (d: string) => {
  const t = Date.parse(d);
  return isNaN(t) ? 0 : t;
};
const num = (id: string) => parseInt(id.replace(/\D/g, ""), 10) || 0;

export function sortAndFilter(list: Certificate[], q: string, filter: string, sort: string): Certificate[] {
  const s = q.trim().toLowerCase();
  const out = list.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      (!s || `${c.courseName} ${c.platform}`.toLowerCase().includes(s)),
  );
  const cmp: Record<string, (a: Certificate, b: Certificate) => number> = {
    newest: (a, b) => time(b.completionDate) - time(a.completionDate),
    oldest: (a, b) => time(a.completionDate) - time(b.completionDate),
    az: (a, b) => a.courseName.localeCompare(b.courseName),
    za: (a, b) => b.courseName.localeCompare(a.courseName),
    id: (a, b) => num(a.id) - num(b.id),
  };
  return [...out].sort(cmp[sort] ?? cmp["newest"]!);
}
