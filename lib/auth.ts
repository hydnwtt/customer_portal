import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { UserRole } from "@prisma/client"

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.hashedPassword) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        )

        if (!isValid) return null

        // Update last login timestamp (fire-and-forget)
        void prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),

    // ── SSO stubs (Phase 3) ───────────────────────────────────────────────────
    // TODO: Add SAML provider via @auth/core/providers/saml or similar
    // TODO: Add Google OAuth provider for internal users
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as { role: UserRole }).role

        // For customer users, resolve and cache their account context in the JWT
        const isCustomer =
          token.role === "CUSTOMER_ADMIN" || token.role === "CUSTOMER_VIEWER"

        if (isCustomer) {
          const accountUser = await prisma.accountUser.findFirst({
            where: { userId: user.id as string },
            include: { account: { select: { id: true, slug: true } } },
            orderBy: { createdAt: "asc" },
          })
          if (accountUser) {
            token.accountId = accountUser.accountId
            token.accountSlug = accountUser.account.slug
            token.accountRole = accountUser.role
          }
        }
      }
      return token
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        if (token.accountId) {
          session.user.accountId = token.accountId as string
          session.user.accountSlug = token.accountSlug as string
          session.user.accountRole = token.accountRole as UserRole
        }
      }
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
})
