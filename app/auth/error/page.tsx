import Link from "next/link"

export const metadata = { title: "Auth Error" }

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-sm text-gray-500 mb-6">
          {error === "Configuration"
            ? "There is a problem with the server configuration."
            : "An unexpected error occurred during sign in."}
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
