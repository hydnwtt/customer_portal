import { auth, signIn } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuthError } from "next-auth"

export const metadata = { title: "Sign In" }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}) {
  const { callbackUrl, error } = await searchParams

  const session = await auth()
  if (session?.user) {
    const { role, accountSlug } = session.user
    if (role === "INTERNAL_ADMIN" || role === "INTERNAL_MEMBER") {
      redirect("/admin/accounts")
    }
    if (accountSlug) {
      redirect(`/${accountSlug}/welcome`)
    }
  }

  const errorMessages: Record<string, string> = {
    CredentialsSignin: "Invalid email or password.",
    Default: "Something went wrong. Please try again.",
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Pilot Hub"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your portal</p>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg">
              {errorMessages[error] ?? errorMessages.Default}
            </div>
          )}

          <form
            action={async (formData: FormData) => {
              "use server"
              try {
                await signIn("credentials", {
                  email: formData.get("email"),
                  password: formData.get("password"),
                  redirectTo: callbackUrl || "/",
                })
              } catch (err) {
                if (err instanceof AuthError) {
                  redirect(`/auth/signin?error=${err.type}`)
                }
                throw err
              }
            }}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
