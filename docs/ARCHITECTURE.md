# Architecture Guide

## Overview

The AI Retreat Planner is built as a modular, extensible Next.js application with a clear separation of concerns and strong type safety throughout.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Blueprints │  │  Participants │  │    Templates │      │
│  │     Pages    │  │     Pages     │  │     Pages    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      API Layer (Next.js API Routes)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Validation  │  │ Error Handler│  │   Logging    │      │
│  │    (Zod)     │  │              │  │   & Metrics  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Template   │  │  Participant │  │Room Assignment│     │
│  │   Service    │  │   Service    │  │   Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    Domain Events & Adapters                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Event Emitter │  │ Notification │  │   Calendar   │      │
│  │              │  │   Adapter    │  │   Adapter    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    Data Layer (Prisma ORM)                   │
│  ┌────────────────────────────────────────────────┐        │
│  │              PostgreSQL Database                │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                     External Integrations                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   OpenAI API │  │Email/SMS (TBD)│  │Payment (TBD) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Architectural Principles

### 1. Layered Architecture

**Presentation Layer (app/)**
- Next.js pages and components
- Client-side state management
- UI interactions

**API Layer (app/api/)**
- Request validation (Zod)
- Error handling
- Logging and metrics
- Thin controller logic

**Service Layer (lib/services/)**
- Business logic
- Complex operations
- Multi-entity workflows
- Event emission

**Data Layer (lib/prisma.ts + Prisma Client)**
- Database access
- Query optimization
- Type-safe ORM

### 2. Domain-Driven Design

The system is organized around core domain concepts:

- **Community**: Multi-tenant organization unit
- **Blueprint**: Retreat plan instance
- **Template**: Reusable retreat pattern
- **Participant**: Attendee entity
- **Registration**: Participation record
- **Room**: Physical space
- **RoomAssignment**: Bed allocation

### 3. Event-Driven Architecture

Domain events enable loose coupling:

```typescript
// Event is emitted
await eventEmitter.emit({
  type: "participant.registered",
  timestamp: new Date(),
  data: {
    registrationId: registration.id,
    blueprintId: blueprint.id,
    participantId: participant.id,
  },
});

// Handlers can subscribe
eventEmitter.on("participant.registered", async (event) => {
  // Send welcome email
  // Update analytics
  // Notify organizers
});
```

### 4. Adapter Pattern for External Services

Adapters provide abstraction over external dependencies:

```typescript
// Define interface
interface INotificationAdapter {
  sendEmail(message: NotificationMessage): Promise<NotificationResult>;
}

// Implement for specific provider
class SendGridAdapter implements INotificationAdapter {
  // Implementation
}

// Swap implementations
setNotificationAdapter(new SendGridAdapter());
```

## Data Flow

### 1. API Request Flow

```
1. HTTP Request
   ↓
2. Next.js API Route Handler
   ↓
3. Request Validation (Zod)
   ↓
4. Service Layer Method Call
   ↓
5. Domain Logic Execution
   ↓
6. Database Operations (Prisma)
   ↓
7. Event Emission (Optional)
   ↓
8. Response Formatting
   ↓
9. HTTP Response
```

### 2. AI Schedule Generation Flow

```
1. POST /api/blueprints/:id/ai-generate-schedule
   ↓
2. Validate preferences
   ↓
3. Fetch blueprint from DB
   ↓
4. Prepare AI prompt with constraints
   ↓
5. Call OpenAI API (GPT-4)
   ↓
6. Parse and validate AI response
   ↓
7. Delete existing day plans
   ↓
8. Create new day plans + sessions
   ↓
9. Emit ScheduleGeneratedEvent
   ↓
10. Return updated blueprint
```

### 3. Room Auto-Assignment Flow

```
1. POST /api/blueprints/:id/rooms/assign (autoAssign: true)
   ↓
2. Fetch approved registrations without assignments
   ↓
3. Fetch all available rooms
   ↓
4. Apply assignment algorithm
   ↓
5. For each match:
     - Create RoomAssignment
     - Emit RoomAssignedEvent
   ↓
6. Return summary statistics
```

## Key Design Patterns

### 1. Factory Pattern
Test data factories (`__tests__/factories.ts`) create consistent test data.

### 2. Repository Pattern
Services encapsulate data access, hiding Prisma complexity.

### 3. Strategy Pattern
Different assignment algorithms can be swapped in `RoomAssignmentService`.

### 4. Observer Pattern
Event emitter allows multiple handlers to react to domain events.

### 5. Adapter Pattern
External service integration via adapters (notification, calendar, payment, storage).

## Error Handling Strategy

Centralized error handling with custom error classes:

```typescript
// Custom errors with HTTP codes
throw new NotFoundError("Blueprint not found"); // 404
throw new ValidationError("Invalid input"); // 400
throw new ConflictError("Already registered"); // 409

// Automatic formatting
const errorResponse = formatError(error);
// Returns consistent structure:
// {
//   error: {
//     message: string,
//     code: string,
//     statusCode: number,
//     details?: any
//   }
// }
```

## Validation Strategy

All API inputs are validated using Zod schemas:

```typescript
const createBlueprintSchema = z.object({
  name: z.string().min(3).max(200),
  daysCount: z.number().int().min(1).max(30),
  // ...
});

// In route handler
const validatedData = createBlueprintSchema.parse(body);
```

## Logging & Observability

### Structured Logging

```typescript
logger.info("Creating blueprint", { name: blueprint.name });
logger.error("Failed to assign room", error, { roomId, participantId });
```

### Metrics Collection

```typescript
metrics.recordCounter("blueprints.created", 1);
metrics.recordHistogram("ai_schedule_generation_duration_ms", durationMs);
```

## Security Considerations

### Current State
- Input validation on all endpoints
- Type safety via TypeScript
- SQL injection prevention via Prisma
- XSS prevention via React

### Future Enhancements
- Authentication (NextAuth.js)
- Authorization (RBAC)
- Rate limiting
- API key management
- Audit logging

## Performance Optimization

### Database
- Indexes on foreign keys (Prisma auto-generates)
- Selective includes to avoid over-fetching
- Pagination support (ready to add)

### API
- Response caching headers (ready to add)
- Compression middleware (ready to add)

### Frontend
- Next.js automatic code splitting
- Image optimization via Next.js
- Static generation where possible

## Testing Strategy

### Unit Tests
- Domain logic in services
- Utility functions
- Validation schemas

### Integration Tests
- API routes with test database
- Service layer with mocked adapters

### E2E Tests (Future)
- Critical user flows
- Multi-step scenarios

## Deployment Architecture

### Development
```
Docker Compose:
  - PostgreSQL container
  - Next.js dev server (local)
```

### Production (Recommended)
```
- Next.js app on Vercel/AWS
- PostgreSQL on managed service (RDS/Supabase)
- OpenAI API (external)
- File storage on S3/Cloudinary
- Email via SendGrid/AWS SES
```

## Extension Points

The system is designed for easy extension:

1. **New Adapters**: Implement interface, swap at runtime
2. **New Events**: Add to types, emit from services
3. **New Entities**: Add to Prisma schema, generate migration
4. **New Services**: Follow existing service pattern
5. **New API Routes**: Use existing validation/error patterns

## Related Documentation

- [Domain Model](./DOMAIN_NOTES.md)
- [Integration Recipes](./INTEGRATION_RECIPES.md)
- [Phase 3 Overview](./PHASE3_OVERVIEW.md)
- [README](../README.md)
