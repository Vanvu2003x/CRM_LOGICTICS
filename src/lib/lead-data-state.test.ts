import { expect, it } from "vitest";
import { exhaustedAllocation, matchesLeadData } from "./lead-data-state";
it("separates allocation from classification, including classified pool customers", () => {
  expect(matchesLeadData({ salesId: null, callOutcome: "INTERESTED" }, "POOL", "CLASSIFIED")).toBe(true);
  expect(matchesLeadData({ salesId: "sales", callOutcome: "UNKNOWN" }, "POOL", "ALL")).toBe(false);
  expect(matchesLeadData({ salesId: "sales", callOutcome: "UNKNOWN" }, "ASSIGNED", "UNCLASSIFIED")).toBe(true);
});
it("does not report a new employee without an allocation or while data remains", () => {
  expect(exhaustedAllocation([])).toBeNull();
  expect(exhaustedAllocation([{status:"NEW",callOutcome:"UNKNOWN",assignedAt:new Date(100)}])).toBeNull();
  expect(exhaustedAllocation([{status:"IN_PROGRESS",callOutcome:"INTERESTED",assignedAt:null}])).toBeNull();
});
it("identifies an exhausted allocation cycle and changes the key after a new allocation", () => {
  expect(exhaustedAllocation([{status:"NEW",callOutcome:"NO_NEED",assignedAt:new Date(100)}])).toBe(100);
  expect(exhaustedAllocation([{status:"IN_PROGRESS",callOutcome:"INTERESTED",assignedAt:new Date(200)}])).toBe(200);
});
