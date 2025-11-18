"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface GenerateScheduleButtonProps {
  blueprintId: string;
}

export default function GenerateScheduleButton({
  blueprintId,
}: GenerateScheduleButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/blueprints/${blueprintId}/ai-generate-schedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preferences: {
              innerWorkFocus: 7,
              socialFocus: 6,
              physicalActivity: 5,
            },
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to generate schedule");
      }

      // Refresh the page to show the new schedule
      router.refresh();
    } catch (err) {
      console.error("Error generating schedule:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`px-4 py-2 rounded-md font-medium ${
          isGenerating
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-700"
        } text-white transition-colors`}
      >
        {isGenerating ? "Generating..." : "Generate AI Schedule"}
      </button>
      {error && (
        <p className="text-sm text-red-600">
          Error: {error}
        </p>
      )}
    </div>
  );
}
