import { NextRequest, NextResponse } from "next/server";
import { roomAssignmentService } from "@/lib/services/room-assignment-service";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createRoomSchema = z.object({
  name: z.string().min(1).max(200),
  roomType: z.enum(["single", "double", "dormitory", "tent", "other"]),
  capacity: z.number().int().min(1).max(100),
  floor: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  metaJson: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blueprintId } = await params;

    const rooms = await roomAssignmentService.listRooms(blueprintId);

    return NextResponse.json({ rooms });
  } catch (error) {
    logger.error("Error fetching rooms", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: blueprintId } = await params;
    const body = await request.json();
    const validatedData = createRoomSchema.parse(body);

    const room = await roomAssignmentService.createRoom({
      ...validatedData,
      blueprintId,
    });

    return NextResponse.json({ room }, { status: 201 });
  } catch (error) {
    logger.error("Error creating room", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
