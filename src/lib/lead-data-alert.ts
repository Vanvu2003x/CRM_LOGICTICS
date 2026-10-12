import { db } from "./db";
import { exhaustedAllocation } from "./lead-data-state";
export async function notifyExhaustedData() {
  const staff = await db.user.findMany({ where: { role: "SALES" }, select: {
    id: true, name: true, leads: { select: { status: true, callOutcome: true, assignedAt: true } },
  } });
  for (const user of staff) {
    const cycle = exhaustedAllocation(user.leads);
    if (cycle === null) continue;
    // A deterministic key prevents repeated polling or simultaneous requests
    // from producing multiple alerts for the same allocation.
    await db.$transaction(async tx => {
      if (await tx.leadDataRequest.findFirst({ where: { userId: user.id, status: "OPEN" } })) return;
      await tx.leadDataRequest.upsert({ where: { id: `data-empty-${user.id}-${cycle}` }, update: {}, create: {
        id: `data-empty-${user.id}-${cycle}`, userId: user.id,
        note: "Tự động: đã hết data mới được giao. Cần Admin cấp thêm data.",
      } });
    });
  }
}
