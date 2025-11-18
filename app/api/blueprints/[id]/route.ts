import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blueprints/:id - Get a single blueprint
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const blueprint = await prisma.retreatBlueprint.findUnique({
      where: { id },
      include: {
        dayPlans: {
          include: {
            sessions: {
              orderBy: {
                startTimeLocal: "asc",
              },
            },
          },
          orderBy: {
            dayIndex: "asc",
          },
        },
        logisticsItems: {
          orderBy: {
            itemType: "asc",
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

    return NextResponse.json({ blueprint });
  } catch (error) {
    console.error("Error fetching blueprint:", error);
    return NextResponse.json(
      { error: "Failed to fetch blueprint" },
      { status: 500 }
    );
  }
}

// DELETE /api/blueprints/:id - Delete a blueprint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.retreatBlueprint.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blueprint:", error);
    return NextResponse.json(
      { error: "Failed to delete blueprint" },
      { status: 500 }
    );
  }
}
