import { redirect } from "next/navigation"
import { verifyInviteToken } from "@/lib/invite-token"
import { db } from "@/lib/db"
import { AcceptInviteForm } from "./AcceptInviteForm"
import Link from "next/link"

export const metadata = { title: "Accept Invite" }

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    redirect("/auth/signin")
  }

  const payload = verifyInviteToken(token)

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {process.env.NEXT_PUBLIC_COMPANY_NAME || "Pilot Hub"}
            </h1>
          </div>
          <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Invite link expired</h2>
            <p className="text-sm text-gray-500 mb-6">
              This invite link is invalid or has expired. Invite links are valid for 48 hours.
              Please ask your administrator to send a new invite.
            </p>
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { name: true },
  })

  const userName = user?.name ?? "there"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Pilot Hub"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Welcome, {userName}! Set your password to get started.</p>
        </div>
        <AcceptInviteForm token={token} />
      </div>
    </div>
  )
}
