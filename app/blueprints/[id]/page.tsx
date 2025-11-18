import Link from "next/link";
import { notFound } from "next/navigation";
import GenerateScheduleButton from "@/components/GenerateScheduleButton";

async function getBlueprint(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/blueprints/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.blueprint;
  } catch (error) {
    console.error("Error fetching blueprint:", error);
    return null;
  }
}

const sessionTypeColors: Record<string, string> = {
  circle: "bg-purple-100 text-purple-800 border-purple-300",
  talk: "bg-blue-100 text-blue-800 border-blue-300",
  break: "bg-gray-100 text-gray-800 border-gray-300",
  meal: "bg-green-100 text-green-800 border-green-300",
  ritual: "bg-amber-100 text-amber-800 border-amber-300",
  free: "bg-indigo-100 text-indigo-800 border-indigo-300",
};

export default async function BlueprintDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blueprint = await getBlueprint(id);

  if (!blueprint) {
    notFound();
  }

  const totalCost = blueprint.logisticsItems?.reduce(
    (sum: number, item: any) => sum + (item.costEstimate || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Link
              href="/blueprints"
              className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block"
            >
              ← Back to Blueprints
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{blueprint.name}</h1>
          </div>
          <GenerateScheduleButton blueprintId={blueprint.id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Duration:</span>{" "}
            <span className="text-gray-900">{blueprint.daysCount} days</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Participants:</span>{" "}
            <span className="text-gray-900">{blueprint.participantCountEstimate}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Created:</span>{" "}
            <span className="text-gray-900">
              {new Date(blueprint.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {blueprint.descriptionMarkdown && (
          <div className="mt-4 prose prose-sm max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap">
              {blueprint.descriptionMarkdown}
            </div>
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule</h2>

        {!blueprint.dayPlans || blueprint.dayPlans.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">No schedule generated yet</p>
            <p className="text-sm text-gray-400">
              Click "Generate AI Schedule" to create a schedule for this retreat
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {blueprint.dayPlans.map((day: any) => (
              <div key={day.id} className="border-l-4 border-indigo-500 pl-4">
                <div className="mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Day {day.dayIndex + 1}
                    {day.theme && (
                      <span className="text-indigo-600 ml-2">— {day.theme}</span>
                    )}
                  </h3>
                  {day.notesMarkdown && (
                    <p className="text-sm text-gray-600 mt-1">{day.notesMarkdown}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {day.sessions.map((session: any) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded border ${
                        sessionTypeColors[session.sessionType] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase">
                              {session.sessionType}
                            </span>
                            <span className="text-sm font-medium">
                              {session.title}
                            </span>
                          </div>
                          {session.facilitatorName && (
                            <p className="text-xs mt-1 opacity-75">
                              Facilitator: {session.facilitatorName}
                            </p>
                          )}
                        </div>
                        <div className="text-sm font-medium whitespace-nowrap ml-4">
                          {session.startTimeLocal} - {session.endTimeLocal}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Logistics</h2>

        {!blueprint.logisticsItems || blueprint.logisticsItems.length === 0 ? (
          <p className="text-gray-500">No logistics items defined</p>
        ) : (
          <div className="space-y-4">
            {blueprint.logisticsItems.map((item: any) => (
              <div key={item.id} className="border-l-4 border-gray-300 pl-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase text-gray-600">
                        {item.itemType}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700">
                      {item.descriptionMarkdown}
                    </div>
                  </div>
                  {item.costEstimate !== null && (
                    <div className="text-lg font-semibold text-gray-900 ml-4">
                      ${item.costEstimate.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {totalCost > 0 && (
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Total Estimated Cost
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
