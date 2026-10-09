import { describe, it, expect } from "vitest";
import { sortAndFilter } from "@/lib/cert-list";
const c = (id: string, courseName: string, completionDate: string, status = "Verified", platform = "X") => ({ id, courseName, completionDate, status, platform } as any);
const list = [c("DL-002", "Beta", "2026-01-15"), c("DL-001", "Alpha", "2026-02-20", "In Progress"), c("DL-003", "Gamma", "2025-12-02", "Verified", "Google")];
describe("admin list", () => {
  it("newest first", () => expect(sortAndFilter(list, "", "all", "newest").map((x: any) => x.id)).toEqual(["DL-001", "DL-002", "DL-003"]));
  it("oldest first", () => expect(sortAndFilter(list, "", "all", "oldest").map((x: any) => x.id)).toEqual(["DL-003", "DL-002", "DL-001"]));
  it("name Z-A", () => expect(sortAndFilter(list, "", "all", "za").map((x: any) => x.courseName)).toEqual(["Gamma", "Beta", "Alpha"]));
  it("by number", () => expect(sortAndFilter(list, "", "all", "id").map((x: any) => x.id)).toEqual(["DL-001", "DL-002", "DL-003"]));
  it("still learning filter", () => expect(sortAndFilter(list, "", "In Progress", "newest").map((x: any) => x.id)).toEqual(["DL-001"]));
  it("search matches place", () => expect(sortAndFilter(list, "goog", "all", "newest").map((x: any) => x.id)).toEqual(["DL-003"]));
});
