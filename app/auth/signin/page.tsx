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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <h1 className="font-mono text-2xl font-bold text-foreground tracking-tight">
            {process.env.NEXT_PUBLIC_COMPANY_NAME || "Pilot Hub"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your portal</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
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
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="you@company.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card transition-colors"
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
