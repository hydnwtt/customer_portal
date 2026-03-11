import { db } from "@/lib/db"
import { WelcomePageContent } from "@/components/portal/welcome/WelcomePageContent"

export const metadata = { title: "Welcome" }

interface Props {
  params: Promise<{ slug: string }>
}

export default async function WelcomePage({ params }: Props) {
  const { slug } = await params

  const [welcomePage, requiredLinks] = await Promise.all([
    db.welcomePage.findFirst({
      where: { account: { slug } },
      select: { content: true },
    }),
    db.helpfulLink.findMany({
      where: { account: { slug }, isRequiredReading: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, url: true, description: true },
    }),
  ])

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-foreground">Welcome</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Your pilot hub — everything you need in one place.
      </p>

      <WelcomePageContent
        content={welcomePage?.content ?? null}
        requiredLinks={requiredLinks}
      />
    </div>
  )
}
