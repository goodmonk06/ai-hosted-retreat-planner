import { NextRequest, NextResponse } from "next/server";
import { roomAssignmentService } from "@/lib/services/room-assignment-service";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const assignRoomSchema = z.object({
  roomId: z.string(),
  participantId: z.string(),
  bedNumber: z.number().int().optional(),
  preferences: z.record(z.any()).optional(),
});

const autoAssignSchema = z.object({
  prioritizePreferences: z.boolean().optional(),
  groupByTags: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blueprintId } = await params;
    const body = await request.json();

    // Check if this is an auto-assign request
    if (body.autoAssign) {
      const validatedData = autoAssignSchema.parse(body);

      const result = await roomAssignmentService.autoAssignRooms({
        blueprintId,
        prioritizePreferences: validatedData.prioritizePreferences,
        groupByTags: validatedData.groupByTags,
      });

      return NextResponse.json({ result }, { status: 201 });
    }

    // Manual assignment
    const validatedData = assignRoomSchema.parse(body);

    const assignment = await roomAssignmentService.assignParticipantToRoom(validatedData);

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    logger.error("Error assigning room", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
