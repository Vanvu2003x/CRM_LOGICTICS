import { expect, it } from "vitest";
import { paginate, matchesCampaignProduct, campaignPeople } from "./campaign-list";
it("resets out of range pages and bounds empty results", () => {
 expect(paginate([1,2,3],9,2)).toMatchObject({page:2,pages:2,items:[3]});
 expect(paginate([],4,10)).toMatchObject({page:1,pages:1,items:[]});
});
it("combines owner, penalty type and workflow filters", () => {
 const p={userId:"a",type:"PENALTY",step:"PRODUCT_DRAFT"};
 expect(matchesCampaignProduct(p,{owner:"a",type:"PENALTY",step:"PRODUCT_DRAFT"})).toBe(true);
 expect(matchesCampaignProduct(p,{owner:"b",type:"ALL",step:"ALL"})).toBe(false);
 expect(matchesCampaignProduct(p,{owner:"ALL",type:"NORMAL",step:"ALL"})).toBe(false);
});
it("groups multiple assignments and penalties by employee", () => {
 const user={id:"a",name:"Sales A"};
 expect(campaignPeople([{user,type:"NORMAL",step:"DONE"},{user,type:"PENALTY",step:"PRODUCT_DRAFT"},{user,type:"PENALTY",step:"DONE"}])).toEqual([{user,tasks:1,penalties:2,pendingPenalties:1,done:2}]);
});
