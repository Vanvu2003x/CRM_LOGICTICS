export const SOCIAL_POST_TARGET = 3;
export const SOCIAL_COMMENT_TARGET = 5;

export function socialKpiProgress(items: { type: string }[]) {
  const posts = items.filter(item => item.type === "POST").length;
  const comments = items.filter(item => item.type === "COMMENT").length;
  const postPercent = Math.min(100, Math.round(posts / SOCIAL_POST_TARGET * 100));
  const commentPercent = Math.min(100, Math.round(comments / SOCIAL_COMMENT_TARGET * 100));
  return { posts, comments, postPercent, commentPercent, done: posts >= SOCIAL_POST_TARGET && comments >= SOCIAL_COMMENT_TARGET };
}

export function socialWinMetrics(items: { quality: string; order?: { status: string; invoiceAmount?: number | null } | null }[]) {
  const qualified = items.filter(item => item.quality === "QUALIFIED").length;
  const linkedOrders = items.filter(item => item.order).length;
  const wins = items.filter(item => item.order?.status === "COMPLETED");
  return {
    qualified,
    linkedOrders,
    wins: wins.length,
    winRate: linkedOrders ? Math.round(wins.length / linkedOrders * 100) : 0,
    wonValue: wins.reduce((sum, item) => sum + (item.order?.invoiceAmount || 0), 0),
  };
}
