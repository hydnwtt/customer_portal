import { redirect } from "next/navigation"

export default async function PortalRootPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/${slug}/welcome`)
}
