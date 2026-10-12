export { paginate } from "./pagination";
export function matchesCampaignProduct(p:{userId:string;type:string;step:string}, f:{owner:string;type:string;step:string}) {
 return (f.owner==="ALL"||p.userId===f.owner)&&(f.type==="ALL"||p.type===f.type)&&(f.step==="ALL"||p.step===f.step);
}
export function campaignPeople<T extends {id:string;name:string}>(products:{user:T;type:string;step:string}[]) {
 const people=new Map<string,{user:T;tasks:number;penalties:number;pendingPenalties:number;done:number}>();
 for(const p of products){const row=people.get(p.user.id)||{user:p.user,tasks:0,penalties:0,pendingPenalties:0,done:0};
 if(p.type==="PENALTY"){row.penalties++;if(p.step!=="DONE")row.pendingPenalties++;}else row.tasks++;
 if(p.step==="DONE")row.done++;people.set(p.user.id,row);}
 return [...people.values()];
}
