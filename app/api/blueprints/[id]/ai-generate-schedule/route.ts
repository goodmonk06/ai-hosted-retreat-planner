import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRetreatSchedule } from "@/lib/ai-scheduler";
import { AIScheduleRequest } from "@/lib/types";
import { generateScheduleSchema } from "@/lib/validation";
import { formatError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { metrics, measureAsync } from "@/lib/metrics";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate request body
    const body = await request.json().catch(() => ({}));
    const validatedData = generateScheduleSchema.parse(body);

    logger.info("Generating AI schedule", { blueprintId: id });

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
      throw new NotFoundError("Blueprint not found");
    }

    // Prepare AI request
    const aiRequest: AIScheduleRequest = {
      blueprintId: blueprint.id,
      daysCount: blueprint.daysCount,
      participantCount: blueprint.participantCountEstimate,
      preferences: validatedData.preferences || {},
    };

    // Generate schedule using AI with metrics
    const aiResponse = await measureAsync(
      "ai_schedule_generation",
      () => generateRetreatSchedule(aiRequest),
      { blueprintId: id }
    );

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

    metrics.recordCounter("ai_schedules.generated", 1, {
      blueprintId: id,
      daysCount: createdDayPlans.length
    });
    logger.info("AI schedule generated", {
      blueprintId: id,
      daysCount: createdDayPlans.length
    });

    return NextResponse.json({
      success: true,
      blueprint: updatedBlueprint,
      generatedDaysCount: createdDayPlans.length,
    });
  } catch (error) {
    logger.error("Error generating schedule", error, { blueprintId: (await params).id });
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
