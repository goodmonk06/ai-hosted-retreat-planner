# AI Retreat Planner

合宿・リトリート・オフライン会をAIがプランニングし、日程・プログラム・部屋割りまで提案するプランナー。

A comprehensive system for designing multi-day retreats, camps, and in-person gatherings with AI-powered scheduling assistance.

## Features

### 1. Blueprint Creation
Create retreat blueprints with:
- Name and description
- Number of days
- Estimated participant count
- Location constraints (stored as JSON)
- Community association

### 2. AI-Powered Schedule Generation
- **Endpoint**: `POST /api/blueprints/:id/ai-generate-schedule`
- Uses LLM (OpenAI GPT-4) to generate thoughtful, balanced schedules
- Considers constraints like participant count, retreat focus, and duration
- Generates day themes and session breakdowns with appropriate timing

### 3. Rich Schedule Model
Each retreat schedule includes:
- **Day Plans**: Themed daily structures with notes
- **Sessions**: Individual program blocks with:
  - Title and type (circle, talk, break, meal, ritual, free)
  - Start/end times (local time format)
  - Optional facilitator assignment
  - Flexible metadata (stored as JSON)

### 4. Logistics Planning
Track essential retreat logistics:
- Accommodation
- Transport
- Meals
- Materials
- Other items
- Cost estimates for budgeting

### 5. Modern Web UI
- Browse all retreat blueprints
- View detailed schedules in day-by-day layout
- Generate AI schedules with one click
- Color-coded session types for easy scanning
- Mobile-responsive design

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **AI**: OpenAI API (GPT-4)
- **Styling**: Tailwind CSS
- **Testing**: Jest

## Architecture

### Domain Model

```
RetreatBlueprint
├── dayPlans (RetreatDayPlan[])
│   └── sessions (RetreatSession[])
└── logisticsItems (LogisticsItem[])
```

#### RetreatBlueprint
- `id`: Unique identifier
- `communityId`: Optional community association
- `name`: Retreat name
- `descriptionMarkdown`: Rich description
- `daysCount`: Number of days
- `participantCountEstimate`: Expected attendees
- `locationConstraintsJson`: Flexible location preferences
- `createdAt`, `updatedAt`: Timestamps

#### RetreatDayPlan
- `id`: Unique identifier
- `blueprintId`: Parent blueprint
- `dayIndex`: Day number (0-indexed)
- `theme`: Daily theme/focus
- `notesMarkdown`: Additional notes

#### RetreatSession
- `id`: Unique identifier
- `dayPlanId`: Parent day plan
- `title`: Session name
- `sessionType`: Enum (circle, talk, break, meal, ritual, free)
- `startTimeLocal`, `endTimeLocal`: Time format (HH:MM)
- `facilitatorName`: Optional facilitator
- `metaJson`: Flexible metadata for session-specific data

#### LogisticsItem
- `id`: Unique identifier
- `blueprintId`: Parent blueprint
- `itemType`: Enum (accommodation, transport, meal, materials, other)
- `descriptionMarkdown`: Rich description
- `costEstimate`: Optional budget amount
- `metaJson`: Flexible metadata

### API Routes

#### Blueprints
- `GET /api/blueprints` - List all blueprints
- `POST /api/blueprints` - Create new blueprint
- `GET /api/blueprints/:id` - Get blueprint details
- `DELETE /api/blueprints/:id` - Delete blueprint

#### AI Generation
- `POST /api/blueprints/:id/ai-generate-schedule` - Generate schedule with AI
  - Request body (optional):
    ```json
    {
      "preferences": {
        "innerWorkFocus": 7,
        "socialFocus": 6,
        "physicalActivity": 5,
        "customRequirements": "Include daily meditation"
      }
    }
    ```

### AI Scheduler

The AI scheduler (`lib/ai-scheduler.ts`) uses OpenAI's GPT-4 to generate retreat schedules:

**Key Features**:
- Structured JSON output with strict validation
- Time format validation (HH:MM)
- Session type normalization
- Robust error handling
- Comprehensive testing

**Principles Applied by AI**:
- Balance structured activities with free time
- Include proper meal times and breaks
- Vary session types for engagement
- Build energy intentionally throughout the retreat
- Allow integration time after intense sessions
- Consider group size for different activities

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-hosted-retreat-planner
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: Your OpenAI API key
- `OPENAI_MODEL`: Model to use (default: gpt-4)

4. Start PostgreSQL with Docker (optional):
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npx prisma db push
```

6. Generate Prisma client:
```bash
npm run db:generate
```

7. Seed the database with demo data:
```bash
npm run db:seed
```

8. Start the development server:
```bash
npm run dev
```

Visit http://localhost:3000 to see the application.

### Database Management

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema changes to database (development)
npm run db:push

# Create and run migrations (production)
npm run db:migrate

# Seed demo data
npm run db:seed
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

The test suite includes comprehensive validation tests for AI output parsing to ensure robust schedule generation.

## Development Workflow

### Creating a New Blueprint

1. Navigate to `/blueprints`
2. Click "Create New Blueprint"
3. Fill in retreat details
4. Save the blueprint

### Generating a Schedule

1. Open a blueprint detail page
2. Click "Generate AI Schedule"
3. Wait for AI to generate the schedule
4. Review and adjust as needed

### Customizing AI Generation

The AI generation can be customized by modifying:
- System prompt in `lib/ai-scheduler.ts`
- Preferences passed to the API endpoint
- Validation rules for session types and times

## Integration with ritual-event-orchestrator

This retreat planner is designed to integrate with the **ritual-event-orchestrator** system for executing retreat schedules in real-time.

### Schedule Export Format

The schedule model can be exported to a format compatible with the ritual-event-orchestrator:

```typescript
// Example integration
function exportToOrchestrator(blueprint: RetreatBlueprint) {
  return {
    eventId: blueprint.id,
    eventName: blueprint.name,
    days: blueprint.dayPlans.map(day => ({
      date: calculateDate(day.dayIndex),
      theme: day.theme,
      blocks: day.sessions.map(session => ({
        id: session.id,
        title: session.title,
        type: session.sessionType,
        startTime: session.startTimeLocal,
        endTime: session.endTimeLocal,
        facilitator: session.facilitatorName,
        metadata: session.metaJson,
      })),
    })),
  };
}
```

### Key Integration Points

1. **Session Types**: The session types (circle, talk, break, meal, ritual, free) map directly to event block types in the orchestrator
2. **Time Format**: HH:MM format is used consistently for easy parsing
3. **Metadata**: The `metaJson` field allows storing orchestrator-specific data (e.g., room assignments, Zoom links)
4. **Real-time Updates**: The orchestrator can poll the blueprint API for schedule updates

### Future Enhancements

- **Webhook Integration**: Notify orchestrator when schedules change
- **Room Assignment**: Add room/space allocation to sessions
- **Participant Management**: Track individual participant schedules
- **Live Updates**: WebSocket support for real-time schedule changes during retreats

## Project Structure

```
ai-hosted-retreat-planner/
├── app/                      # Next.js app directory
│   ├── api/                 # API routes
│   │   └── blueprints/      # Blueprint endpoints
│   ├── blueprints/          # Blueprint pages
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   └── GenerateScheduleButton.tsx
├── lib/                     # Shared utilities
│   ├── prisma.ts           # Prisma client
│   ├── ai-scheduler.ts     # AI scheduling logic
│   └── types.ts            # TypeScript types
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma       # Prisma schema
│   └── seed.ts             # Seed data
├── __tests__/              # Test files
│   └── ai-scheduler.test.ts
├── docker-compose.yml      # PostgreSQL container
├── Dockerfile              # Application container
└── README.md               # This file
```

## Production Deployment

### Database

1. Create a PostgreSQL database
2. Set `DATABASE_URL` environment variable
3. Run migrations: `npx prisma migrate deploy`

### Environment Variables

Required for production:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key
- `OPENAI_MODEL`: Model to use
- `NEXT_PUBLIC_BASE_URL`: Your app URL

### Build & Deploy

```bash
# Build the application
npm run build

# Start production server
npm start
```

For Docker deployment:
```bash
docker build -t retreat-planner .
docker run -p 3000:3000 retreat-planner
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Submit a pull request

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue on the GitHub repository.
