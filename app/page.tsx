import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI Retreat Planner
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Design multi-day retreats, camps, and in-person gatherings with AI-powered scheduling
        </p>
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href="/blueprints"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          View Retreat Blueprints
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Blueprint Creation
          </h3>
          <p className="text-gray-600">
            Define constraints like dates, participant count, and preferences
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            AI Scheduling
          </h3>
          <p className="text-gray-600">
            Generate day themes and sessions with AI-powered suggestions
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Logistics Planning
          </h3>
          <p className="text-gray-600">
            Track accommodation, transport, meals, and materials
          </p>
        </div>
      </div>
    </div>
  );
}
