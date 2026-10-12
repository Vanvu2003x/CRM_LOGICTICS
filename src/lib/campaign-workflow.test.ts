import { describe, expect, it } from "vitest";
import { campaignPenaltyData, shouldRemindCampaign, campaignPenalties } from "./campaign-workflow";

describe("campaign workflow", () => {
  it("opens a reminder when the deadline is two days away", () => {
    const now = new Date("2026-10-09T08:00:00+07:00");
    expect(shouldRemindCampaign(new Date("2026-10-11T08:00:00+07:00"), now)).toBe(true);
    expect(shouldRemindCampaign(new Date("2026-10-11T08:01:00+07:00"), now)).toBe(false);
  });

  it("creates one independently submittable penalty assignment per late day", () => {
    const item = campaignPenaltyData({ id: "content-1", campaignId: "campaign-1", userId: "sales-1", title: "MSC" }, new Date("2026-10-09T10:00:00Z"), 2);
    expect(item).toMatchObject({ penaltyKey: "content-1:2", type: "PENALTY", step: "PRODUCT_DRAFT", title: "Bài phạt ngày trễ thứ 2", requirements: "1 bài truyền thông phạt" });
    expect(item.deadline.toISOString()).toBe("2026-10-12T10:00:00.000Z");
  });
});

it("catches up late days, stops at completion and never penalizes penalties", () => {
 const product={id:"p",campaignId:"c",userId:"u",title:"Video",type:"NORMAL",completedAt:null};
 const due=new Date("2026-10-09T08:00:00Z");
 expect(campaignPenalties(product,due,new Date("2026-10-11T09:00:00Z")).map(p=>p.penaltyKey)).toEqual(["p:1","p:2","p:3"]);
 expect(campaignPenalties({...product,type:"PENALTY"},due,new Date("2026-10-11T09:00:00Z"))).toEqual([]);
 expect(campaignPenalties({...product,completedAt:new Date("2026-10-10T08:00:00Z")},due,new Date("2026-10-12T09:00:00Z"))).toHaveLength(1);
});
