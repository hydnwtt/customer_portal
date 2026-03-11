export const metadata = { title: "Tasks" }

export default function TasksPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Action Plan</h1>
      <p className="text-sm text-gray-500 mb-8">
        Shared task list for completing your pilot successfully.
      </p>

      {/* Placeholder — Epic 6 (Tasks 6.1–6.4) will build the full task tracker */}
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <p className="text-sm font-medium text-gray-400">
          Task tracker coming in Epic 6
        </p>
      </div>
    </div>
  )
}
