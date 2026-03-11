import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function RootPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/signin")
  }

  const { role, accountSlug } = session.user

  if (role === "INTERNAL_ADMIN" || role === "INTERNAL_MEMBER") {
    redirect("/admin/accounts")
  }

  if (accountSlug) {
    redirect(`/${accountSlug}/welcome`)
  }

  // Fallback: shouldn't happen for a provisioned user, but handle gracefully
  redirect("/auth/signin")
}
