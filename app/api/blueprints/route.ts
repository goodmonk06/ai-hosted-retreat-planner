import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBlueprintSchema } from "@/lib/validation";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { metrics } from "@/lib/metrics";

// GET /api/blueprints - List all blueprints
export async function GET() {
  try {
    logger.info("Fetching all blueprints");

    const blueprints = await prisma.retreatBlueprint.findMany({
      include: {
        dayPlans: {
          include: {
            sessions: true,
          },
        },
        logisticsItems: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    metrics.recordCounter("blueprints.list", 1, { count: blueprints.length });
    logger.info("Fetched blueprints", { count: blueprints.length });

    return NextResponse.json({ blueprints });
  } catch (error) {
    logger.error("Error fetching blueprints", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}

// POST /api/blueprints - Create a new blueprint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = createBlueprintSchema.parse(body);

    logger.info("Creating blueprint", { name: validatedData.name });

    const blueprint = await prisma.retreatBlueprint.create({
      data: {
        name: validatedData.name,
        descriptionMarkdown: validatedData.descriptionMarkdown,
        daysCount: validatedData.daysCount,
        participantCountEstimate: validatedData.participantCountEstimate,
        locationConstraintsJson: validatedData.locationConstraintsJson || {},
        communityId: validatedData.communityId,
      },
      include: {
        dayPlans: true,
        logisticsItems: true,
      },
    });

    metrics.recordCounter("blueprints.created", 1);
    logger.info("Blueprint created", { id: blueprint.id, name: blueprint.name });

    return NextResponse.json({ blueprint }, { status: 201 });
  } catch (error) {
    logger.error("Error creating blueprint", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, { status: errorResponse.error.statusCode });
  }
}
