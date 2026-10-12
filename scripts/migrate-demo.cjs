/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");
const db = new PrismaClient();
async function main() {
  const team = await db.team.upsert({ where: { name: "Kinh doanh Logistics" }, create: { name: "Kinh doanh Logistics" }, update: {} });
  for (const user of await db.user.findMany()) {
    const salt = randomBytes(16).toString("hex");
    const password = user.password.startsWith("scrypt:") ? user.password : "scrypt:" + salt + ":" + scryptSync(user.password, salt, 64).toString("hex");
    await db.user.update({ where: { id: user.id }, data: { password, teamId: user.teamId || team.id } });
  }
  for (const lead of await db.lead.findMany()) {
    await db.lead.update({ where: { id: lead.id }, data: { interestState: lead.isInterested ? "YES" : "NO" } });
  }
  if (!await db.agent.count()) {
    for (const item of [
      ["KOREA EXPRESS CO., LTD", "Hàn Quốc", "Busan", "Mr. Kim"],
      ["SHANGHAI LOGISTICS", "Trung Quốc", "Shanghai", "Ms. Wang"],
      ["GLOBAL FORWARDING INC", "Mỹ", "Los Angeles", "John Doe"],
      ["TOKYO MARITIME", "Nhật Bản", "Tokyo", "Tanaka"],
    ]) await db.agent.create({ data: { name: item[0], country: item[1], city: item[2], contact: item[3] } });
  }
  await db.setting.upsert({ where: { key: "ity" }, create: { key: "ity", value: JSON.stringify({ mode: "DEMO", customer: "", domain: "", server: "", secret: randomBytes(24).toString("hex") }) }, update: {} });
  console.log("Migrated credentials and demo configuration without deleting business records.");
}
main().finally(() => db.$disconnect());
