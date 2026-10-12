export function roundRobinLeadAssignments(leadIds:string[],salesIds:string[],limit:number) {
  if(!salesIds.length)throw new Error("Chọn ít nhất một nhân viên.");
  const count=Math.max(0,Math.min(Math.floor(limit),leadIds.length));
  return leadIds.slice(0,count).map((leadId,index)=>({leadId,salesId:salesIds[index%salesIds.length]}));
}
