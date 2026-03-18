import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { PortalShell } from "@/components/portal/PortalShell"
import { parseAccountConfig } from "@/lib/account-config"
import type { Metadata } from "next"

interface PortalLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const account = await prisma.account.findUnique({
    where: { slug },
    select: { name: true },
  })
  return { title: { default: account?.name ?? "Portal", template: "%s | Savi Portal" } }
}

export default async function PortalLayout({ children, params }: PortalLayoutProps) {
  const { slug } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/${slug}/welcome`)
  }

  const account = await prisma.account.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      goNoGoDate: true,
      primaryColor: true,
      config: true,
    },
  })

  if (!account) {
    // Slug doesn't exist — send internal users to accounts list, others to signin
    const isInternal =
      session.user.role === "INTERNAL_ADMIN" || session.user.role === "INTERNAL_MEMBER"
    redirect(isInternal ? "/admin/accounts" : "/auth/signin")
  }

  // Customer users must match this account
  const isInternal =
    session.user.role === "INTERNAL_ADMIN" || session.user.role === "INTERNAL_MEMBER"
  if (!isInternal && session.user.accountId !== account.id) {
    const ownSlug = session.user.accountSlug
    redirect(ownSlug ? `/${ownSlug}/welcome` : "/auth/signin")
  }

  // Serialize dates before passing to client components
  const serializedAccount = {
    name: account.name,
    logoUrl: account.logoUrl,
    goNoGoDate: account.goNoGoDate?.toISOString() ?? null,
    primaryColor: account.primaryColor,
    config: parseAccountConfig(account.config),
  }

  return (
    <PortalShell
      slug={slug}
      account={serializedAccount}
      user={{ name: session.user.name ?? null, email: session.user.email ?? null }}
    >
      {children}
    </PortalShell>
  )
}
