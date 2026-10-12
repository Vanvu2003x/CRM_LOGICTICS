/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

function dayKey(date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function mergedSession(rows) {
  const chosen = new Set(rows.flatMap(row => row.session === "BOTH" ? ["MORNING", "AFTERNOON"] : row.session === "NONE" ? [] : [row.session]));
  return chosen.size === 2 ? "BOTH" : chosen.has("MORNING") ? "MORNING" : chosen.has("AFTERNOON") ? "AFTERNOON" : "NONE";
}

async function main() {
  const fairs = await db.tradeFair.findMany({ include: { participations: { orderBy: { createdAt: "asc" } } } });
  const sales = await db.user.findMany({ where: { role: "SALES" }, select: { id: true } });
  for (const fair of fairs) {
    for (const member of sales) {
      const memberRows = fair.participations.filter(row => row.userId === member.id);
      const status = memberRows.some(row => row.session !== "NONE") ? "PARTICIPATING" : "PENDING";
      await db.tradeFairRegistration.upsert({ where: { fairId_userId: { fairId: fair.id, userId: member.id } }, update: {}, create: { fairId: fair.id, userId: member.id, status } });
    }
    const groups = new Map();
    for (const row of fair.participations) {
      if (!row.day) continue;
      const key = `${row.userId}:${dayKey(row.day)}`;
      groups.set(key, [...(groups.get(key) || []), row]);
    }
    for (const rows of groups.values()) {
      if (rows.length < 2) continue;
      const keep = rows[0], remove = rows.slice(1);
      const richest = [...rows].sort((a, b) => Number(Boolean(b.marketingLink)) + Number(Boolean(b.resultNote)) - Number(Boolean(a.marketingLink)) - Number(Boolean(a.resultNote)))[0];
      const normalizedDay = new Date(`${dayKey(keep.day)}T00:00:00+07:00`);
      await db.$transaction(async tx => {
        await tx.tradeFairLead.updateMany({ where: { participationId: { in: remove.map(row => row.id) } }, data: { participationId: keep.id } });
        await tx.tradeFairParticipation.update({ where: { id: keep.id }, data: { day: normalizedDay, session: mergedSession(rows), slot: null, reason: mergedSession(rows) === "NONE" ? richest.reason : null, marketingLink: richest.marketingLink, resultNote: richest.resultNote, submittedAt: richest.submittedAt, resultAt: richest.resultAt } });
        await tx.tradeFairParticipation.deleteMany({ where: { id: { in: remove.map(row => row.id) } } });
      });
    }
    for (const row of fair.participations) if (row.day) await db.tradeFairParticipation.update({ where: { id: row.id }, data: { day: new Date(`${dayKey(row.day)}T00:00:00+07:00`) } }).catch(() => {});
  }
  console.log(`Normalized ${fairs.length} trade fair(s).`);
}

main().finally(() => db.$disconnect());
