import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const acme = await prisma.tenant.upsert({
    where: { slug: "acme" },
    update: {},
    create: { slug: "acme", name: "Acme", plan: "free" },
  });
  const globex = await prisma.tenant.upsert({
    where: { slug: "globex" },
    update: {},
    create: { slug: "globex", name: "Globex", plan: "free" },
  });

  const hash = await bcrypt.hash("password", 10);

  await prisma.user.upsert({
    where: { email: "admin@acme.test" },
    update: {},
    create: {
      email: "admin@acme.test",
      password_hash: hash,
      role: "admin",
      tenant_id: acme.id,
    },
  });
  await prisma.user.upsert({
    where: { email: "user@acme.test" },
    update: {},
    create: {
      email: "user@acme.test",
      password_hash: hash,
      role: "member",
      tenant_id: acme.id,
    },
  });
  await prisma.user.upsert({
    where: { email: "admin@globex.test" },
    update: {},
    create: {
      email: "admin@globex.test",
      password_hash: hash,
      role: "admin",
      tenant_id: globex.id,
    },
  });
  await prisma.user.upsert({
    where: { email: "user@globex.test" },
    update: {},
    create: {
      email: "user@globex.test",
      password_hash: hash,
      role: "member",
      tenant_id: globex.id,
    },
  });

  console.log("Seeded database with tenants and users");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
