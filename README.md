# AI Retreat Planner

合宿・リトリート・オフライン会をAIがプランニングし、日程・プログラム・部屋割りまで提案するプランナー。

A comprehensive system for designing, managing, and executing multi-day transformative gatherings such as retreats, camps, workshops, and intentional community events.

**Status**: Phase 3 Complete ✅ - Production-ready with full lifecycle management

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Domain Model](#domain-model)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Usage Examples](#usage-examples)
- [CLI Tools](#cli-tools)
- [Extension & Integration](#extension--integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

The AI Retreat Planner provides end-to-end tools for retreat organizers:

1. **Multi-tenant Communities**: Organize retreats across different communities with isolated data
2. **Reusable Templates**: Create and apply templates for recurring retreat patterns
3. **AI Schedule Generation**: Leverage GPT-4 to create balanced, thoughtful retreat schedules
4. **Participant Management**: Register, approve, and communicate with attendees
5. **Smart Room Assignment**: Auto-assign participants to rooms based on capacity and preferences
6. **Feedback Collection**: Gather post-retreat insights and improve future events
7. **Complete Lifecycle**: From ideation → planning → execution → retrospective

This system is designed as a building block in a larger "community civilization OS" ecosystem, with clean integration points for auth, notifications, payments, and more.

---

## Features

### 🏛️ Multi-Tenant Communities

- **Community Management**: Organize retreats under different communities
- **Isolated Data**: Each community has its own participants, templates, and blueprints
- **Community Settings**: Customizable preferences (timezone, default capacity, etc.)

### 📋 Blueprint Management

Create detailed retreat plans with:
- Name, description (Markdown), and tags
- Duration (1-30 days)
- Participant capacity and estimates
- Location constraints
- Status tracking (draft, planned, active, completed, archived, cancelled)
- Start and end dates
- Cancellation policies

### 🎯 Template System

- **Create Templates**: Extract proven patterns from successful retreats
- **Apply Templates**: Instantly instantiate retreats from templates
- **Public/Private**: Share templates across communities or keep them private
- **Usage Tracking**: Monitor how often templates are used
- **Customization**: Apply templates then customize for specific needs

### 🤖 AI-Powered Schedule Generation

- **Endpoint**: `POST /api/blueprints/:id/ai-generate-schedule`
- **Intelligent Planning**: GPT-4 generates balanced schedules considering:
  - Participant count and energy levels
  - Inner work vs. social focus preferences
  - Physical activity requirements
  - Custom requirements
- **Session Diversity**: Automatically varies session types (circles, talks, rituals, meals, breaks, free time)
- **Time Management**: Proper pacing, breaks, and transitions
- **Robust Parsing**: Validated output with comprehensive error handling

### 👥 Participant Management

- **Participant Profiles**: Name, email, phone, bio, dietary preferences, accessibility needs
- **Role-Based**: Participants, facilitators, organizers, support staff
- **Registration Flow**: Register → Pending → Approved/Waitlisted/Rejected
- **Capacity Management**: Automatic waitlist when retreat is full
- **Communication**: Automated notifications at each stage (via adapters)

### 🏠 Room Assignment

- **Room Definition**: Create rooms with type, capacity, floor, amenities
- **Manual Assignment**: Assign specific participants to specific rooms/beds
- **Auto-Assignment**: Algorithmic assignment based on capacity
- **Utilization Tracking**: Real-time room occupancy statistics
- **Preferences**: Store roommate preferences for future enhancement

### 📊 Feedback & Analytics

- **Custom Forms**: Create feedback forms with multiple question types
- **Post-Retreat Collection**: Open/close feedback windows
- **Response Tracking**: Monitor who has submitted feedback
- **Future Analytics**: Foundation for sentiment analysis and improvement insights

### 🎨 Modern Web UI

- Browse all retreat blueprints with filters
- Detailed schedule views with color-coded sessions
- Template application interface
- Participant registration flow
- Room assignment dashboard
- One-click AI schedule generation

---

## Tech Stack

### Core
- **Next.js 16** (App Router) - Full-stack framework
- **TypeScript** - Type safety throughout
- **PostgreSQL** - Primary database
- **Prisma** - Type-safe ORM

### AI & External Services
- **OpenAI API** (GPT-4) - Schedule generation
- **Zod** - Runtime validation
- **Adapter Pattern** - Pluggable integrations (email, calendar, payments, storage)

### Developer Experience
- **Jest** - Testing framework
- **Commander** - CLI tools
- **Docker Compose** - Local development
- **ESLint** - Code quality
- **Tailwind CSS** - Styling

---

## Domain Model

### Core Entities

```
Community
├── RetreatBlueprint
│   ├── RetreatDayPlan
│   │   └── RetreatSession
│   ├── LogisticsItem
│   ├── Room
│   │   └── RoomAssignment
│   ├── Registration
│   └── FeedbackForm
│       └── FeedbackResponse
├── RetreatTemplate
└── Participant
    ├── Registration
    ├── RoomAssignment
    └── FeedbackResponse
```

### Enums

**RetreatStatus**: `draft | planned | active | completed | archived | cancelled`

**SessionType**: `circle | talk | break | meal | ritual | free`

**LogisticsItemType**: `accommodation | transport | meal | materials | other`

**RoomType**: `single | double | dormitory | tent | other`

**ParticipantRole**: `participant | facilitator | organizer | support_staff`

**RegistrationStatus**: `pending | approved | waitlisted | rejected | cancelled`

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architectural documentation.

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+
- **OpenAI API Key** (for AI schedule generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-hosted-retreat-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add:
   - `DATABASE_URL` - PostgreSQL connection string
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `OPENAI_MODEL` - Model to use (default: gpt-4)

4. **Start PostgreSQL** (with Docker)
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   npm run db:push
   ```

6. **Generate Prisma client**
   ```bash
   npm run db:generate
   ```

7. **Seed the database** (with comprehensive demo data)
   ```bash
   npm run db:seed
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000)

### Quick Setup Script

Alternatively, use the automated setup script:

```bash
./scripts/setup.sh
```

---

## API Documentation

### Blueprints

- `GET /api/blueprints` - List all blueprints
- `POST /api/blueprints` - Create a blueprint
- `GET /api/blueprints/:id` - Get blueprint details
- `DELETE /api/blueprints/:id` - Delete a blueprint
- `POST /api/blueprints/:id/ai-generate-schedule` - Generate AI schedule

### Templates

- `GET /api/templates` - List templates (query: communityId, isPublic, tags)
- `POST /api/templates` - Create a template
- `POST /api/templates/:id/apply` - Apply template to create blueprint

### Participants

- `GET /api/participants` - List participants (query: communityId, role, tags)
- `POST /api/participants` - Create a participant

### Registrations

- `POST /api/registrations` - Register participant for retreat

### Rooms

- `GET /api/blueprints/:id/rooms` - List rooms for a blueprint
- `POST /api/blueprints/:id/rooms` - Create a room
- `POST /api/blueprints/:id/rooms/assign` - Assign participant to room (or auto-assign)

All endpoints support:
- **Validation**: Zod schemas for input validation
- **Error Handling**: Consistent error responses with HTTP codes
- **Logging**: Structured logging with context
- **Metrics**: Counters and histograms for observability

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for request/response examples.

---

## Usage Examples

### 1. Create a Community

```bash
curl -X POST http://localhost:3000/api/communities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mindful Living Collective",
    "slug": "mindful-living",
    "description": "A community focused on contemplative practices"
  }'
```

### 2. Create a Template

```bash
curl -X POST http://localhost:3000/api/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "3-Day Inner Work Intensive",
    "daysCount": 3,
    "suggestedCapacity": 24,
    "tags": ["inner-work", "meditation"],
    "isPublic": true,
    "templateData": {
      "dayPlans": [...],
      "logisticsItems": [...]
    }
  }'
```

### 3. Apply a Template

```bash
curl -X POST http://localhost:3000/api/templates/{template-id}/apply \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Spring Inner Work Retreat 2025",
    "startDate": "2025-04-15T14:00:00Z"
  }'
```

### 4. Register a Participant

```bash
curl -X POST http://localhost:3000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "blueprintId": "{blueprint-id}",
    "participantData": {
      "email": "alice@example.com",
      "name": "Alice Chen",
      "preferences": {
        "dietary": ["vegetarian"],
        "accessibility": ["none"]
      }
    }
  }'
```

### 5. Auto-Assign Rooms

```bash
curl -X POST http://localhost:3000/api/blueprints/{id}/rooms/assign \
  -H "Content-Type: application/json" \
  -d '{
    "autoAssign": true,
    "prioritizePreferences": true
  }'
```

---

## CLI Tools

The project includes a CLI for common operations:

```bash
npm run cli -- [command]
```

### Available Commands

- `cli clear` - Clear all data from database
- `cli list:communities` - List all communities with stats
- `cli list:blueprints` - List all blueprints (filter with `-s draft`)
- `cli show:retreat <id>` - Show detailed retreat information
- `cli health` - Run health checks and show statistics
- `cli export:blueprint <id>` - Export blueprint to JSON

### Examples

```bash
# List all blueprints with draft status
npm run cli -- list:blueprints -s draft

# Show details of a specific retreat
npm run cli -- show:retreat clxy123abc

# Run health check
npm run cli -- health

# Export blueprint
npm run cli -- export:blueprint clxy123abc > retreat.json
```

---

## Extension & Integration

The system is designed for easy integration with external services through **adapters** and **domain events**.

### Adapters

Swap implementations for external services:

```typescript
// Notifications (Email, SMS, Push)
import { setNotificationAdapter } from "@/lib/adapters/notification";
import { SendGridAdapter } from "@/lib/adapters/notification-sendgrid";
setNotificationAdapter(new SendGridAdapter(apiKey));

// Calendar Sync (Google Calendar, iCal)
import { setCalendarAdapter } from "@/lib/adapters/calendar";
setCalendarAdapter(new GoogleCalendarAdapter(credentials));

// Payments (Stripe, PayPal)
import { setPaymentAdapter } from "@/lib/adapters/payment";
setPaymentAdapter(new StripeAdapter(apiKey));

// File Storage (S3, Azure Blob)
import { setStorageAdapter } from "@/lib/adapters/storage";
setStorageAdapter(new S3StorageAdapter(config));
```

### Domain Events

React to system events:

```typescript
import { eventEmitter } from "@/lib/events/emitter";

// Send email when participant registers
eventEmitter.on("participant.registered", async (event) => {
  const { participantEmail, blueprintId } = event.data;

  await sendEmail({
    to: participantEmail,
    subject: "Registration Received!",
    body: "Thank you for registering...",
  });
});

// Sync to calendar when schedule is generated
eventEmitter.on("schedule.generated", async (event) => {
  await syncToCalendar(event.data.blueprintId);
});
```

**Available Events**:
- `blueprint.created`
- `blueprint.status_changed`
- `schedule.generated`
- `participant.registered`
- `registration.approved`
- `room.assigned`
- `feedback.submitted`
- `template.created`
- `template.applied`

See [docs/INTEGRATION_RECIPES.md](./docs/INTEGRATION_RECIPES.md) for detailed integration examples.

---

## Testing

### Run Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch
```

### Test Coverage

- **Unit Tests**: Validation logic, domain services, AI parsing
- **Integration Tests**: API routes, database operations
- **Test Factories**: Comprehensive test data generators

### Writing Tests

Use test factories for consistent data:

```typescript
import { TestDataFactory } from "@/__tests__/factories";
import { prisma } from "@/lib/prisma";

const factory = new TestDataFactory(prisma);

const blueprint = await factory.createCompleteBlueprint({
  name: "Test Retreat",
  daysCount: 3,
});
```

---

## Deployment

### Development

```bash
# With Docker Compose
docker-compose up

# Or manually
npm run dev
```

### Production

**Option 1: Vercel** (Recommended for Next.js)

1. Connect GitHub repository to Vercel
2. Set environment variables (DATABASE_URL, OPENAI_API_KEY)
3. Deploy

**Option 2: Docker**

```bash
# Build image
docker build -t retreat-planner .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e OPENAI_API_KEY="..." \
  retreat-planner
```

**Database**: Use managed PostgreSQL (AWS RDS, Supabase, Neon, etc.)

---

## Project Structure

```
ai-hosted-retreat-planner/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── blueprints/       # Blueprint endpoints
│   │   ├── templates/        # Template endpoints
│   │   ├── participants/     # Participant endpoints
│   │   └── registrations/    # Registration endpoints
│   ├── blueprints/           # Blueprint pages
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── lib/                      # Shared libraries
│   ├── adapters/             # External service adapters
│   │   ├── notification.ts
│   │   ├── calendar.ts
│   │   ├── payment.ts
│   │   └── storage.ts
│   ├── events/               # Domain events
│   │   ├── types.ts
│   │   └── emitter.ts
│   ├── services/             # Business logic
│   │   ├── template-service.ts
│   │   ├── participant-service.ts
│   │   └── room-assignment-service.ts
│   ├── validation.ts         # Zod schemas
│   ├── errors.ts             # Error classes
│   ├── logger.ts             # Logging
│   ├── metrics.ts            # Metrics
│   ├── ai-scheduler.ts       # AI integration
│   └── prisma.ts             # Prisma client
├── components/               # React components
├── prisma/                   # Database
│   ├── schema.prisma         # Prisma schema
│   ├── seed.ts               # Simple seed
│   └── seed-expanded.ts      # Comprehensive demo data
├── scripts/                  # Utilities
│   ├── cli.ts                # CLI tool
│   └── setup.sh              # Setup script
├── __tests__/                # Tests
│   ├── factories.ts          # Test data factories
│   └── *.test.ts             # Test files
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # Architecture guide
│   ├── INTEGRATION_RECIPES.md # Integration examples
│   └── PHASE3_OVERVIEW.md    # Phase 3 summary
├── docker-compose.yml        # PostgreSQL setup
├── Dockerfile                # App container
└── README.md                 # This file
```

---

## Integration with Ecosystem

This retreat planner integrates with:

- **ritual-event-orchestrator**: Real-time retreat execution
- **auth-service**: User authentication
- **notification-hub**: Email/SMS communication
- **payment-service**: Registration payments
- **community-platform**: Member profiles
- **analytics-service**: Metrics and insights

See [docs/INTEGRATION_RECIPES.md](./docs/INTEGRATION_RECIPES.md) for integration guides.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

---

## License

See [LICENSE](./LICENSE) file for details.

---

## Support & Documentation

- **Architecture**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **Integration**: [docs/INTEGRATION_RECIPES.md](./docs/INTEGRATION_RECIPES.md)
- **Phase 3 Overview**: [docs/PHASE3_OVERVIEW.md](./docs/PHASE3_OVERVIEW.md)

For questions or issues, please open an issue on GitHub.

---

**Built with ❤️ for transformative communities**
