/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function addColumn(table, definition) {
  try {
    await db.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${definition}`);
  } catch (error) {
    if (!String(error).includes("duplicate column name")) throw error;
  }
}

async function main() {
  await addColumn("Lead", '"taxId" TEXT');
  await addColumn("Lead", '"address" TEXT');
  await addColumn("Lead", '"industry" TEXT');
  await addColumn("Lead", '"callOutcome" TEXT NOT NULL DEFAULT \'UNKNOWN\'');
  await addColumn("Attendance", '"closeType" TEXT');
  await addColumn("Attendance", '"closeNote" TEXT');
  await addColumn("Campaign", '"startDate" DATETIME');
  await addColumn("Campaign", '"endDate" DATETIME');
  await addColumn("Campaign", '"participants" TEXT NOT NULL DEFAULT \'[]\'');
  await addColumn("Agent", '"contactName" TEXT');
  await addColumn("Agent", '"phone" TEXT');
  await addColumn("Agent", '"whatsapp" TEXT');
  await addColumn("Agent", '"email" TEXT');
  await addColumn("Agent", '"notes" TEXT');
  await addColumn("SocialPost", '"leadId" TEXT');
  await db.$executeRawUnsafe('UPDATE "Lead" SET "callOutcome" = CASE WHEN "interestState" = \'YES\' THEN \'INTERESTED\' WHEN "interestState" = \'NO\' THEN \'NO_NEED\' ELSE \'UNKNOWN\' END WHERE "callOutcome" = \'UNKNOWN\'');
  await db.$executeRawUnsafe('UPDATE "Agent" SET "contactName" = "contact" WHERE "contactName" IS NULL');
  console.log("Added customer-feedback fields without deleting existing data.");
}

main().finally(() => db.$disconnect());
