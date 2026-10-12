import {describe,it,expect} from "vitest";
import {validateStep} from "./step-validation";
import {periodBounds} from "./business-rules";
describe("Workflow business checks",()=>{
 it("không thu tiền chỉ bằng phát hành hóa đơn",()=>{
  expect(()=>validateStep(13,{invoiceNumber:"INV-1",amount:100,dueDate:"2026-10-10",invoiceIssued:true,paid:false})).toThrow();
  expect(()=>validateStep(13,{invoiceNumber:"INV-1",amount:100,dueDate:"2026-10-10",invoiceIssued:true,paid:true})).not.toThrow();
 });
 it("không hoàn tất hải quan luồng đang chờ",()=>{
  expect(()=>validateStep(10,{declaration:"ABC",lane:"RED",customsStatus:"WAITING"})).toThrow();
  expect(()=>validateStep(10,{declaration:"ABC",lane:"RED",customsStatus:"CLEARED"})).not.toThrow();
 });
 it("cần ba báo giá có giá thực",()=>{
  expect(()=>validateStep(3,{quotes:"[]"})).toThrow();
  expect(()=>validateStep(3,{quotes:JSON.stringify([{vendor:"A",price:1},{vendor:"B",price:2},{vendor:"C",price:3}])})).not.toThrow();
 });
 it("nêu đúng trường còn thiếu khi không thể hoàn tất",()=>{
  expect(()=>validateStep(2,{exportPort:"Hải Phòng"})).toThrow("importPort, transportMethod, expectedDate");
 });
 it("tính đúng tháng ngắn và mốc giờ Việt Nam",()=>{
  expect(periodBounds("2026-02-12","month").end.toISOString()).toBe("2026-02-28T17:00:00.000Z");
  expect(periodBounds("2026-10-07","month").end.toISOString()).toBe("2026-10-31T17:00:00.000Z");
 });
});
