// Domain Event System

export interface DomainEvent {
  type: string;
  timestamp: Date;
  data: any;
  metadata?: {
    userId?: string;
    source?: string;
    [key: string]: any;
  };
}

// Blueprint Events
export interface BlueprintCreatedEvent extends DomainEvent {
  type: "blueprint.created";
  data: {
    blueprintId: string;
    name: string;
    communityId?: string;
  };
}

export interface BlueprintStatusChangedEvent extends DomainEvent {
  type: "blueprint.status_changed";
  data: {
    blueprintId: string;
    oldStatus: string;
    newStatus: string;
  };
}

export interface ScheduleGeneratedEvent extends DomainEvent {
  type: "schedule.generated";
  data: {
    blueprintId: string;
    daysCount: number;
    sessionsCount: number;
  };
}

// Participant Events
export interface ParticipantRegisteredEvent extends DomainEvent {
  type: "participant.registered";
  data: {
    registrationId: string;
    blueprintId: string;
    participantId: string;
    participantEmail: string;
  };
}

export interface RegistrationApprovedEvent extends DomainEvent {
  type: "registration.approved";
  data: {
    registrationId: string;
    blueprintId: string;
    participantId: string;
  };
}

export interface RoomAssignedEvent extends DomainEvent {
  type: "room.assigned";
  data: {
    assignmentId: string;
    roomId: string;
    participantId: string;
    blueprintId: string;
  };
}

// Feedback Events
export interface FeedbackSubmittedEvent extends DomainEvent {
  type: "feedback.submitted";
  data: {
    responseId: string;
    formId: string;
    blueprintId: string;
    participantId: string;
  };
}

// Template Events
export interface TemplateCreatedEvent extends DomainEvent {
  type: "template.created";
  data: {
    templateId: string;
    name: string;
    communityId?: string;
  };
}

export interface TemplateAppliedEvent extends DomainEvent {
  type: "template.applied";
  data: {
    templateId: string;
    blueprintId: string;
  };
}

// Union type of all events
export type RetreatEvent =
  | BlueprintCreatedEvent
  | BlueprintStatusChangedEvent
  | ScheduleGeneratedEvent
  | ParticipantRegisteredEvent
  | RegistrationApprovedEvent
  | RoomAssignedEvent
  | FeedbackSubmittedEvent
  | TemplateCreatedEvent
  | TemplateAppliedEvent;
