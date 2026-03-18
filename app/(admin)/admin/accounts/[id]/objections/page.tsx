import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import ObjectionTrackerClient from "./ObjectionTrackerClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ObjectionsPage({ params }: Props) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      objections: { orderBy: { dateRaised: "desc" } },
    },
  })

  if (!account) notFound()

  const objections = account.objections.map((o) => ({
    ...o,
    dateRaised: o.dateRaised.toISOString(),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  }))

  return (
    <ObjectionTrackerClient accountId={id} objections={objections} />
  )
}
