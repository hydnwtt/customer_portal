/**
 * Creates an INTERNAL_ADMIN user in the database.
 * Usage: DATABASE_URL="..." npx tsx scripts/create-admin-user.ts
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const EMAIL = "hayden@getsavi.com"
const NAME = "Hayden Witt"
const PASSWORD = "PilotHub2026!"   // change after first login

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } })
  if (existing) {
    console.log(`ℹ️  User ${EMAIL} already exists — skipping creation.`)
    return
  }

  const user = await prisma.user.create({
    data: {
      name: NAME,
      email: EMAIL,
      hashedPassword: await bcrypt.hash(PASSWORD, 12),
      role: "INTERNAL_ADMIN",
    },
  })

  console.log(`✅ Created INTERNAL_ADMIN: ${user.email}`)
  console.log(`   Temporary password: ${PASSWORD}`)
  console.log(`   Login at: /auth/signin`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
