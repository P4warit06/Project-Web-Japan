export const PAGE_SIZE = 20;

/** Turns `take: PAGE_SIZE + 1` rows into a Page. The extra row only signals "more". */
export function toPage<T extends { id: string }, U>(
  rows: T[],
  map: (row: T) => U,
): { items: U[]; nextCursor: string | null } {
  const hasMore = rows.length > PAGE_SIZE;
  const visible = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  return {
    items: visible.map(map),
    nextCursor: hasMore ? visible[visible.length - 1].id : null,
  };
}
