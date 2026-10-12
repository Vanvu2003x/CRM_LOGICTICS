"use client";
export default function ListPagination({page,pages,total,size,onPage,onSize}:{page:number;pages:number;total:number;size:number;onPage:(page:number)=>void;onSize:(size:number)=>void}) {
 return <div className="flex flex-wrap items-center justify-start gap-3 sm:justify-between rounded-xl border bg-white p-3 text-sm">
 <span className="text-slate-500">{total ? `${(page-1)*size+1}–${Math.min(page*size,total)} / ${total}` : "0 kết quả"}</span>
 <div className="mr-16 flex w-full flex-wrap items-center gap-2 sm:w-auto"><select aria-label="Số mục mỗi trang" value={size} onChange={e=>onSize(Number(e.target.value))} className="h-9 rounded-lg border px-2">{[5,10,20,50].map(n=><option key={n} value={n}>{n} / trang</option>)}</select>
 <button disabled={page<=1} onClick={()=>onPage(page-1)} className="h-9 rounded-lg border px-3 disabled:opacity-40">Trước</button><span>{page} / {pages}</span><button disabled={page>=pages} onClick={()=>onPage(page+1)} className="h-9 rounded-lg border px-3 disabled:opacity-40">Sau</button></div></div>;
}
