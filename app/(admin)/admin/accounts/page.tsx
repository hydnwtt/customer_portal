import { db } from "@/lib/db"
import { computeRiskScore } from "@/lib/risk-score"
import { AccountsClientShell } from "@/components/admin/accounts/AccountsClientShell"
import type { AccountRow } from "@/components/admin/accounts/AccountsTable"
import type { Prisma } from "@prisma/client"

export const metadata = { title: "All Accounts" }

type AccountWithHealth = Prisma.AccountGetPayload<{
  include: {
    users: {
      include: {
        user: { select: { id: true; name: true; role: true; lastLoginAt: true } }
      }
    }
    phases: {
      include: {
        tasks: { select: { status: true; dueDate: true } }
      }
    }
    mutualSuccessPlan: {
      include: {
        successMetrics: { select: { status: true } }
      }
    }
  }
}>

export default async function AccountsPage() {
  const [accounts, internalUsers] = await Promise.all([
    db.account.findMany({
      include: {
        users: {
          include: {
            user: { select: { id: true, name: true, role: true, lastLoginAt: true } },
          },
        },
        phases: {
          include: {
            tasks: { select: { status: true, dueDate: true } },
          },
        },
        mutualSuccessPlan: {
          include: {
            successMetrics: { select: { status: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.user.findMany({
      where: { role: { in: ["INTERNAL_ADMIN", "INTERNAL_MEMBER"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ])

  const rows: AccountRow[] = accounts.map((acct: AccountWithHealth) => {
    const allTasks = acct.phases.flatMap((p) => p.tasks)
    const taskTotal = allTasks.length
    const taskCompleted = allTasks.filter((t) => t.status === "COMPLETE").length

    const metrics = acct.mutualSuccessPlan?.successMetrics ?? []
    const metricCounts = {
      ON_TRACK: metrics.filter((m) => m.status === "ON_TRACK").length,
      AT_RISK: metrics.filter((m) => m.status === "AT_RISK").length,
      ACHIEVED: metrics.filter((m) => m.status === "ACHIEVED").length,
    }

    const internalMembers = acct.users.filter(
      (au) => au.user.role === "INTERNAL_ADMIN" || au.user.role === "INTERNAL_MEMBER"
    )
    const csm = internalMembers[0]?.user ?? null

    const customerUsers = acct.users.filter(
      (au) => au.user.role === "CUSTOMER_ADMIN" || au.user.role === "CUSTOMER_VIEWER"
    )
    const lastCustomerLogin =
      customerUsers
        .map((au) => au.user.lastLoginAt)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

    const { score, isHighRisk } = computeRiskScore({
      lastCustomerLoginAt: lastCustomerLogin,
      tasks: allTasks,
      successMetrics: metrics,
      goNoGoDate: acct.goNoGoDate,
    })

    return {
      id: acct.id,
      name: acct.name,
      slug: acct.slug,
      status: acct.status,
      goNoGoDate: acct.goNoGoDate?.toISOString() ?? null,
      csmName: csm?.name ?? null,
      taskTotal,
      taskCompleted,
      metricCounts,
      lastCustomerLoginAt: lastCustomerLogin?.toISOString() ?? null,
      riskScore: score,
      isHighRisk,
    }
  })

  return (
    <div>
      <AccountsClientShell accounts={rows} internalUsers={internalUsers} />
    </div>
  )
}
