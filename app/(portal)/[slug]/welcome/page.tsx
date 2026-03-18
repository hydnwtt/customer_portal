import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { tiptapJsonToText } from "@/lib/tiptap-text"
import WelcomeClient from "./WelcomeClient"

export const metadata = { title: "Welcome" }

interface Props {
  params: Promise<{ slug: string }>
}

export default async function WelcomePage({ params }: Props) {
  const { slug } = await params
  const session = await auth()

  const account = await db.account.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      pilotStartDate: true,
      goNoGoDate: true,
      pilotSites: { select: { id: true, name: true } },
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      welcomePage: {
        select: {
          id: true,
          content: true,
          versions: true,
          updatedAt: true,
        },
      },
      helpfulLinks: {
        where: { isRequiredReading: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          url: true,
          category: true,
          description: true,
          thumbnailUrl: true,
        },
      },
    },
  })

  if (!account) notFound()

  const isInternal =
    session?.user?.role === "INTERNAL_ADMIN" || session?.user?.role === "INTERNAL_MEMBER"

  const contentText = account.welcomePage?.content
    ? tiptapJsonToText(account.welcomePage.content)
    : ""

  type VersionEntry = { content: string; savedAt: string; savedBy: string }
  const rawVersions = account.welcomePage?.versions
  const versions: VersionEntry[] = Array.isArray(rawVersions)
    ? (rawVersions as VersionEntry[])
    : []

  return (
    <WelcomeClient
      account={{
        id: account.id,
        name: account.name,
        status: account.status,
        pilotStartDate: account.pilotStartDate?.toISOString() ?? null,
        goNoGoDate: account.goNoGoDate?.toISOString() ?? null,
        pilotSites: account.pilotSites,
        teamMembers: account.users.map((u) => ({
          userId: u.userId,
          name: u.user.name,
          email: u.user.email,
          role: u.user.role,
        })),
      }}
      welcomeContent={contentText}
      welcomeUpdatedAt={account.welcomePage?.updatedAt?.toISOString() ?? null}
      versions={versions}
      requiredReading={account.helpfulLinks}
      isInternal={isInternal}
      currentUserName={session?.user?.name ?? "Unknown"}
    />
  )
}
