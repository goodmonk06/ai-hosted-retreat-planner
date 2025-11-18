import { prisma } from "../prisma";
import { logger } from "../logger";
import { metrics } from "../metrics";
import { eventEmitter } from "../events/emitter";
import { NotFoundError, ConflictError } from "../errors";
import { getNotificationAdapter } from "../adapters/notification";
import { RegistrationStatus, ParticipantRole } from "@prisma/client";

export interface CreateParticipantInput {
  communityId?: string;
  email: string;
  name: string;
  phoneNumber?: string;
  bio?: string;
  preferences?: Record<string, any>;
  tags?: string[];
  role?: ParticipantRole;
}

export interface RegisterParticipantInput {
  blueprintId: string;
  participantId?: string; // If existing participant
  participantData?: CreateParticipantInput; // If new participant
  notes?: string;
  metaJson?: Record<string, any>;
}

export class ParticipantService {
  async createParticipant(input: CreateParticipantInput) {
    logger.info("Creating participant", { email: input.email });

    // Check for existing participant
    const existing = await prisma.participant.findUnique({
      where: {
        communityId_email: {
          communityId: input.communityId || "",
          email: input.email,
        },
      },
    });

    if (existing) {
      throw new ConflictError("Participant with this email already exists in this community");
    }

    const participant = await prisma.participant.create({
      data: {
        email: input.email,
        name: input.name,
        phoneNumber: input.phoneNumber,
        bio: input.bio,
        preferences: input.preferences || {},
        tags: input.tags || [],
        role: input.role || "participant",
        communityId: input.communityId,
      },
    });

    metrics.recordCounter("participants.created", 1);
    logger.info("Participant created", { participantId: participant.id });

    return participant;
  }

  async getParticipant(id: string) {
    const participant = await prisma.participant.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            blueprint: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
              },
            },
          },
        },
        roomAssignments: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundError("Participant not found");
    }

    return participant;
  }

  async listParticipants(filters?: { communityId?: string; role?: ParticipantRole; tags?: string[] }) {
    const where: any = {};

    if (filters?.communityId) {
      where.communityId = filters.communityId;
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    return prisma.participant.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async registerForRetreat(input: RegisterParticipantInput) {
    logger.info("Registering participant for retreat", {
      blueprintId: input.blueprintId,
      participantId: input.participantId,
    });

    // Get or create participant
    let participantId = input.participantId;

    if (!participantId && input.participantData) {
      const newParticipant = await this.createParticipant(input.participantData);
      participantId = newParticipant.id;
    }

    if (!participantId) {
      throw new Error("Participant ID or participant data is required");
    }

    // Check if already registered
    const existing = await prisma.registration.findUnique({
      where: {
        blueprintId_participantId: {
          blueprintId: input.blueprintId,
          participantId,
        },
      },
    });

    if (existing) {
      throw new ConflictError("Participant is already registered for this retreat");
    }

    // Check capacity
    const blueprint = await prisma.retreatBlueprint.findUnique({
      where: { id: input.blueprintId },
      include: {
        registrations: {
          where: {
            status: {
              in: ["approved", "pending"],
            },
          },
        },
      },
    });

    if (!blueprint) {
      throw new NotFoundError("Blueprint not found");
    }

    // Determine initial status based on capacity
    let status: RegistrationStatus = "pending";
    if (blueprint.maxCapacity) {
      const currentCount = blueprint.registrations.length;
      if (currentCount >= blueprint.maxCapacity) {
        status = "waitlisted";
      }
    }

    const registration = await prisma.registration.create({
      data: {
        blueprintId: input.blueprintId,
        participantId,
        status,
        notes: input.notes,
        metaJson: input.metaJson || {},
      },
      include: {
        participant: true,
        blueprint: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    metrics.recordCounter("registrations.created", 1, { status });

    await eventEmitter.emit({
      type: "participant.registered",
      timestamp: new Date(),
      data: {
        registrationId: registration.id,
        blueprintId: input.blueprintId,
        participantId,
        participantEmail: registration.participant.email,
      },
    });

    // Send notification
    const notificationAdapter = getNotificationAdapter();
    await notificationAdapter.sendEmail({
      to: registration.participant.email,
      subject: `Registration ${status} for ${registration.blueprint.name}`,
      body: `Thank you for registering for ${registration.blueprint.name}. Your registration status is: ${status}.`,
      metadata: {
        registrationId: registration.id,
        blueprintId: input.blueprintId,
      },
    });

    logger.info("Participant registered", {
      registrationId: registration.id,
      status,
    });

    return registration;
  }

  async approveRegistration(registrationId: string) {
    logger.info("Approving registration", { registrationId });

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        participant: true,
        blueprint: true,
      },
    });

    if (!registration) {
      throw new NotFoundError("Registration not found");
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: "approved",
        approvedAt: new Date(),
      },
      include: {
        participant: true,
        blueprint: true,
      },
    });

    metrics.recordCounter("registrations.approved", 1);

    await eventEmitter.emit({
      type: "registration.approved",
      timestamp: new Date(),
      data: {
        registrationId: updated.id,
        blueprintId: updated.blueprintId,
        participantId: updated.participantId,
      },
    });

    // Send notification
    const notificationAdapter = getNotificationAdapter();
    await notificationAdapter.sendEmail({
      to: updated.participant.email,
      subject: `Registration approved for ${updated.blueprint.name}`,
      body: `Great news! Your registration for ${updated.blueprint.name} has been approved.`,
      metadata: {
        registrationId: updated.id,
      },
    });

    logger.info("Registration approved", { registrationId });

    return updated;
  }

  async cancelRegistration(registrationId: string, reason?: string) {
    logger.info("Cancelling registration", { registrationId, reason });

    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: "cancelled",
        notes: reason ? `Cancelled: ${reason}` : "Cancelled",
      },
      include: {
        participant: true,
        blueprint: true,
      },
    });

    metrics.recordCounter("registrations.cancelled", 1);

    logger.info("Registration cancelled", { registrationId });

    return registration;
  }

  async getRetreatParticipants(blueprintId: string, status?: RegistrationStatus) {
    const where: any = {
      blueprintId,
    };

    if (status) {
      where.status = status;
    }

    return prisma.registration.findMany({
      where,
      include: {
        participant: true,
      },
      orderBy: {
        registeredAt: "asc",
      },
    });
  }
}

export const participantService = new ParticipantService();
