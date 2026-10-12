"use client";
import { useState } from "react";
import { paginate } from "@/lib/pagination";
import ListPagination from "@/components/ListPagination";
export function useListPagination<T>(items:T[],resetKey="",initialSize=20) {
 const signature=resetKey+"|"+JSON.stringify(items.map((item,index)=>{
  if(item&&typeof item==="object") {const record=item as Record<string,unknown>;return record.id||record.source||(record.user as {id?:string}|undefined)?.id||(record.item as {id?:string}|undefined)?.id||(record.lead as {id?:string}|undefined)?.id||index;}return item;
 }));
 const [state,setState]=useState({page:1,size:initialSize,signature});
 if(state.signature!==signature)setState({...state,page:1,signature});
 const result=paginate(items,state.signature===signature?state.page:1,state.size);
 return {...result,controls:<ListPagination page={result.page} pages={result.pages} total={result.total} size={state.size} onPage={page=>setState({...state,page,signature})} onSize={size=>setState({page:1,size,signature})}/>};
}
