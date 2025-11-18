/**
 * Test Data Factories
 *
 * These factories create test data for use in tests and demos
 */

import { PrismaClient, RetreatStatus, SessionType, LogisticsItemType, RoomType, ParticipantRole, RegistrationStatus } from "@prisma/client";

export class TestDataFactory {
  constructor(private prisma: PrismaClient) {}

  async createCommunity(override: Partial<any> = {}) {
    return this.prisma.community.create({
      data: {
        name: override.name || "Test Community",
        description: override.description || "A test community for retreats",
        slug: override.slug || `test-community-${Date.now()}`,
        settings: override.settings || {},
        ...override,
      },
    });
  }

  async createBlueprint(override: Partial<any> = {}) {
    return this.prisma.retreatBlueprint.create({
      data: {
        name: override.name || "Test Retreat",
        descriptionMarkdown: override.descriptionMarkdown || "A test retreat blueprint",
        daysCount: override.daysCount || 3,
        participantCountEstimate: override.participantCountEstimate || 20,
        actualParticipantCount: override.actualParticipantCount,
        locationConstraintsJson: override.locationConstraintsJson || {},
        status: override.status || "draft",
        tags: override.tags || [],
        maxCapacity: override.maxCapacity || 25,
        communityId: override.communityId,
        templateId: override.templateId,
        ...override,
      },
    });
  }

  async createDayPlan(blueprintId: string, override: Partial<any> = {}) {
    return this.prisma.retreatDayPlan.create({
      data: {
        blueprintId,
        dayIndex: override.dayIndex ?? 0,
        theme: override.theme || "Test Theme",
        notesMarkdown: override.notesMarkdown,
        ...override,
      },
    });
  }

  async createSession(dayPlanId: string, override: Partial<any> = {}) {
    return this.prisma.retreatSession.create({
      data: {
        dayPlanId,
        title: override.title || "Test Session",
        sessionType: override.sessionType || "circle",
        startTimeLocal: override.startTimeLocal || "10:00",
        endTimeLocal: override.endTimeLocal || "11:00",
        facilitatorName: override.facilitatorName,
        capacity: override.capacity,
        location: override.location,
        metaJson: override.metaJson || {},
        ...override,
      },
    });
  }

  async createLogisticsItem(blueprintId: string, override: Partial<any> = {}) {
    return this.prisma.logisticsItem.create({
      data: {
        blueprintId,
        itemType: override.itemType || "other",
        descriptionMarkdown: override.descriptionMarkdown || "Test logistics item",
        costEstimate: override.costEstimate,
        metaJson: override.metaJson || {},
        ...override,
      },
    });
  }

  async createTemplate(override: Partial<any> = {}) {
    return this.prisma.retreatTemplate.create({
      data: {
        name: override.name || "Test Template",
        descriptionMarkdown: override.descriptionMarkdown,
        daysCount: override.daysCount || 2,
        suggestedCapacity: override.suggestedCapacity || 15,
        tags: override.tags || [],
        isPublic: override.isPublic ?? false,
        usageCount: override.usageCount || 0,
        templateData: override.templateData || {},
        communityId: override.communityId,
        ...override,
      },
    });
  }

  async createParticipant(override: Partial<any> = {}) {
    const email = override.email || `test${Date.now()}@example.com`;
    return this.prisma.participant.create({
      data: {
        email,
        name: override.name || "Test Participant",
        phoneNumber: override.phoneNumber,
        bio: override.bio,
        preferences: override.preferences || {},
        tags: override.tags || [],
        role: override.role || "participant",
        communityId: override.communityId,
        ...override,
      },
    });
  }

  async createRegistration(blueprintId: string, participantId: string, override: Partial<any> = {}) {
    return this.prisma.registration.create({
      data: {
        blueprintId,
        participantId,
        status: override.status || "pending",
        registeredAt: override.registeredAt || new Date(),
        approvedAt: override.approvedAt,
        notes: override.notes,
        paymentStatus: override.paymentStatus,
        metaJson: override.metaJson || {},
        ...override,
      },
    });
  }

  async createRoom(blueprintId: string, override: Partial<any> = {}) {
    return this.prisma.room.create({
      data: {
        blueprintId,
        name: override.name || "Test Room",
        roomType: override.roomType || "double",
        capacity: override.capacity || 2,
        floor: override.floor,
        amenities: override.amenities || [],
        metaJson: override.metaJson || {},
        ...override,
      },
    });
  }

  async createRoomAssignment(roomId: string, participantId: string, override: Partial<any> = {}) {
    return this.prisma.roomAssignment.create({
      data: {
        roomId,
        participantId,
        bedNumber: override.bedNumber,
        preferences: override.preferences || {},
        assignedBy: override.assignedBy,
        ...override,
      },
    });
  }

  async createFeedbackForm(blueprintId: string, override: Partial<any> = {}) {
    return this.prisma.feedbackForm.create({
      data: {
        blueprintId,
        title: override.title || "Test Feedback Form",
        descriptionMarkdown: override.descriptionMarkdown,
        questions: override.questions || [],
        isActive: override.isActive ?? true,
        openAt: override.openAt,
        closeAt: override.closeAt,
        ...override,
      },
    });
  }

  async createFeedbackResponse(formId: string, participantId: string, override: Partial<any> = {}) {
    return this.prisma.feedbackResponse.create({
      data: {
        formId,
        participantId,
        answers: override.answers || {},
        submittedAt: override.submittedAt || new Date(),
        ...override,
      },
    });
  }

  // Complex factories that create related data

  async createCompleteBlueprint(override: Partial<any> = {}) {
    const blueprint = await this.createBlueprint(override);

    // Create day plans
    for (let i = 0; i < blueprint.daysCount; i++) {
      const dayPlan = await this.createDayPlan(blueprint.id, {
        dayIndex: i,
        theme: `Day ${i + 1}`,
      });

      // Create sessions for each day
      await this.createSession(dayPlan.id, {
        title: "Morning Circle",
        sessionType: "circle",
        startTimeLocal: "09:00",
        endTimeLocal: "10:00",
      });

      await this.createSession(dayPlan.id, {
        title: "Lunch",
        sessionType: "meal",
        startTimeLocal: "12:00",
        endTimeLocal: "13:00",
      });
    }

    // Create logistics items
    await this.createLogisticsItem(blueprint.id, {
      itemType: "accommodation",
      descriptionMarkdown: "Test accommodation",
      costEstimate: 100,
    });

    return this.prisma.retreatBlueprint.findUnique({
      where: { id: blueprint.id },
      include: {
        dayPlans: {
          include: {
            sessions: true,
          },
        },
        logisticsItems: true,
      },
    });
  }

  async clearAllData() {
    // Delete in order to respect foreign key constraints
    await this.prisma.feedbackResponse.deleteMany();
    await this.prisma.feedbackForm.deleteMany();
    await this.prisma.roomAssignment.deleteMany();
    await this.prisma.room.deleteMany();
    await this.prisma.registration.deleteMany();
    await this.prisma.participant.deleteMany();
    await this.prisma.logisticsItem.deleteMany();
    await this.prisma.retreatSession.deleteMany();
    await this.prisma.retreatDayPlan.deleteMany();
    await this.prisma.retreatBlueprint.deleteMany();
    await this.prisma.retreatTemplate.deleteMany();
    await this.prisma.community.deleteMany();
  }
}
