import { NextRequest, NextResponse } from "next/server";
import { templateService } from "@/lib/services/template-service";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const applyTemplateSchema = z.object({
  name: z.string().min(3).max(200),
  communityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  customizations: z.record(z.any()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
    const body = await request.json();
    const validatedData = applyTemplateSchema.parse(body);

    const blueprint = await templateService.applyTemplate({
      templateId,
      name: validatedData.name,
      communityId: validatedData.communityId,
      startDate: validatedData.startDate
        ? new Date(validatedData.startDate)
        : undefined,
      customizations: validatedData.customizations,
    });

    return NextResponse.json({ blueprint }, { status: 201 });
  } catch (error) {
    logger.error("Error applying template", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
