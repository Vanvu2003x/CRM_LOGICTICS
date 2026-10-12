/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  const legacy = await db.user.findUnique({ where: { email: "minh.nguyen@logistics.vn" } });
  if (legacy?.name === "Nguyễn Văn Minh") {
    await db.user.update({
      where: { id: legacy.id },
      data: { name: "Nguyễn Minh (Sales mẫu)" },
    });
    console.log("Renamed legacy demo account; linked history was preserved.");
  } else {
    console.log("Legacy demo account is already normalized or does not exist.");
  }
}

main()
  .finally(() => db.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
