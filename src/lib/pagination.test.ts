import { expect,it } from "vitest";
import { paginate } from "./pagination";
it("keeps page boundaries and row numbering across filtered datasets",()=>{
 expect(paginate(Array.from({length:51},(_,i)=>i),3,20)).toMatchObject({page:3,pages:3,total:51,offset:40,items:Array.from({length:11},(_,i)=>i+40)});
 expect(paginate([7],3,20)).toMatchObject({page:1,pages:1,items:[7]});
 expect(paginate([],1,20)).toMatchObject({total:0,items:[],page:1,pages:1});
});
it("guards invalid sizes and page values",()=>{
 expect(paginate([1,2],NaN,0)).toMatchObject({page:1,items:[1,2]});
});
