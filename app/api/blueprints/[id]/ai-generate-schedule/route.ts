import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRetreatSchedule } from "@/lib/ai-scheduler";
import { AIScheduleRequest } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the blueprint
    const blueprint = await prisma.retreatBlueprint.findUnique({
      where: { id },
      include: {
        dayPlans: {
          include: {
            sessions: true,
          },
        },
      },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: "Blueprint not found" },
        { status: 404 }
      );
    }

    // Parse request body for preferences
    const body = await request.json().catch(() => ({}));
    const preferences = body.preferences || {};

    // Prepare AI request
    const aiRequest: AIScheduleRequest = {
      blueprintId: blueprint.id,
      daysCount: blueprint.daysCount,
      participantCount: blueprint.participantCountEstimate,
      preferences,
    };

    // Generate schedule using AI
    const aiResponse = await generateRetreatSchedule(aiRequest);

    // Delete existing day plans and sessions for this blueprint
    await prisma.retreatDayPlan.deleteMany({
      where: { blueprintId: blueprint.id },
    });

    // Create new day plans and sessions from AI response
    const createdDayPlans = await Promise.all(
      aiResponse.dayPlans.map(async (dayPlan) => {
        return prisma.retreatDayPlan.create({
          data: {
            blueprintId: blueprint.id,
            dayIndex: dayPlan.dayIndex,
            theme: dayPlan.theme,
            notesMarkdown: dayPlan.notesMarkdown,
            sessions: {
              create: dayPlan.sessions.map((session) => ({
                title: session.title,
                sessionType: session.sessionType,
                startTimeLocal: session.startTimeLocal,
                endTimeLocal: session.endTimeLocal,
                facilitatorName: session.facilitatorName,
                metaJson: session.metaJson || {},
              })),
            },
          },
          include: {
            sessions: true,
          },
        });
      })
    );

    // Return the updated blueprint
    const updatedBlueprint = await prisma.retreatBlueprint.findUnique({
      where: { id },
      include: {
        dayPlans: {
          include: {
            sessions: true,
          },
          orderBy: {
            dayIndex: "asc",
          },
        },
        logisticsItems: true,
      },
    });

    return NextResponse.json({
      success: true,
      blueprint: updatedBlueprint,
      generatedDaysCount: createdDayPlans.length,
    });
  } catch (error) {
    console.error("Error generating schedule:", error);
    return NextResponse.json(
      {
        error: "Failed to generate schedule",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
