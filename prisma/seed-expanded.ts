import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with comprehensive demo data...");

  // Clean existing data (in correct order for foreign keys)
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

  // ===== COMMUNITIES =====
  console.log("Creating communities...");

  const mindfulCommunity = await prisma.community.create({
    data: {
      name: "Mindful Living Collective",
      description:
        "A global community focused on contemplative practices, inner work, and conscious living.",
      slug: "mindful-living",
      settings: {
        timezone: "America/Los_Angeles",
        defaultCapacity: 24,
        notificationPreferences: {
          email: true,
          sms: false,
        },
      },
    },
  });

  const ecoVillage = await prisma.community.create({
    data: {
      name: "Eco Village Network",
      description:
        "Sustainable living communities exploring regenerative practices and permaculture.",
      slug: "eco-village",
      settings: {
        timezone: "Europe/Berlin",
        defaultCapacity: 40,
        focus: "sustainability",
      },
    },
  });

  console.log(`✓ Created ${2} communities`);

  // ===== TEMPLATES =====
  console.log("Creating retreat templates...");

  const innerWorkTemplate = await prisma.retreatTemplate.create({
    data: {
      name: "3-Day Inner Work Intensive",
      descriptionMarkdown:
        "A proven template for deep personal exploration and transformation.",
      daysCount: 3,
      suggestedCapacity: 24,
      tags: ["inner-work", "meditation", "personal-growth"],
      isPublic: true,
      communityId: mindfulCommunity.id,
      templateData: {
        descriptionMarkdown: `# Inner Work Intensive

A transformative journey into self-discovery.`,
        dayPlans: [
          {
            dayIndex: 0,
            theme: "Arrival & Opening",
            sessions: [
              {
                title: "Opening Circle",
                sessionType: "circle",
                startTimeLocal: "16:00",
                endTimeLocal: "18:00",
              },
              {
                title: "Welcome Dinner",
                sessionType: "meal",
                startTimeLocal: "18:30",
                endTimeLocal: "20:00",
              },
            ],
          },
          {
            dayIndex: 1,
            theme: "Deep Exploration",
            sessions: [
              {
                title: "Morning Meditation",
                sessionType: "ritual",
                startTimeLocal: "07:00",
                endTimeLocal: "08:00",
              },
              {
                title: "Breakfast",
                sessionType: "meal",
                startTimeLocal: "08:15",
                endTimeLocal: "09:15",
              },
              {
                title: "Teaching Session",
                sessionType: "talk",
                startTimeLocal: "09:30",
                endTimeLocal: "11:00",
              },
            ],
          },
          {
            dayIndex: 2,
            theme: "Integration & Closing",
            sessions: [
              {
                title: "Closing Circle",
                sessionType: "circle",
                startTimeLocal: "14:00",
                endTimeLocal: "16:00",
              },
            ],
          },
        ],
        logisticsItems: [
          {
            itemType: "accommodation",
            descriptionMarkdown: "Shared rooms in retreat center",
            costEstimate: 150,
          },
          {
            itemType: "meal",
            descriptionMarkdown: "All vegetarian meals included",
            costEstimate: 90,
          },
        ],
      },
    },
  });

  const permacultureTemplate = await prisma.retreatTemplate.create({
    data: {
      name: "5-Day Permaculture Intensive",
      descriptionMarkdown:
        "Hands-on learning in regenerative agriculture and design.",
      daysCount: 5,
      suggestedCapacity: 30,
      tags: ["permaculture", "sustainability", "hands-on"],
      isPublic: true,
      communityId: ecoVillage.id,
      templateData: {
        dayPlans: Array.from({ length: 5 }, (_, i) => ({
          dayIndex: i,
          theme: `Day ${i + 1} - Permaculture Principles`,
          sessions: [
            {
              title: "Morning Workshop",
              sessionType: "talk",
              startTimeLocal: "09:00",
              endTimeLocal: "12:00",
            },
            {
              title: "Hands-on Practice",
              sessionType: "free",
              startTimeLocal: "14:00",
              endTimeLocal: "17:00",
            },
          ],
        })),
      },
    },
  });

  console.log(`✓ Created ${2} templates`);

  // ===== PARTICIPANTS =====
  console.log("Creating participants...");

  const participants = await Promise.all([
    prisma.participant.create({
      data: {
        communityId: mindfulCommunity.id,
        email: "alice@example.com",
        name: "Alice Chen",
        phoneNumber: "+1-555-0101",
        bio: "Meditation practitioner interested in deepening my practice.",
        preferences: {
          dietary: ["vegetarian"],
          accessibility: ["none"],
          roommate: "open to anyone",
        },
        tags: ["experienced-meditator"],
        role: "participant",
      },
    }),
    prisma.participant.create({
      data: {
        communityId: mindfulCommunity.id,
        email: "bob@example.com",
        name: "Bob Rodriguez",
        phoneNumber: "+1-555-0102",
        bio: "New to meditation, excited to learn!",
        preferences: {
          dietary: ["gluten-free"],
        },
        tags: ["beginner"],
        role: "participant",
      },
    }),
    prisma.participant.create({
      data: {
        communityId: mindfulCommunity.id,
        email: "carol@example.com",
        name: "Carol Kim",
        bio: "Certified facilitator with 10 years of experience leading retreats.",
        preferences: {
          dietary: ["vegan"],
        },
        tags: ["facilitator", "experienced"],
        role: "facilitator",
      },
    }),
    prisma.participant.create({
      data: {
        communityId: ecoVillage.id,
        email: "david@example.com",
        name: "David Osei",
        phoneNumber: "+49-555-0201",
        bio: "Permaculture designer and educator.",
        preferences: {
          dietary: ["omnivore"],
        },
        tags: ["permaculture-expert"],
        role: "facilitator",
      },
    }),
    prisma.participant.create({
      data: {
        communityId: ecoVillage.id,
        email: "emma@example.com",
        name: "Emma Larsson",
        bio: "Interested in sustainable living and regenerative agriculture.",
        preferences: {
          dietary: ["vegetarian"],
          accessibility: ["wheelchair"],
        },
        tags: ["sustainability-enthusiast"],
        role: "participant",
      },
    }),
  ]);

  console.log(`✓ Created ${participants.length} participants`);

  // ===== BLUEPRINTS =====
  console.log("Creating retreat blueprints...");

  const springRetreat = await prisma.retreatBlueprint.create({
    data: {
      communityId: mindfulCommunity.id,
      templateId: innerWorkTemplate.id,
      name: "Spring Inner Work Retreat 2025",
      descriptionMarkdown: `# Spring Inner Work Retreat

A transformative 3-day journey into self-discovery and personal growth in the beautiful spring season.

## Dates
April 15-17, 2025

## Location
Mountain Retreat Center, California

## What to Expect
- Daily meditation practices
- Deep inquiry sessions
- Silent contemplation time
- Nature walks
- Nourishing meals
- Community circles`,
      daysCount: 3,
      participantCountEstimate: 20,
      maxCapacity: 24,
      status: "planned",
      tags: ["spring", "inner-work", "meditation"],
      startDate: new Date("2025-04-15T14:00:00Z"),
      endDate: new Date("2025-04-17T16:00:00Z"),
      locationConstraintsJson: {
        type: "mountain",
        name: "Mountain Retreat Center",
        address: "123 Mountain Road, CA 95000",
        amenities: ["meditation-hall", "forest-trails", "hot-tub"],
      },
      dayPlans: {
        create: [
          {
            dayIndex: 0,
            theme: "Arrival & Opening",
            notesMarkdown: "Setting the container for deep work",
            sessions: {
              create: [
                {
                  title: "Arrival & Check-in",
                  sessionType: "free",
                  startTimeLocal: "14:00",
                  endTimeLocal: "16:00",
                  capacity: 24,
                },
                {
                  title: "Opening Circle",
                  sessionType: "circle",
                  startTimeLocal: "16:30",
                  endTimeLocal: "18:00",
                  facilitatorName: "Carol Kim",
                  capacity: 24,
                  location: "Main Hall",
                },
                {
                  title: "Welcome Dinner",
                  sessionType: "meal",
                  startTimeLocal: "18:30",
                  endTimeLocal: "20:00",
                  location: "Dining Hall",
                },
              ],
            },
          },
          {
            dayIndex: 1,
            theme: "Deep Exploration",
            notesMarkdown: "Full day of practice and inquiry",
            sessions: {
              create: [
                {
                  title: "Morning Meditation",
                  sessionType: "ritual",
                  startTimeLocal: "07:00",
                  endTimeLocal: "08:00",
                  facilitatorName: "Carol Kim",
                  location: "Meditation Hall",
                },
                {
                  title: "Breakfast",
                  sessionType: "meal",
                  startTimeLocal: "08:15",
                  endTimeLocal: "09:15",
                  location: "Dining Hall",
                },
                {
                  title: "Teaching: The Inner Landscape",
                  sessionType: "talk",
                  startTimeLocal: "09:30",
                  endTimeLocal: "11:00",
                  facilitatorName: "Carol Kim",
                  capacity: 24,
                  location: "Main Hall",
                },
                {
                  title: "Silent Contemplation",
                  sessionType: "free",
                  startTimeLocal: "11:15",
                  endTimeLocal: "13:00",
                },
                {
                  title: "Lunch",
                  sessionType: "meal",
                  startTimeLocal: "13:00",
                  endTimeLocal: "14:00",
                  location: "Dining Hall",
                },
                {
                  title: "Small Group Inquiry",
                  sessionType: "circle",
                  startTimeLocal: "14:30",
                  endTimeLocal: "16:30",
                  capacity: 24,
                },
                {
                  title: "Dinner",
                  sessionType: "meal",
                  startTimeLocal: "18:00",
                  endTimeLocal: "19:00",
                  location: "Dining Hall",
                },
                {
                  title: "Evening Integration",
                  sessionType: "ritual",
                  startTimeLocal: "20:00",
                  endTimeLocal: "21:00",
                  location: "Fire Circle",
                },
              ],
            },
          },
          {
            dayIndex: 2,
            theme: "Integration & Closing",
            notesMarkdown: "Bringing insights into action",
            sessions: {
              create: [
                {
                  title: "Morning Meditation",
                  sessionType: "ritual",
                  startTimeLocal: "07:00",
                  endTimeLocal: "08:00",
                  location: "Meditation Hall",
                },
                {
                  title: "Breakfast",
                  sessionType: "meal",
                  startTimeLocal: "08:15",
                  endTimeLocal: "09:15",
                  location: "Dining Hall",
                },
                {
                  title: "Integration Workshop",
                  sessionType: "talk",
                  startTimeLocal: "09:30",
                  endTimeLocal: "11:00",
                  facilitatorName: "Carol Kim",
                },
                {
                  title: "Personal Reflection Time",
                  sessionType: "free",
                  startTimeLocal: "11:15",
                  endTimeLocal: "12:30",
                },
                {
                  title: "Lunch",
                  sessionType: "meal",
                  startTimeLocal: "12:30",
                  endTimeLocal: "13:30",
                  location: "Dining Hall",
                },
                {
                  title: "Closing Circle",
                  sessionType: "circle",
                  startTimeLocal: "14:00",
                  endTimeLocal: "16:00",
                  facilitatorName: "Carol Kim",
                  capacity: 24,
                  location: "Main Hall",
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
            descriptionMarkdown:
              "**Mountain Retreat Center** - Shared rooms (2-3 per room). All linens provided. Hot tub access included.",
            costEstimate: 180,
            metaJson: {
              rooms: 10,
              bedsPerRoom: 3,
            },
          },
          {
            itemType: "transport",
            descriptionMarkdown:
              "**Optional shuttle service** from San Francisco. Departs Friday 12pm, returns Sunday 7pm.",
            costEstimate: 50,
          },
          {
            itemType: "meal",
            descriptionMarkdown:
              "**All meals included** - Organic, vegetarian cuisine. Vegan & gluten-free options available.",
            costEstimate: 120,
            metaJson: {
              mealsPerDay: 3,
              dietary: ["vegetarian", "vegan", "gluten-free"],
            },
          },
          {
            itemType: "materials",
            descriptionMarkdown:
              "Meditation cushions, journals, and practice materials provided.",
            costEstimate: 20,
          },
        ],
      },
    },
  });

  // Create rooms for spring retreat
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        blueprintId: springRetreat.id,
        name: "Oak Room",
        roomType: "double",
        capacity: 2,
        floor: "1",
        amenities: ["ensuite-bathroom", "mountain-view"],
      },
    }),
    prisma.room.create({
      data: {
        blueprintId: springRetreat.id,
        name: "Pine Room",
        roomType: "double",
        capacity: 2,
        floor: "1",
        amenities: ["shared-bathroom", "forest-view"],
      },
    }),
    prisma.room.create({
      data: {
        blueprintId: springRetreat.id,
        name: "Cedar Dormitory",
        roomType: "dormitory",
        capacity: 6,
        floor: "2",
        amenities: ["shared-bathroom", "balcony"],
      },
    }),
    prisma.room.create({
      data: {
        blueprintId: springRetreat.id,
        name: "Redwood Dormitory",
        roomType: "dormitory",
        capacity: 6,
        floor: "2",
        amenities: ["shared-bathroom"],
      },
    }),
  ]);

  // Create registrations
  const registration1 = await prisma.registration.create({
    data: {
      blueprintId: springRetreat.id,
      participantId: participants[0].id, // Alice
      status: "approved",
      approvedAt: new Date(),
      paymentStatus: "completed",
      notes: "Early bird registration",
    },
  });

  const registration2 = await prisma.registration.create({
    data: {
      blueprintId: springRetreat.id,
      participantId: participants[1].id, // Bob
      status: "approved",
      approvedAt: new Date(),
      paymentStatus: "pending",
    },
  });

  const registration3 = await prisma.registration.create({
    data: {
      blueprintId: springRetreat.id,
      participantId: participants[2].id, // Carol (facilitator)
      status: "approved",
      approvedAt: new Date(),
      paymentStatus: "waived",
      notes: "Facilitator",
    },
  });

  // Assign rooms
  await prisma.roomAssignment.create({
    data: {
      roomId: rooms[0].id, // Oak Room
      participantId: participants[0].id, // Alice
      bedNumber: 1,
      assignedBy: "admin",
    },
  });

  await prisma.roomAssignment.create({
    data: {
      roomId: rooms[0].id, // Oak Room
      participantId: participants[1].id, // Bob
      bedNumber: 2,
      assignedBy: "admin",
    },
  });

  await prisma.roomAssignment.create({
    data: {
      roomId: rooms[1].id, // Pine Room
      participantId: participants[2].id, // Carol
      bedNumber: 1,
      assignedBy: "admin",
    },
  });

  // Create feedback form
  const feedbackForm = await prisma.feedbackForm.create({
    data: {
      blueprintId: springRetreat.id,
      title: "Post-Retreat Feedback",
      descriptionMarkdown:
        "Help us improve future retreats by sharing your experience.",
      questions: [
        {
          id: "q1",
          type: "rating",
          question: "How would you rate your overall experience?",
          required: true,
        },
        {
          id: "q2",
          type: "text",
          question: "What was the most valuable part of the retreat for you?",
          required: false,
        },
        {
          id: "q3",
          type: "text",
          question: "What could we improve?",
          required: false,
        },
      ],
      isActive: false,
      openAt: new Date("2025-04-18T00:00:00Z"),
      closeAt: new Date("2025-04-25T00:00:00Z"),
    },
  });

  // Another blueprint (draft)
  const summerRetreat = await prisma.retreatBlueprint.create({
    data: {
      communityId: mindfulCommunity.id,
      name: "Summer Leadership Retreat",
      descriptionMarkdown: "A 5-day intensive for emerging leaders.",
      daysCount: 5,
      participantCountEstimate: 30,
      maxCapacity: 30,
      status: "draft",
      tags: ["leadership", "summer"],
    },
  });

  // Eco village blueprint
  const permacultureCourse = await prisma.retreatBlueprint.create({
    data: {
      communityId: ecoVillage.id,
      templateId: permacultureTemplate.id,
      name: "Permaculture Design Certificate Course",
      descriptionMarkdown:
        "Intensive 14-day course covering all aspects of permaculture design.",
      daysCount: 14,
      participantCountEstimate: 25,
      maxCapacity: 30,
      status: "planned",
      tags: ["permaculture", "certification"],
      startDate: new Date("2025-06-01T09:00:00Z"),
      endDate: new Date("2025-06-14T17:00:00Z"),
    },
  });

  console.log(`✓ Created ${3} blueprints`);
  console.log(`✓ Created ${rooms.length} rooms`);
  console.log(`✓ Created ${3} registrations`);
  console.log(`✓ Created ${3} room assignments`);
  console.log(`✓ Created ${1} feedback form`);

  // Summary
  console.log("\n✅ Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`  Communities: 2`);
  console.log(`  Templates: 2`);
  console.log(`  Participants: ${participants.length}`);
  console.log(`  Blueprints: 3`);
  console.log(`  - Spring Inner Work Retreat 2025 (planned, with full schedule)`);
  console.log(`  - Summer Leadership Retreat (draft)`);
  console.log(`  - Permaculture Design Certificate Course (planned)`);
  console.log(`  Rooms: ${rooms.length}`);
  console.log(`  Registrations: 3`);
  console.log(`  Room Assignments: 3`);
  console.log("\n🎯 Demo Flow:");
  console.log(
    `  1. View blueprints at /blueprints - see Spring retreat with complete schedule`
  );
  console.log(`  2. Participants Alice, Bob, and Carol are registered`);
  console.log(`  3. Room assignments are set up (Oak Room, Pine Room, etc.)`);
  console.log(`  4. Try creating a new blueprint from a template`);
  console.log(`  5. Register new participants and assign rooms`);
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
