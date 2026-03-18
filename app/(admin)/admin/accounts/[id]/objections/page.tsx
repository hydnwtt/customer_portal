import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ObjectionCategory, ObjectionStatus } from "@prisma/client"
import ObjectionTrackerClient from "./ObjectionTrackerClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ObjectionsPage({ params }: Props) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!account) notFound()

  // The Objection table requires a DB migration. Catch errors gracefully so
  // the rest of admin still works while the migration is pending.
  type SerializedObjection = {
    id: string
    objection: string
    raisedBy: string | null
    dateRaised: string
    category: ObjectionCategory
    status: ObjectionStatus
    resolutionNotes: string | null
    owner: string | null
    createdAt: string
    updatedAt: string
  }

  let objections: SerializedObjection[] = []
  let migrationNeeded = false

  try {
    const rows = await db.objection.findMany({
      where: { accountId: id },
      orderBy: { dateRaised: "desc" },
    })
    objections = rows.map((o) => ({
      ...o,
      dateRaised: o.dateRaised.toISOString(),
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }))
  } catch {
    migrationNeeded = true
  }

  if (migrationNeeded) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6 max-w-xl">
        <h2 className="font-mono text-base font-semibold text-foreground mb-2">
          Database migration required
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          The Objections table hasn&apos;t been created yet. Run one of the following commands:
        </p>
        <pre className="rounded-md bg-muted px-4 py-3 text-xs font-mono text-foreground mb-2">
          {`# Production / Vercel\nnpx prisma migrate deploy\n\n# Local dev\nnpx prisma migrate dev --name add_objection_model`}
        </pre>
        <p className="text-xs text-muted-foreground">
          After the migration runs, refresh this page.
        </p>
      </div>
    )
  }

  return <ObjectionTrackerClient accountId={id} objections={objections} />
}
