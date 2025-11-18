// Calendar Adapter Interface
// Allows integration with external calendar systems (Google Calendar, iCal, Outlook, etc.)

export interface CalendarEvent {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  metadata?: Record<string, any>;
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  url?: string;
  error?: string;
}

export interface ICalendarAdapter {
  createEvent(event: CalendarEvent): Promise<CalendarSyncResult>;
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarSyncResult>;
  deleteEvent(eventId: string): Promise<CalendarSyncResult>;
  exportToICalendar(events: CalendarEvent[]): string;
}

// Default in-memory implementation
export class InMemoryCalendarAdapter implements ICalendarAdapter {
  private events: Map<string, CalendarEvent> = new Map();

  async createEvent(event: CalendarEvent): Promise<CalendarSyncResult> {
    const eventId = `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.events.set(eventId, event);

    console.log("[CALENDAR] Event created:", {
      eventId,
      title: event.title,
      startTime: event.startTime,
    });

    return {
      success: true,
      eventId,
      url: `https://calendar.example.com/event/${eventId}`,
    };
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<CalendarSyncResult> {
    const existing = this.events.get(eventId);
    if (!existing) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    this.events.set(eventId, { ...existing, ...event });

    console.log("[CALENDAR] Event updated:", { eventId });

    return {
      success: true,
      eventId,
    };
  }

  async deleteEvent(eventId: string): Promise<CalendarSyncResult> {
    const deleted = this.events.delete(eventId);

    console.log("[CALENDAR] Event deleted:", { eventId, success: deleted });

    return {
      success: deleted,
      eventId: deleted ? eventId : undefined,
      error: deleted ? undefined : "Event not found",
    };
  }

  exportToICalendar(events: CalendarEvent[]): string {
    // Simplified iCalendar format
    const icalEvents = events
      .map((event) => {
        return `BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${event.startTime.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${event.endTime.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DESCRIPTION:${event.description || ""}
LOCATION:${event.location || ""}
END:VEVENT`;
      })
      .join("\n");

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Retreat Planner//EN
${icalEvents}
END:VCALENDAR`;
  }
}

// Singleton
let calendarAdapter: ICalendarAdapter = new InMemoryCalendarAdapter();

export function setCalendarAdapter(adapter: ICalendarAdapter): void {
  calendarAdapter = adapter;
}

export function getCalendarAdapter(): ICalendarAdapter {
  return calendarAdapter;
}
