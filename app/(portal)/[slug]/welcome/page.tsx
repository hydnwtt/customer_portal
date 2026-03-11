export const metadata = { title: "Welcome" }

export default function WelcomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome</h1>
      <p className="text-sm text-gray-500 mb-8">
        Your pilot hub — everything you need in one place.
      </p>

      {/* Placeholder — Epic 3 (Tasks 3.1 + 3.2) will build the full welcome page */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-400">
          Welcome page content coming in Epic 3
        </p>
      </div>
    </div>
  )
}
