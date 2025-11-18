import Link from "next/link";

async function getBlueprints() {
  // In production, this would use the actual API
  // For now, we'll use a server-side fetch
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/blueprints`, {
      cache: "no-store",
    });
    if (!res.ok) return { blueprints: [] };
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching blueprints:", error);
    return { blueprints: [] };
  }
}

export default async function BlueprintsPage() {
  const { blueprints } = await getBlueprints();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Retreat Blueprints</h1>
        <Link
          href="/blueprints/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Create New Blueprint
        </Link>
      </div>

      {blueprints.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">No blueprints found</p>
          <p className="text-sm text-gray-400">
            Create a new blueprint to get started, or run the seed script to load demo data
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blueprints.map((blueprint: any) => (
            <Link
              key={blueprint.id}
              href={`/blueprints/${blueprint.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {blueprint.name}
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Duration:</span> {blueprint.daysCount} days
                </p>
                <p>
                  <span className="font-medium">Participants:</span>{" "}
                  {blueprint.participantCountEstimate}
                </p>
                <p>
                  <span className="font-medium">Schedule:</span>{" "}
                  {blueprint.dayPlans?.length > 0 ? (
                    <span className="text-green-600">
                      {blueprint.dayPlans.length} days planned
                    </span>
                  ) : (
                    <span className="text-amber-600">Not yet scheduled</span>
                  )}
                </p>
                <p>
                  <span className="font-medium">Logistics:</span>{" "}
                  {blueprint.logisticsItems?.length || 0} items
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
