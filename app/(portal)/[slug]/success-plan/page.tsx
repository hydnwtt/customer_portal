import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { tiptapJsonToText } from "@/lib/tiptap-text"
import PilotDetailsTab from "./PilotDetailsTab"
import SuccessMetricsTab from "./SuccessMetricsTab"
import StakeholderTab from "./StakeholderTab"
import KnownRisksTab from "./KnownRisksTab"

export const metadata = { title: "Success Plan" }

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function SuccessPlanPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { tab = "details" } = await searchParams
  const session = await auth()

  const account = await db.account.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      pilotStartDate: true,
      goNoGoDate: true,
      pilotSites: { select: { id: true, name: true } },
      mutualSuccessPlan: {
        include: {
          successMetrics: {
            include: { owner: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
          risks: { orderBy: { createdAt: "asc" } },
        },
      },
      stakeholders: { orderBy: { createdAt: "asc" } },
      users: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  })

  if (!account) notFound()

  const isInternal =
    session?.user?.role === "INTERNAL_ADMIN" || session?.user?.role === "INTERNAL_MEMBER"
  const isEditor = isInternal || session?.user?.role === "CUSTOMER_ADMIN"

  const msp = account.mutualSuccessPlan

  const serializedAccount = {
    id: account.id,
    name: account.name,
    pilotStartDate: account.pilotStartDate?.toISOString() ?? null,
    goNoGoDate: account.goNoGoDate?.toISOString() ?? null,
    pilotSites: account.pilotSites,
    teamMembers: account.users.map((u) => ({
      userId: u.userId,
      role: u.role,
      name: u.user.name,
      email: u.user.email,
      userRole: u.user.role,
    })),
  }

  const serializedMsp = msp
    ? {
        id: msp.id,
        keyPainPoints: tiptapJsonToText(msp.keyPainPoints),
        definitionOfDone: tiptapJsonToText(msp.definitionOfDone),
        outOfScope: tiptapJsonToText(msp.outOfScope),
        expansionOpportunities: tiptapJsonToText(msp.expansionOpportunities),
        successMetrics: msp.successMetrics.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
          owner: m.owner ?? null,
        })),
        risks: msp.risks.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
      }
    : null

  const serializedStakeholders = account.stakeholders.map((s) => ({
    ...s,
    lastEngagedAt: s.lastEngagedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  const tabs = [
    { id: "details", label: "Pilot Details" },
    { id: "metrics", label: "Success Metrics" },
    { id: "stakeholders", label: "Stakeholders" },
    { id: "risks", label: "Known Risks" },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-mono text-2xl font-bold text-foreground mb-1">Mutual Success Plan</h1>
        <p className="text-sm text-muted-foreground">
          Goals, scope, stakeholders, and success metrics for this pilot.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((t) => (
          <a
            key={t.id}
            href={`?tab=${t.id}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {tab === "details" && (
        <PilotDetailsTab
          account={serializedAccount}
          msp={serializedMsp}
          isEditor={isEditor}
        />
      )}
      {tab === "metrics" && (
        <SuccessMetricsTab
          accountId={account.id}
          mspId={msp?.id ?? null}
          metrics={serializedMsp?.successMetrics ?? []}
          isEditor={isEditor}
          teamMembers={serializedAccount.teamMembers}
        />
      )}
      {tab === "stakeholders" && (
        <StakeholderTab
          accountId={account.id}
          stakeholders={serializedStakeholders}
          isEditor={isEditor}
          isInternal={isInternal}
        />
      )}
      {tab === "risks" && (
        <KnownRisksTab
          accountId={account.id}
          mspId={msp?.id ?? null}
          risks={serializedMsp?.risks ?? []}
          isEditor={isEditor}
        />
      )}
    </div>
  )
}
