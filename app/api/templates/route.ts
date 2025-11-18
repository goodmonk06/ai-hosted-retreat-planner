import { NextRequest, NextResponse } from "next/server";
import { templateService } from "@/lib/services/template-service";
import { formatError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createTemplateSchema = z.object({
  communityId: z.string().optional(),
  name: z.string().min(3).max(200),
  descriptionMarkdown: z.string().optional(),
  daysCount: z.number().int().min(1).max(30),
  suggestedCapacity: z.number().int().min(1).max(1000).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  templateData: z.record(z.any()),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId") || undefined;
    const isPublic = searchParams.get("isPublic")
      ? searchParams.get("isPublic") === "true"
      : undefined;
    const tags = searchParams.get("tags")?.split(",") || undefined;

    const templates = await templateService.listTemplates({
      communityId,
      isPublic,
      tags,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    logger.error("Error fetching templates", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    const template = await templateService.createTemplate(validatedData);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    logger.error("Error creating template", error);
    const errorResponse = formatError(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
