import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { AccountDetailTabs } from "@/components/admin/accounts/AccountDetailTabs"

interface AccountLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function AccountLayout({ children, params }: AccountLayoutProps) {
  const { id } = await params
  const account = await db.account.findUnique({
    where: { id },
    select: { id: true, name: true },
  })

  if (!account) notFound()

  return (
    <div className="space-y-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{account.name}</h1>
      </div>
      <AccountDetailTabs accountId={account.id} />
      <div className="pt-6">{children}</div>
    </div>
  )
}
