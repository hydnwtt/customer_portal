import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { parseAccountConfig } from "@/lib/account-config"
import { HubConfigForm } from "@/components/admin/accounts/HubConfigForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AccountConfigPage({ params }: Props) {
  const { id } = await params

  const account = await db.account.findUnique({
    where: { id },
    select: { id: true, logoUrl: true, primaryColor: true, config: true },
  })

  if (!account) notFound()

  const config = parseAccountConfig(account.config)

  return (
    <HubConfigForm
      accountId={account.id}
      logoUrl={account.logoUrl}
      primaryColor={account.primaryColor}
      config={config}
    />
  )
}
