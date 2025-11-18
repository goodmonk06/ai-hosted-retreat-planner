import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.logisticsItem.deleteMany();
  await prisma.retreatSession.deleteMany();
  await prisma.retreatDayPlan.deleteMany();
  await prisma.retreatBlueprint.deleteMany();

  // Create a 3-day inner work retreat blueprint
  const blueprint = await prisma.retreatBlueprint.create({
    data: {
      name: "Deep Inner Work Retreat 2025",
      descriptionMarkdown: `# Deep Inner Work Retreat

A transformative 3-day journey into self-discovery and personal growth.

## Goals
- Cultivate mindfulness and presence
- Explore personal values and purpose
- Build authentic connections with others
- Integrate practices for ongoing growth

## Setting
Mountain retreat center with meditation halls, forest trails, and shared gathering spaces.`,
      daysCount: 3,
      participantCountEstimate: 24,
      locationConstraintsJson: {
        type: "mountain",
        preferences: ["quiet", "nature-access", "meditation-space"],
        accessibility: "moderate-hiking",
      },
      dayPlans: {
        create: [
          {
            dayIndex: 0,
            theme: "Arrival & Opening",
            notesMarkdown: "Focus on settling in and creating container for the work ahead",
            sessions: {
              create: [
                {
                  title: "Arrival & Check-in",
                  sessionType: "free",
                  startTimeLocal: "14:00",
                  endTimeLocal: "16:00",
                },
                {
                  title: "Opening Circle",
                  sessionType: "circle",
                  startTimeLocal: "16:30",
                  endTimeLocal: "18:00",
                  facilitatorName: "Sarah Chen",
                  metaJson: {
                    capacity: 24,
                    format: "circle",
                    materials: ["cushions", "journal"],
                  },
                },
                {
                  title: "Welcome Dinner",
                  sessionType: "meal",
                  startTimeLocal: "18:30",
                  endTimeLocal: "20:00",
                },
                {
                  title: "Evening Reflection",
                  sessionType: "ritual",
                  startTimeLocal: "20:30",
                  endTimeLocal: "21:30",
                  facilitatorName: "Sarah Chen",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            theme: "Inner Exploration",
            notesMarkdown: "Deep dive into personal inquiry and shadow work",
            sessions: {
              create: [
                {
                  title: "Morning Meditation",
                  sessionType: "ritual",
                  startTimeLocal: "07:00",
                  endTimeLocal: "08:00",
                  facilitatorName: "James Kim",
                },
                {
                  title: "Breakfast",
                  sessionType: "meal",
                  startTimeLocal: "08:15",
                  endTimeLocal: "09:15",
                },
                {
                  title: "Teaching: The Inner Landscape",
                  sessionType: "talk",
                  startTimeLocal: "09:30",
                  endTimeLocal: "11:00",
                  facilitatorName: "Sarah Chen",
                  metaJson: {
                    topics: ["inner-critic", "self-compassion", "shadow-work"],
                  },
                },
                {
                  title: "Tea Break",
                  sessionType: "break",
                  startTimeLocal: "11:00",
                  endTimeLocal: "11:30",
                },
                {
                  title: "Small Group Inquiry",
                  sessionType: "circle",
                  startTimeLocal: "11:30",
                  endTimeLocal: "13:00",
                  facilitatorName: "Various",
                  metaJson: {
                    format: "groups-of-6",
                  },
                },
                {
                  title: "Lunch",
                  sessionType: "meal",
                  startTimeLocal: "13:00",
                  endTimeLocal: "14:00",
                },
                {
                  title: "Free Time / Nature Walk",
                  sessionType: "free",
                  startTimeLocal: "14:00",
                  endTimeLocal: "16:00",
                  metaJson: {
                    options: ["rest", "journaling", "hiking"],
                  },
                },
                {
                  title: "Somatic Practice",
                  sessionType: "ritual",
                  startTimeLocal: "16:00",
                  endTimeLocal: "17:30",
                  facilitatorName: "Maya Rodriguez",
                },
                {
                  title: "Dinner",
                  sessionType: "meal",
                  startTimeLocal: "18:00",
                  endTimeLocal: "19:00",
                },
                {
                  title: "Fire Circle & Sharing",
                  sessionType: "circle",
                  startTimeLocal: "20:00",
                  endTimeLocal: "22:00",
                  facilitatorName: "Sarah Chen",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            theme: "Integration & Commitment",
            notesMarkdown: "Bringing insights into actionable commitments",
            sessions: {
              create: [
                {
                  title: "Morning Meditation",
                  sessionType: "ritual",
                  startTimeLocal: "07:00",
                  endTimeLocal: "08:00",
                  facilitatorName: "James Kim",
                },
                {
                  title: "Breakfast",
                  sessionType: "meal",
                  startTimeLocal: "08:15",
                  endTimeLocal: "09:15",
                },
                {
                  title: "Teaching: Living Your Truth",
                  sessionType: "talk",
                  startTimeLocal: "09:30",
                  endTimeLocal: "10:30",
                  facilitatorName: "Sarah Chen",
                },
                {
                  title: "Personal Integration Work",
                  sessionType: "free",
                  startTimeLocal: "10:45",
                  endTimeLocal: "12:00",
                  metaJson: {
                    format: "solo-reflection",
                  },
                },
                {
                  title: "Lunch",
                  sessionType: "meal",
                  startTimeLocal: "12:00",
                  endTimeLocal: "13:00",
                },
                {
                  title: "Closing Circle & Commitments",
                  sessionType: "circle",
                  startTimeLocal: "13:30",
                  endTimeLocal: "15:30",
                  facilitatorName: "Sarah Chen",
                },
                {
                  title: "Departure",
                  sessionType: "free",
                  startTimeLocal: "16:00",
                  endTimeLocal: "17:00",
                },
              ],
            },
          },
        ],
      },
      logisticsItems: {
        create: [
          {
            itemType: "accommodation",
            descriptionMarkdown: "**Mountain Retreat Center** - Shared rooms (2-3 per room) with shared bathrooms. All linens provided.",
            costEstimate: 150.0,
            metaJson: {
              rooms: 10,
              capacity: 30,
              amenities: ["wifi", "heating", "hot-water"],
            },
          },
          {
            itemType: "transport",
            descriptionMarkdown: "**Shuttle service** from city center to retreat location. Departs Friday 12pm, returns Sunday 6pm.",
            costEstimate: 40.0,
            metaJson: {
              provider: "Mountain Transit Co",
              capacity: 30,
            },
          },
          {
            itemType: "meal",
            descriptionMarkdown: "**All meals included** - Vegetarian/vegan options. Dietary restrictions accommodated with advance notice.",
            costEstimate: 180.0,
            metaJson: {
              mealsCount: 8,
              dietary: ["vegetarian", "vegan", "gluten-free"],
            },
          },
          {
            itemType: "materials",
            descriptionMarkdown: "**Practice materials** - Meditation cushions, journals, pens, blankets for outdoor sessions",
            costEstimate: 15.0,
          },
          {
            itemType: "other",
            descriptionMarkdown: "**Insurance & contingency** - Event insurance and emergency fund",
            costEstimate: 50.0,
          },
        ],
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

  console.log(`✅ Created blueprint: ${blueprint.name}`);
  console.log(`   - ${blueprint.dayPlans.length} days`);
  console.log(
    `   - ${blueprint.dayPlans.reduce((sum, day) => sum + day.sessions.length, 0)} sessions`
  );
  console.log(`   - ${blueprint.logisticsItems.length} logistics items`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
