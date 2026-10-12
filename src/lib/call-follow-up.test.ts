import { describe, expect, it } from "vitest";
import { autoFollowUpAt } from "./call-follow-up";

describe("autoFollowUpAt", () => {
  const startedAt = new Date("2026-10-12T02:00:00.000Z");
  it("schedules the first two no-answer calls seven days later", () => {
    expect(autoFollowUpAt("NO_ANSWER", null, 0, startedAt)?.toISOString()).toBe("2026-10-19T02:00:00.000Z");
    expect(autoFollowUpAt("NO_ANSWER", null, 1, startedAt)?.toISOString()).toBe("2026-10-19T02:00:00.000Z");
  });
  it("keeps a sales schedule and stops after the second no-answer", () => {
    expect(autoFollowUpAt("NO_ANSWER", new Date("2026-10-20T02:00:00.000Z"), 0, startedAt)).toBeNull();
    expect(autoFollowUpAt("NO_ANSWER", null, 2, startedAt)).toBeNull();
    expect(autoFollowUpAt("ANSWERED", null, 0, startedAt)).toBeNull();
  });
});
