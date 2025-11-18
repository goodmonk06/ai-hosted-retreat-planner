import { prisma } from "../prisma";
import { logger } from "../logger";
import { metrics } from "../metrics";
import { eventEmitter } from "../events/emitter";
import { NotFoundError, ConflictError } from "../errors";

export interface CreateTemplateInput {
  communityId?: string;
  name: string;
  descriptionMarkdown?: string;
  daysCount: number;
  suggestedCapacity?: number;
  tags?: string[];
  isPublic?: boolean;
  templateData: any; // Complete template structure
}

export interface ApplyTemplateInput {
  templateId: string;
  name: string;
  communityId?: string;
  startDate?: Date;
  customizations?: Record<string, any>;
}

export class TemplateService {
  async createTemplate(input: CreateTemplateInput) {
    logger.info("Creating retreat template", { name: input.name });

    const template = await prisma.retreatTemplate.create({
      data: {
        name: input.name,
        descriptionMarkdown: input.descriptionMarkdown,
        daysCount: input.daysCount,
        suggestedCapacity: input.suggestedCapacity,
        tags: input.tags || [],
        isPublic: input.isPublic || false,
        templateData: input.templateData,
        communityId: input.communityId,
      },
    });

    metrics.recordCounter("templates.created", 1);

    await eventEmitter.emit({
      type: "template.created",
      timestamp: new Date(),
      data: {
        templateId: template.id,
        name: template.name,
        communityId: template.communityId,
      },
    });

    logger.info("Template created", { templateId: template.id });

    return template;
  }

  async listTemplates(filters?: { communityId?: string; isPublic?: boolean; tags?: string[] }) {
    logger.info("Listing templates", filters);

    const where: any = {};

    if (filters?.communityId) {
      where.communityId = filters.communityId;
    }

    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    const templates = await prisma.retreatTemplate.findMany({
      where,
      orderBy: [{ usageCount: "desc" }, { createdAt: "desc" }],
    });

    logger.info("Templates listed", { count: templates.length });

    return templates;
  }

  async getTemplate(id: string) {
    const template = await prisma.retreatTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundError("Template not found");
    }

    return template;
  }

  async applyTemplate(input: ApplyTemplateInput) {
    logger.info("Applying template", { templateId: input.templateId, name: input.name });

    const template = await this.getTemplate(input.templateId);

    // Extract template data
    const templateData = template.templateData as any;

    // Create blueprint from template
    const blueprint = await prisma.retreatBlueprint.create({
      data: {
        name: input.name,
        communityId: input.communityId,
        templateId: template.id,
        descriptionMarkdown: templateData.descriptionMarkdown,
        daysCount: template.daysCount,
        participantCountEstimate: template.suggestedCapacity || 20,
        maxCapacity: template.suggestedCapacity,
        locationConstraintsJson: templateData.locationConstraintsJson || {},
        tags: template.tags,
        startDate: input.startDate,
        status: "draft",
        // Apply day plans and sessions from template
        dayPlans: {
          create: (templateData.dayPlans || []).map((dayPlan: any) => ({
            dayIndex: dayPlan.dayIndex,
            theme: dayPlan.theme,
            notesMarkdown: dayPlan.notesMarkdown,
            sessions: {
              create: (dayPlan.sessions || []).map((session: any) => ({
                title: session.title,
                sessionType: session.sessionType,
                startTimeLocal: session.startTimeLocal,
                endTimeLocal: session.endTimeLocal,
                facilitatorName: session.facilitatorName,
                capacity: session.capacity,
                location: session.location,
                metaJson: session.metaJson || {},
              })),
            },
          })),
        },
        // Apply logistics from template
        logisticsItems: {
          create: (templateData.logisticsItems || []).map((item: any) => ({
            itemType: item.itemType,
            descriptionMarkdown: item.descriptionMarkdown,
            costEstimate: item.costEstimate,
            metaJson: item.metaJson || {},
          })),
        },
      },
      include: {
        dayPlans: {
          include: {
            sessions: true,
          },
        },
        logisticsItems: true,
      },
    });

    // Increment template usage count
    await prisma.retreatTemplate.update({
      where: { id: template.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    metrics.recordCounter("templates.applied", 1, { templateId: template.id });

    await eventEmitter.emit({
      type: "template.applied",
      timestamp: new Date(),
      data: {
        templateId: template.id,
        blueprintId: blueprint.id,
      },
    });

    logger.info("Template applied", { blueprintId: blueprint.id, templateId: template.id });

    return blueprint;
  }

  async createTemplateFromBlueprint(blueprintId: string, name: string, isPublic: boolean = false) {
    logger.info("Creating template from blueprint", { blueprintId, name });

    const blueprint = await prisma.retreatBlueprint.findUnique({
      where: { id: blueprintId },
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

    if (!blueprint) {
      throw new NotFoundError("Blueprint not found");
    }

    // Create template data from blueprint
    const templateData = {
      descriptionMarkdown: blueprint.descriptionMarkdown,
      locationConstraintsJson: blueprint.locationConstraintsJson,
      dayPlans: blueprint.dayPlans.map((dayPlan) => ({
        dayIndex: dayPlan.dayIndex,
        theme: dayPlan.theme,
        notesMarkdown: dayPlan.notesMarkdown,
        sessions: dayPlan.sessions.map((session) => ({
          title: session.title,
          sessionType: session.sessionType,
          startTimeLocal: session.startTimeLocal,
          endTimeLocal: session.endTimeLocal,
          facilitatorName: session.facilitatorName,
          capacity: session.capacity,
          location: session.location,
          metaJson: session.metaJson,
        })),
      })),
      logisticsItems: blueprint.logisticsItems.map((item) => ({
        itemType: item.itemType,
        descriptionMarkdown: item.descriptionMarkdown,
        costEstimate: item.costEstimate,
        metaJson: item.metaJson,
      })),
    };

    const template = await this.createTemplate({
      name,
      communityId: blueprint.communityId || undefined,
      descriptionMarkdown: blueprint.descriptionMarkdown || undefined,
      daysCount: blueprint.daysCount,
      suggestedCapacity: blueprint.participantCountEstimate,
      tags: blueprint.tags,
      isPublic,
      templateData,
    });

    logger.info("Template created from blueprint", {
      templateId: template.id,
      blueprintId,
    });

    return template;
  }
}

export const templateService = new TemplateService();
