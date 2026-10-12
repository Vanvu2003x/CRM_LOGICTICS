import {describe,it,expect} from "vitest";
import {officialOrderCode} from "./order-codes";
describe("Mã đơn chính thức",()=>{
 it("tạo mã theo loại đơn và tháng booking",()=>{
  expect(officialOrderCode("EXPORT",new Date("2026-10-12T00:00:00Z"),7)).toBe("LP-XK-2610-007");
  expect(officialOrderCode("IMPORT",new Date("2026-02-03T00:00:00Z"),2)).toBe("LP-NK-2602-002");
 });
});
