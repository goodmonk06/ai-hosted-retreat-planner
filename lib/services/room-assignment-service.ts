import { prisma } from "../prisma";
import { logger } from "../logger";
import { metrics } from "../metrics";
import { eventEmitter } from "../events/emitter";
import { NotFoundError, ConflictError, ValidationError } from "../errors";
import { RoomType } from "@prisma/client";

export interface CreateRoomInput {
  blueprintId: string;
  name: string;
  roomType: RoomType;
  capacity: number;
  floor?: string;
  amenities?: string[];
  metaJson?: Record<string, any>;
}

export interface AssignRoomInput {
  roomId: string;
  participantId: string;
  bedNumber?: number;
  preferences?: Record<string, any>;
  assignedBy?: string;
}

export interface AutoAssignOptions {
  blueprintId: string;
  prioritizePreferences?: boolean;
  groupByTags?: boolean;
}

export class RoomAssignmentService {
  async createRoom(input: CreateRoomInput) {
    logger.info("Creating room", {
      name: input.name,
      blueprintId: input.blueprintId,
    });

    const room = await prisma.room.create({
      data: {
        blueprintId: input.blueprintId,
        name: input.name,
        roomType: input.roomType,
        capacity: input.capacity,
        floor: input.floor,
        amenities: input.amenities || [],
        metaJson: input.metaJson || {},
      },
    });

    metrics.recordCounter("rooms.created", 1);
    logger.info("Room created", { roomId: room.id });

    return room;
  }

  async listRooms(blueprintId: string) {
    return prisma.room.findMany({
      where: { blueprintId },
      include: {
        assignments: {
          include: {
            participant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ floor: "asc" }, { name: "asc" }],
    });
  }

  async getRoom(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            participant: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError("Room not found");
    }

    return room;
  }

  async assignParticipantToRoom(input: AssignRoomInput) {
    logger.info("Assigning participant to room", {
      roomId: input.roomId,
      participantId: input.participantId,
    });

    // Check if room exists and has capacity
    const room = await this.getRoom(input.roomId);

    if (room.assignments.length >= room.capacity) {
      throw new ValidationError("Room is at full capacity");
    }

    // Check if participant is already assigned to a room in this blueprint
    const existingAssignment = await prisma.roomAssignment.findFirst({
      where: {
        participantId: input.participantId,
        room: {
          blueprintId: room.blueprintId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictError("Participant is already assigned to a room in this retreat");
    }

    const assignment = await prisma.roomAssignment.create({
      data: {
        roomId: input.roomId,
        participantId: input.participantId,
        bedNumber: input.bedNumber,
        preferences: input.preferences || {},
        assignedBy: input.assignedBy,
      },
      include: {
        room: true,
        participant: true,
      },
    });

    metrics.recordCounter("room_assignments.created", 1);

    await eventEmitter.emit({
      type: "room.assigned",
      timestamp: new Date(),
      data: {
        assignmentId: assignment.id,
        roomId: input.roomId,
        participantId: input.participantId,
        blueprintId: room.blueprintId,
      },
    });

    logger.info("Participant assigned to room", {
      assignmentId: assignment.id,
      roomId: input.roomId,
      participantId: input.participantId,
    });

    return assignment;
  }

  async unassignParticipant(assignmentId: string) {
    logger.info("Unassigning participant from room", { assignmentId });

    const assignment = await prisma.roomAssignment.delete({
      where: { id: assignmentId },
    });

    metrics.recordCounter("room_assignments.deleted", 1);
    logger.info("Participant unassigned from room", { assignmentId });

    return assignment;
  }

  async autoAssignRooms(options: AutoAssignOptions) {
    logger.info("Auto-assigning rooms", { blueprintId: options.blueprintId });

    // Get all approved participants without room assignments
    const registrations = await prisma.registration.findMany({
      where: {
        blueprintId: options.blueprintId,
        status: "approved",
        participant: {
          roomAssignments: {
            none: {
              room: {
                blueprintId: options.blueprintId,
              },
            },
          },
        },
      },
      include: {
        participant: true,
      },
    });

    // Get all available rooms
    const rooms = await this.listRooms(options.blueprintId);

    const assignments: any[] = [];
    let participantIndex = 0;

    // Simple algorithm: Fill rooms sequentially
    // In a real implementation, this would be much more sophisticated
    for (const room of rooms) {
      const availableCapacity = room.capacity - room.assignments.length;

      for (let i = 0; i < availableCapacity && participantIndex < registrations.length; i++) {
        const registration = registrations[participantIndex];

        try {
          const assignment = await this.assignParticipantToRoom({
            roomId: room.id,
            participantId: registration.participantId,
            assignedBy: "auto-assign",
          });

          assignments.push(assignment);
          participantIndex++;
        } catch (error) {
          logger.error("Error auto-assigning participant", error, {
            roomId: room.id,
            participantId: registration.participantId,
          });
        }
      }

      if (participantIndex >= registrations.length) {
        break;
      }
    }

    metrics.recordCounter("room_assignments.auto_assigned", assignments.length);

    logger.info("Auto-assignment complete", {
      blueprintId: options.blueprintId,
      assignedCount: assignments.length,
      totalParticipants: registrations.length,
    });

    return {
      assigned: assignments.length,
      total: registrations.length,
      unassigned: registrations.length - assignments.length,
      assignments,
    };
  }

  async getRoomUtilization(blueprintId: string) {
    const rooms = await this.listRooms(blueprintId);

    const utilization = rooms.map((room) => ({
      roomId: room.id,
      name: room.name,
      capacity: room.capacity,
      occupied: room.assignments.length,
      available: room.capacity - room.assignments.length,
      utilizationPercentage: (room.assignments.length / room.capacity) * 100,
    }));

    const totals = utilization.reduce(
      (acc, room) => ({
        totalCapacity: acc.totalCapacity + room.capacity,
        totalOccupied: acc.totalOccupied + room.occupied,
        totalAvailable: acc.totalAvailable + room.available,
      }),
      { totalCapacity: 0, totalOccupied: 0, totalAvailable: 0 }
    );

    return {
      rooms: utilization,
      summary: {
        ...totals,
        overallUtilizationPercentage:
          totals.totalCapacity > 0 ? (totals.totalOccupied / totals.totalCapacity) * 100 : 0,
      },
    };
  }
}

export const roomAssignmentService = new RoomAssignmentService();
