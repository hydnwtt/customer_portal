import { db } from "@/lib/db"
import { LinksContent } from "@/components/portal/links/LinksContent"

export const metadata = { title: "Links" }

export default async function LinksPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const links = await db.helpfulLink.findMany({
    where: { account: { slug } },
    orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      url: true,
      category: true,
      description: true,
      isRequiredReading: true,
    },
  })

  return <LinksContent links={links} />
}
