#!/usr/bin/env tsx
/**
 * CLI Tool for AI Retreat Planner
 *
 * Provides utilities for development and operations
 */

import { PrismaClient } from "@prisma/client";
import { program } from "commander";

const prisma = new PrismaClient();

program
  .name("retreat-cli")
  .description("CLI tools for AI Retreat Planner")
  .version("1.0.0");

// Clear all data
program
  .command("clear")
  .description("Clear all data from the database")
  .action(async () => {
    console.log("🗑️  Clearing all data...");

    await prisma.feedbackResponse.deleteMany();
    await prisma.feedbackForm.deleteMany();
    await prisma.roomAssignment.deleteMany();
    await prisma.room.deleteMany();
    await prisma.registration.deleteMany();
    await prisma.participant.deleteMany();
    await prisma.logisticsItem.deleteMany();
    await prisma.retreatSession.deleteMany();
    await prisma.retreatDayPlan.deleteMany();
    await prisma.retreatBlueprint.deleteMany();
    await prisma.retreatTemplate.deleteMany();
    await prisma.community.deleteMany();

    console.log("✅ All data cleared!");
    await prisma.$disconnect();
  });

// List communities
program
  .command("list:communities")
  .description("List all communities")
  .action(async () => {
    const communities = await prisma.community.findMany({
      include: {
        _count: {
          select: {
            blueprints: true,
            templates: true,
            participants: true,
          },
        },
      },
    });

    console.log("\n📋 Communities:\n");
    communities.forEach((c) => {
      console.log(`  ${c.name} (${c.slug})`);
      console.log(`    Blueprints: ${c._count.blueprints}`);
      console.log(`    Templates: ${c._count.templates}`);
      console.log(`    Participants: ${c._count.participants}`);
      console.log("");
    });

    await prisma.$disconnect();
  });

// List blueprints
program
  .command("list:blueprints")
  .description("List all retreat blueprints")
  .option("-s, --status <status>", "Filter by status")
  .action(async (options) => {
    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }

    const blueprints = await prisma.retreatBlueprint.findMany({
      where,
      include: {
        community: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            dayPlans: true,
            registrations: true,
          },
        },
      },
    });

    console.log("\n📋 Retreat Blueprints:\n");
    blueprints.forEach((b) => {
      console.log(`  ${b.name} (${b.status})`);
      console.log(`    Community: ${b.community?.name || "None"}`);
      console.log(`    Days: ${b.daysCount}`);
      console.log(`    Capacity: ${b.participantCountEstimate}`);
      console.log(`    Registrations: ${b._count.registrations}`);
      console.log("");
    });

    await prisma.$disconnect();
  });

// Show retreat details
program
  .command("show:retreat <id>")
  .description("Show detailed information about a retreat")
  .action(async (id) => {
    const blueprint = await prisma.retreatBlueprint.findUnique({
      where: { id },
      include: {
        community: true,
        template: true,
        dayPlans: {
          include: {
            sessions: true,
          },
          orderBy: {
            dayIndex: "asc",
          },
        },
        registrations: {
          include: {
            participant: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        rooms: {
          include: {
            _count: {
              select: {
                assignments: true,
              },
            },
          },
        },
        logisticsItems: true,
      },
    });

    if (!blueprint) {
      console.error("❌ Blueprint not found");
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log("\n📄 Retreat Details:\n");
    console.log(`Name: ${blueprint.name}`);
    console.log(`Status: ${blueprint.status}`);
    console.log(`Community: ${blueprint.community?.name || "None"}`);
    console.log(`Duration: ${blueprint.daysCount} days`);
    console.log(`Capacity: ${blueprint.participantCountEstimate}`);
    console.log(`\nSchedule: ${blueprint.dayPlans.length} days planned`);
    blueprint.dayPlans.forEach((day) => {
      console.log(`  Day ${day.dayIndex + 1}: ${day.theme || "No theme"}`);
      console.log(`    Sessions: ${day.sessions.length}`);
    });
    console.log(`\nRegistrations: ${blueprint.registrations.length}`);
    blueprint.registrations.forEach((reg) => {
      console.log(
        `  ${reg.participant.name} (${reg.participant.email}) - ${reg.status}`
      );
    });
    console.log(`\nRooms: ${blueprint.rooms.length}`);
    blueprint.rooms.forEach((room) => {
      console.log(
        `  ${room.name} - ${room._count.assignments}/${room.capacity} occupied`
      );
    });
    console.log(`\nLogistics: ${blueprint.logisticsItems.length} items`);

    await prisma.$disconnect();
  });

// Health check
program
  .command("health")
  .description("Run health checks")
  .action(async () => {
    console.log("\n🏥 Running health checks...\n");

    try {
      // Database connection
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Database connection: OK");

      // Count records
      const counts = {
        communities: await prisma.community.count(),
        blueprints: await prisma.retreatBlueprint.count(),
        templates: await prisma.retreatTemplate.count(),
        participants: await prisma.participant.count(),
      };

      console.log("\n📊 Database Statistics:");
      console.log(`  Communities: ${counts.communities}`);
      console.log(`  Blueprints: ${counts.blueprints}`);
      console.log(`  Templates: ${counts.templates}`);
      console.log(`  Participants: ${counts.participants}`);

      // Check for orphaned records
      const orphanedDayPlans = await prisma.retreatDayPlan.count({
        where: {
          blueprint: null,
        },
      });

      if (orphanedDayPlans > 0) {
        console.log(`\n⚠️  Warning: ${orphanedDayPlans} orphaned day plans`);
      }

      console.log("\n✅ Health check complete!");
    } catch (error) {
      console.error("\n❌ Health check failed:", error);
    }

    await prisma.$disconnect();
  });

// Export data
program
  .command("export:blueprint <id>")
  .description("Export a blueprint to JSON")
  .action(async (id) => {
    const blueprint = await prisma.retreatBlueprint.findUnique({
      where: { id },
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
      console.error("❌ Blueprint not found");
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(JSON.stringify(blueprint, null, 2));

    await prisma.$disconnect();
  });

program.parse();
