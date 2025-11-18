import { z } from "zod";

// Blueprint validation schemas
export const createBlueprintSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  descriptionMarkdown: z.string().optional(),
  daysCount: z.number().int().min(1).max(30),
  participantCountEstimate: z.number().int().min(1).max(1000),
  locationConstraintsJson: z.record(z.any()).optional(),
  communityId: z.string().optional(),
});

export const updateBlueprintSchema = createBlueprintSchema.partial();

// AI generation preferences schema
export const aiGenerationPreferencesSchema = z.object({
  innerWorkFocus: z.number().min(1).max(10).optional(),
  socialFocus: z.number().min(1).max(10).optional(),
  physicalActivity: z.number().min(1).max(10).optional(),
  customRequirements: z.string().optional(),
});

export const generateScheduleSchema = z.object({
  preferences: aiGenerationPreferencesSchema.optional(),
});

// Session validation
export const sessionTypeSchema = z.enum([
  "circle",
  "talk",
  "break",
  "meal",
  "ritual",
  "free",
]);

export const createSessionSchema = z.object({
  dayPlanId: z.string(),
  title: z.string().min(1).max(200),
  sessionType: sessionTypeSchema,
  startTimeLocal: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTimeLocal: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  facilitatorName: z.string().optional(),
  metaJson: z.record(z.any()).optional(),
});

// Logistics validation
export const logisticsItemTypeSchema = z.enum([
  "accommodation",
  "transport",
  "meal",
  "materials",
  "other",
]);

export const createLogisticsItemSchema = z.object({
  blueprintId: z.string(),
  itemType: logisticsItemTypeSchema,
  descriptionMarkdown: z.string().min(1),
  costEstimate: z.number().nonnegative().optional(),
  metaJson: z.record(z.any()).optional(),
});

// Type exports
export type CreateBlueprintInput = z.infer<typeof createBlueprintSchema>;
export type UpdateBlueprintInput = z.infer<typeof updateBlueprintSchema>;
export type GenerateScheduleInput = z.infer<typeof generateScheduleSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CreateLogisticsItemInput = z.infer<typeof createLogisticsItemSchema>;
