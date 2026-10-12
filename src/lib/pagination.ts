export function paginate<T>(items:T[],requestedPage:number,size:number) {
 const pageSize=Number.isFinite(size)&&size>0?Math.max(1,Math.floor(size)):20;
 const pages=Math.max(1,Math.ceil(items.length/pageSize));
 const page=Math.min(Math.max(1,Number.isFinite(requestedPage)?Math.floor(requestedPage):1),pages);
 return {items:items.slice((page-1)*pageSize,page*pageSize),page,pages,total:items.length,offset:(page-1)*pageSize};
}
