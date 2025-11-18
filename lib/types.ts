import { SessionType, LogisticsItemType } from "@prisma/client";

export interface AIScheduleRequest {
  blueprintId: string;
  daysCount: number;
  participantCount: number;
  preferences?: {
    innerWorkFocus?: number; // 1-10 scale
    socialFocus?: number; // 1-10 scale
    physicalActivity?: number; // 1-10 scale
    customRequirements?: string;
  };
}

export interface AIGeneratedSession {
  title: string;
  sessionType: SessionType;
  startTimeLocal: string;
  endTimeLocal: string;
  facilitatorName?: string;
  description?: string;
  metaJson?: Record<string, any>;
}

export interface AIGeneratedDayPlan {
  dayIndex: number;
  theme: string;
  notesMarkdown?: string;
  sessions: AIGeneratedSession[];
}

export interface AIScheduleResponse {
  dayPlans: AIGeneratedDayPlan[];
  suggestedLogistics?: {
    itemType: LogisticsItemType;
    descriptionMarkdown: string;
    costEstimate?: number;
  }[];
}
