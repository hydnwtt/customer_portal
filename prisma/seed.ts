/**
 * Quick seed for local dev — creates demo users and one customer account.
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  const hash = (pw: string) => bcrypt.hash(pw, 12)

  // ── Internal Admin ─────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pilothub.dev" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@pilothub.dev",
      hashedPassword: await hash("password"),
      role: "INTERNAL_ADMIN",
      timezone: "America/New_York",
    },
  })
  console.log(`✅ Internal admin: ${adminUser.email}`)

  // ── Internal Member (CSM) ──────────────────────────────────────────────────
  const csmUser = await prisma.user.upsert({
    where: { email: "csm@pilothub.dev" },
    update: {},
    create: {
      name: "Casey Smith (CSM)",
      email: "csm@pilothub.dev",
      hashedPassword: await hash("password"),
      role: "INTERNAL_MEMBER",
      timezone: "America/Chicago",
    },
  })
  console.log(`✅ Internal member (CSM): ${csmUser.email}`)

  // ── Customer Account ───────────────────────────────────────────────────────
  const account = await prisma.account.upsert({
    where: { slug: "acme-corp" },
    update: {},
    create: {
      name: "Acme Corporation",
      slug: "acme-corp",
      status: "ACTIVE_PILOT",
      pilotStartDate: new Date("2026-01-15"),
      goNoGoDate: new Date("2026-04-01"),
      primaryColor: "#2563eb",
    },
  })
  console.log(`✅ Account: ${account.name} (/${account.slug})`)

  // ── Auto-create MSP + Welcome Page for the account ────────────────────────
  await prisma.mutualSuccessPlan.upsert({
    where: { accountId: account.id },
    update: {},
    create: { accountId: account.id },
  })

  await prisma.welcomePage.upsert({
    where: { accountId: account.id },
    update: {},
    create: {
      accountId: account.id,
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Welcome to your Pilot Hub" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "We're excited to partner with you on this pilot. This hub is your single source of truth for tracking progress, staying aligned, and measuring success.",
              },
            ],
          },
        ],
      },
    },
  })

  // ── Customer Admin User ────────────────────────────────────────────────────
  const customerAdmin = await prisma.user.upsert({
    where: { email: "admin@acme.dev" },
    update: {},
    create: {
      name: "Alex Johnson",
      email: "admin@acme.dev",
      hashedPassword: await hash("password"),
      role: "CUSTOMER_ADMIN",
      timezone: "America/Los_Angeles",
    },
  })

  await prisma.accountUser.upsert({
    where: { accountId_userId: { accountId: account.id, userId: customerAdmin.id } },
    update: {},
    create: { accountId: account.id, userId: customerAdmin.id, role: "CUSTOMER_ADMIN" },
  })
  console.log(`✅ Customer admin: ${customerAdmin.email}`)

  // ── Customer Viewer User ───────────────────────────────────────────────────
  const customerViewer = await prisma.user.upsert({
    where: { email: "viewer@acme.dev" },
    update: {},
    create: {
      name: "Sam Lee",
      email: "viewer@acme.dev",
      hashedPassword: await hash("password"),
      role: "CUSTOMER_VIEWER",
      timezone: "America/Los_Angeles",
    },
  })

  await prisma.accountUser.upsert({
    where: { accountId_userId: { accountId: account.id, userId: customerViewer.id } },
    update: {},
    create: { accountId: account.id, userId: customerViewer.id, role: "CUSTOMER_VIEWER" },
  })
  console.log(`✅ Customer viewer: ${customerViewer.email}`)

  console.log("\n✨ Done! Test credentials (all use password: 'password'):")
  console.log("  admin@pilothub.dev    → INTERNAL_ADMIN  → /admin/accounts")
  console.log("  csm@pilothub.dev      → INTERNAL_MEMBER → /admin/accounts")
  console.log("  admin@acme.dev        → CUSTOMER_ADMIN  → /acme-corp/welcome")
  console.log("  viewer@acme.dev       → CUSTOMER_VIEWER → /acme-corp/welcome")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
