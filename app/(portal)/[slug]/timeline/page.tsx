export const metadata = { title: "Timeline" }

export default function TimelinePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Phase Timeline</h1>
      <p className="text-sm text-gray-500 mb-8">
        Visual overview of pilot phases and milestones.
      </p>

      {/* Placeholder — Epic 5 (Tasks 5.1 + 5.2) will build the Gantt-style timeline */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-400">
          Phase timeline coming in Epic 5
        </p>
      </div>
    </div>
  )
}
