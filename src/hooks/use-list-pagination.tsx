"use client";
export function useListPagination<T>(items:T[],resetKey="",initialSize=20) {
 void resetKey;
 void initialSize;
 return { items, page: 1, pages: 1, total: items.length, size: items.length, offset: 0, controls: null };
}
