import type { UserRole } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      /** Set for customer users. The Account.id they belong to. */
      accountId?: string
      /** Set for customer users. The Account.slug for URL routing. */
      accountSlug?: string
      /** Role scoped to the specific account (may differ from global User.role) */
      accountRole?: UserRole
    } & DefaultSession["user"]
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    accountId?: string
    accountSlug?: string
    accountRole?: UserRole
  }
}
