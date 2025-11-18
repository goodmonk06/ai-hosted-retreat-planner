import { NextRequest, NextResponse } from "next/server";
import { participantService } from "@/lib/services/participant-service";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const registerSchema = z.object({
  blueprintId: z.string(),
  participantId: z.string().optional(),
  participantData: z
    .object({
      email: z.string().email(),
      name: z.string().min(1),
      phoneNumber: z.string().optional(),
      preferences: z.record(z.any()).optional(),
    })
    .optional(),
  notes: z.string().optional(),
  metaJson: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const registration = await participantService.registerForRetreat(validatedData);

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    logger.error("Error creating registration", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
