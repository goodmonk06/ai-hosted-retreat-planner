# Integration Recipes

This document provides practical recipes for integrating the AI Retreat Planner with other services in a larger ecosystem.

## Table of Contents

- [Notification Integration](#notification-integration)
- [Calendar Sync](#calendar-sync)
- [Payment Processing](#payment-processing)
- [Authentication](#authentication)
- [File Storage](#file-storage)
- [Analytics & Reporting](#analytics--reporting)
- [Webhook Configuration](#webhook-configuration)

## Notification Integration

### Email via SendGrid

```typescript
// lib/adapters/notification-sendgrid.ts
import sgMail from "@sendgrid/mail";
import { INotificationAdapter, NotificationMessage, NotificationResult } from "./notification";

export class SendGridAdapter implements INotificationAdapter {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey);
  }

  async sendEmail(message: NotificationMessage): Promise<NotificationResult> {
    try {
      const msg = {
        to: message.to,
        from: process.env.FROM_EMAIL!,
        subject: message.subject,
        html: message.body,
      };

      const [response] = await sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers["x-message-id"] as string,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async sendSMS(message: NotificationMessage): Promise<NotificationResult> {
    // Implement via Twilio or similar
    throw new Error("SMS not implemented");
  }

  async sendPushNotification(message: NotificationMessage): Promise<NotificationResult> {
    // Implement via FCM or similar
    throw new Error("Push notifications not implemented");
  }
}

// Usage in app initialization
import { setNotificationAdapter } from "@/lib/adapters/notification";
import { SendGridAdapter } from "@/lib/adapters/notification-sendgrid";

if (process.env.SENDGRID_API_KEY) {
  setNotificationAdapter(new SendGridAdapter(process.env.SENDGRID_API_KEY));
}
```

### Event Handlers for Automated Notifications

```typescript
// lib/events/handlers/notification-handlers.ts
import { eventEmitter } from "../emitter";
import { getNotificationAdapter } from "@/lib/adapters/notification";

export function setupNotificationHandlers() {
  // Registration confirmation
  eventEmitter.on("participant.registered", async (event) => {
    const adapter = getNotificationAdapter();

    await adapter.sendEmail({
      to: event.data.participantEmail,
      subject: "Registration Received",
      body: `
        <h1>Thank you for registering!</h1>
        <p>We have received your registration and will review it shortly.</p>
        <p>Registration ID: ${event.data.registrationId}</p>
      `,
      templateId: "registration-confirmation",
      variables: {
        registrationId: event.data.registrationId,
        blueprintId: event.data.blueprintId,
      },
    });
  });

  // Approval notification
  eventEmitter.on("registration.approved", async (event) => {
    // Fetch participant email
    const registration = await prisma.registration.findUnique({
      where: { id: event.data.registrationId },
      include: { participant: true, blueprint: true },
    });

    if (!registration) return;

    const adapter = getNotificationAdapter();

    await adapter.sendEmail({
      to: registration.participant.email,
      subject: `You're confirmed for ${registration.blueprint.name}!`,
      body: `
        <h1>Registration Approved!</h1>
        <p>Great news! Your registration has been approved.</p>
        <p>Retreat: ${registration.blueprint.name}</p>
        <p>Next steps: [payment link, what to bring, etc.]</p>
      `,
      templateId: "registration-approved",
    });
  });

  // Room assignment notification
  eventEmitter.on("room.assigned", async (event) => {
    // Similar pattern
  });
}
```

## Calendar Sync

### Google Calendar Integration

```typescript
// lib/adapters/calendar-google.ts
import { google } from "googleapis";
import { ICalendarAdapter, CalendarEvent, CalendarSyncResult } from "./calendar";

export class GoogleCalendarAdapter implements ICalendarAdapter {
  private calendar;

  constructor(credentials: any) {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  async createEvent(event: CalendarEvent): Promise<CalendarSyncResult> {
    try {
      const response = await this.calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: event.title,
          description: event.description,
          start: { dateTime: event.startTime.toISOString() },
          end: { dateTime: event.endTime.toISOString() },
          location: event.location,
          attendees: event.attendees?.map((email) => ({ email })),
        },
      });

      return {
        success: true,
        eventId: response.data.id!,
        url: response.data.htmlLink!,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ... implement other methods
}
```

### Syncing Retreat Schedule to Calendar

```typescript
// lib/services/calendar-sync-service.ts
import { getCalendarAdapter } from "@/lib/adapters/calendar";
import { prisma } from "@/lib/prisma";

export async function syncRetreatToCalendar(blueprintId: string, userId: string) {
  const blueprint = await prisma.retreatBlueprint.findUnique({
    where: { id: blueprintId },
    include: {
      dayPlans: {
        include: { sessions: true },
        orderBy: { dayIndex: "asc" },
      },
    },
  });

  if (!blueprint || !blueprint.startDate) {
    throw new Error("Blueprint not found or missing start date");
  }

  const adapter = getCalendarAdapter();
  const results = [];

  for (const dayPlan of blueprint.dayPlans) {
    for (const session of dayPlan.sessions) {
      // Calculate actual date/time
      const sessionDate = new Date(blueprint.startDate);
      sessionDate.setDate(sessionDate.getDate() + dayPlan.dayIndex);

      const [startHour, startMinute] = session.startTimeLocal.split(":").map(Number);
      const [endHour, endMinute] = session.endTimeLocal.split(":").map(Number);

      const startTime = new Date(sessionDate);
      startTime.setHours(startHour, startMinute);

      const endTime = new Date(sessionDate);
      endTime.setHours(endHour, endMinute);

      const result = await adapter.createEvent({
        title: `${blueprint.name} - ${session.title}`,
        description: `Session Type: ${session.sessionType}\nFacilitator: ${session.facilitatorName || "TBD"}`,
        startTime,
        endTime,
        location: session.location,
      });

      results.push(result);
    }
  }

  return results;
}
```

## Payment Processing

### Stripe Integration

```typescript
// lib/adapters/payment-stripe.ts
import Stripe from "stripe";
import { IPaymentAdapter, PaymentIntent, PaymentResult } from "./payment";

export class StripeAdapter implements IPaymentAdapter {
  private stripe: Stripe;

  constructor(apiKey: string) {
    this.stripe = new Stripe(apiKey, { apiVersion: "2023-10-16" });
  }

  async createPaymentIntent(intent: PaymentIntent): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: intent.amount,
        currency: intent.currency,
        description: intent.description,
        metadata: intent.metadata || {},
        receipt_email: intent.customerEmail,
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        status: "pending",
        paymentUrl: paymentIntent.client_secret!,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // ... implement other methods
}
```

### Payment Flow for Registrations

```typescript
// app/api/registrations/[id]/payment/route.ts
import { getPaymentAdapter } from "@/lib/adapters/payment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: registrationId } = await params;

  // Fetch registration and blueprint
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId },
    include: {
      participant: true,
      blueprint: {
        include: { logisticsItems: true },
      },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  // Calculate total cost
  const totalCost = registration.blueprint.logisticsItems.reduce(
    (sum, item) => sum + (item.costEstimate || 0),
    0
  );

  // Create payment intent
  const paymentAdapter = getPaymentAdapter();
  const result = await paymentAdapter.createPaymentIntent({
    amount: totalCost * 100, // cents
    currency: "usd",
    description: `Registration for ${registration.blueprint.name}`,
    customerEmail: registration.participant.email,
    metadata: {
      registrationId: registration.id,
      blueprintId: registration.blueprintId,
    },
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Update registration with payment info
  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      metaJson: {
        ...((registration.metaJson as any) || {}),
        paymentIntentId: result.transactionId,
      },
    },
  });

  return NextResponse.json({
    clientSecret: result.paymentUrl,
    amount: totalCost,
  });
}
```

## Authentication

### NextAuth.js Integration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Add community membership to session
      const participant = await prisma.participant.findFirst({
        where: { email: user.email! },
        include: { community: true },
      });

      return {
        ...session,
        user: {
          ...session.user,
          participantId: participant?.id,
          communityId: participant?.communityId,
        },
      };
    },
  },
});

export { handler as GET, handler as POST };
```

### Protected API Routes

```typescript
// lib/auth.ts
import { getServerSession } from "next-auth";

export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new UnauthorizedError("Authentication required");
  }

  return session;
}

export async function requireCommunityAccess(communityId: string) {
  const session = await requireAuth();

  if (session.user.communityId !== communityId) {
    throw new ForbiddenError("Access denied to this community");
  }

  return session;
}
```

## File Storage

### AWS S3 Integration

```typescript
// lib/adapters/storage-s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { IStorageAdapter, UploadOptions, UploadResult } from "./storage";

export class S3StorageAdapter implements IStorageAdapter {
  private s3: S3Client;
  private bucket: string;

  constructor(config: { bucket: string; region: string; credentials: any }) {
    this.s3 = new S3Client({
      region: config.region,
      credentials: config.credentials,
    });
    this.bucket = config.bucket;
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const key = `${Date.now()}-${options.filename}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: options.buffer,
          ContentType: options.contentType,
          Metadata: options.metadata,
          ACL: options.isPublic ? "public-read" : "private",
        })
      );

      return {
        success: true,
        fileId: key,
        url: this.getPublicUrl(key),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getPublicUrl(fileId: string): string {
    return `https://${this.bucket}.s3.amazonaws.com/${fileId}`;
  }

  // ... implement other methods
}
```

## Analytics & Reporting

### Integration with Analytics Service

```typescript
// lib/events/handlers/analytics-handlers.ts
import { eventEmitter } from "../emitter";

export function setupAnalyticsHandlers() {
  // Track blueprint creation
  eventEmitter.on("blueprint.created", async (event) => {
    await fetch("https://analytics-service.example.com/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "retreat_created",
        properties: {
          blueprintId: event.data.blueprintId,
          communityId: event.data.communityId,
          timestamp: event.timestamp,
        },
      }),
    });
  });

  // Track registrations
  eventEmitter.on("participant.registered", async (event) => {
    await fetch("https://analytics-service.example.com/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "participant_registered",
        properties: {
          blueprintId: event.data.blueprintId,
          timestamp: event.timestamp,
        },
      }),
    });
  });
}
```

## Webhook Configuration

### Receiving Webhooks from External Services

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  // Handle different event types
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update registration payment status
      await prisma.registration.updateMany({
        where: {
          metaJson: {
            path: ["paymentIntentId"],
            equals: paymentIntent.id,
          },
        },
        data: {
          paymentStatus: "completed",
        },
      });
      break;

    case "payment_intent.payment_failed":
      // Handle failed payment
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Sending Webhooks to External Services

```typescript
// lib/events/handlers/webhook-handlers.ts
import { eventEmitter } from "../emitter";

export function setupWebhookHandlers() {
  // Send webhook on registration
  eventEmitter.on("participant.registered", async (event) => {
    const webhookUrl = process.env.REGISTRATION_WEBHOOK_URL;
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.WEBHOOK_SECRET!,
      },
      body: JSON.stringify({
        event: "participant.registered",
        data: event.data,
        timestamp: event.timestamp,
      }),
    });
  });
}
```

## Event Handler Initialization

```typescript
// lib/events/setup.ts
import { setupNotificationHandlers } from "./handlers/notification-handlers";
import { setupAnalyticsHandlers } from "./handlers/analytics-handlers";
import { setupWebhookHandlers } from "./handlers/webhook-handlers";

export function initializeEventHandlers() {
  setupNotificationHandlers();
  setupAnalyticsHandlers();
  setupWebhookHandlers();

  console.log("Event handlers initialized");
}

// Call in app initialization (e.g., middleware.ts or _app.tsx)
```

## Testing Integrations

```typescript
// __tests__/integrations/notification.test.ts
import { ConsoleNotificationAdapter } from "@/lib/adapters/notification";

describe("Notification Integration", () => {
  it("should send email successfully", async () => {
    const adapter = new ConsoleNotificationAdapter();

    const result = await adapter.sendEmail({
      to: "test@example.com",
      subject: "Test",
      body: "Test body",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });
});
```

## Summary

These integration recipes provide a foundation for connecting the AI Retreat Planner with external services. The adapter pattern makes it easy to swap implementations and test in isolation.

For production deployments, ensure you:
1. Store API keys securely (environment variables, secret managers)
2. Implement retry logic for external API calls
3. Monitor integration health
4. Log integration events for debugging
5. Test error scenarios
