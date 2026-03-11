import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const INTERNAL_ROLES = new Set(["INTERNAL_ADMIN", "INTERNAL_MEMBER"])

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // ── Public routes ─────────────────────────────────────────────────────────
  // Auth pages, NextAuth API, health check, and static assets are always public
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/health" ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!session?.user) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  const { role, accountSlug } = session.user

  // ── Admin routes (/admin/*) ────────────────────────────────────────────────
  // Require INTERNAL_ADMIN or INTERNAL_MEMBER
  if (pathname.startsWith("/admin")) {
    if (!INTERNAL_ROLES.has(role)) {
      return NextResponse.redirect(new URL("/auth/unauthorized", req.url))
    }
    return NextResponse.next()
  }

  // ── Portal routes (/{slug}/*) ──────────────────────────────────────────────
  // Internal users can access any account slug — no restriction.
  // Customer users are locked to their own accountSlug.
  if (!INTERNAL_ROLES.has(role)) {
    const requestedSlug = pathname.split("/")[1]
    if (requestedSlug && accountSlug && requestedSlug !== accountSlug) {
      // Redirect customer to their own hub
      return NextResponse.redirect(new URL(`/${accountSlug}/welcome`, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  // Run middleware on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
