import { describe, expect, it } from "vitest";
import { roundRobinLeadAssignments } from "./lead-distribution";

describe("roundRobinLeadAssignments", () => {
  it("distributes the requested number of leads evenly", () => {
    expect(roundRobinLeadAssignments(["l1", "l2", "l3", "l4", "l5"], ["s1", "s2"], 4)).toEqual([
      { leadId: "l1", salesId: "s1" }, { leadId: "l2", salesId: "s2" },
      { leadId: "l3", salesId: "s1" }, { leadId: "l4", salesId: "s2" },
    ]);
  });

  it("rejects an empty sales selection", () => {
    expect(() => roundRobinLeadAssignments(["l1"], [], 1)).toThrow("Chọn ít nhất một nhân viên");
  });
});
