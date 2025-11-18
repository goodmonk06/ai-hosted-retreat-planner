import { NextRequest, NextResponse } from "next/server";
import { participantService } from "@/lib/services/participant-service";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createParticipantSchema = z.object({
  communityId: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(1).max(200),
  phoneNumber: z.string().optional(),
  bio: z.string().optional(),
  preferences: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  role: z.enum(["participant", "facilitator", "organizer", "support_staff"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId") || undefined;
    const role = searchParams.get("role") as any;
    const tags = searchParams.get("tags")?.split(",") || undefined;

    const participants = await participantService.listParticipants({
      communityId,
      role,
      tags,
    });

    return NextResponse.json({ participants });
  } catch (error) {
    logger.error("Error fetching participants", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createParticipantSchema.parse(body);

    const participant = await participantService.createParticipant(validatedData);

    return NextResponse.json({ participant }, { status: 201 });
  } catch (error) {
    logger.error("Error creating participant", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
