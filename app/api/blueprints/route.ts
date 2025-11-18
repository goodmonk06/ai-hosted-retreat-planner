import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blueprints - List all blueprints
export async function GET() {
  try {
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

    return NextResponse.json({ blueprints });
  } catch (error) {
    console.error("Error fetching blueprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch blueprints" },
      { status: 500 }
    );
  }
}

// POST /api/blueprints - Create a new blueprint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const blueprint = await prisma.retreatBlueprint.create({
      data: {
        name: body.name,
        descriptionMarkdown: body.descriptionMarkdown,
        daysCount: body.daysCount,
        participantCountEstimate: body.participantCountEstimate,
        locationConstraintsJson: body.locationConstraintsJson || {},
        communityId: body.communityId,
      },
      include: {
        dayPlans: true,
        logisticsItems: true,
      },
    });

    return NextResponse.json({ blueprint }, { status: 201 });
  } catch (error) {
    console.error("Error creating blueprint:", error);
    return NextResponse.json(
      { error: "Failed to create blueprint" },
      { status: 500 }
    );
  }
}
