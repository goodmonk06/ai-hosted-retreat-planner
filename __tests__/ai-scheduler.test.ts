/**
 * Tests for AI Schedule Parser
 *
 * These tests ensure that the AI output parsing is robust and handles
 * various edge cases and validation scenarios.
 */

import { SessionType } from "@prisma/client";

// Mock validation function (extracted from ai-scheduler.ts for testing)
function validateAndNormalizeSchedule(parsed: any) {
  if (!parsed.dayPlans || !Array.isArray(parsed.dayPlans)) {
    throw new Error("Invalid response: missing dayPlans array");
  }

  const validSessionTypes = new Set<string>([
    "circle",
    "talk",
    "break",
    "meal",
    "ritual",
    "free",
  ]);

  const dayPlans = parsed.dayPlans.map((day: any) => {
    if (typeof day.dayIndex !== "number") {
      throw new Error(`Invalid dayIndex: ${day.dayIndex}`);
    }

    if (!day.sessions || !Array.isArray(day.sessions)) {
      throw new Error(`Day ${day.dayIndex} missing sessions array`);
    }

    const sessions = day.sessions.map((session: any) => {
      // Validate session type
      const sessionType = session.sessionType?.toLowerCase();
      if (!validSessionTypes.has(sessionType)) {
        throw new Error(`Invalid session type: ${session.sessionType}`);
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(session.startTimeLocal)) {
        throw new Error(`Invalid start time: ${session.startTimeLocal}`);
      }
      if (!timeRegex.test(session.endTimeLocal)) {
        throw new Error(`Invalid end time: ${session.endTimeLocal}`);
      }

      return {
        title: session.title || "Untitled Session",
        sessionType: sessionType as SessionType,
        startTimeLocal: session.startTimeLocal,
        endTimeLocal: session.endTimeLocal,
        facilitatorName: session.facilitatorName,
        description: session.description,
        metaJson: session.metaJson || {},
      };
    });

    return {
      dayIndex: day.dayIndex,
      theme: day.theme || `Day ${day.dayIndex + 1}`,
      notesMarkdown: day.notesMarkdown,
      sessions,
    };
  });

  return { dayPlans };
}

describe("AI Schedule Parser", () => {
  describe("validateAndNormalizeSchedule", () => {
    it("should parse valid AI output", () => {
      const validInput = {
        dayPlans: [
          {
            dayIndex: 0,
            theme: "Opening",
            sessions: [
              {
                title: "Welcome Circle",
                sessionType: "circle",
                startTimeLocal: "10:00",
                endTimeLocal: "11:30",
              },
              {
                title: "Lunch",
                sessionType: "meal",
                startTimeLocal: "12:00",
                endTimeLocal: "13:00",
              },
            ],
          },
        ],
      };

      const result = validateAndNormalizeSchedule(validInput);
      expect(result.dayPlans).toHaveLength(1);
      expect(result.dayPlans[0].sessions).toHaveLength(2);
      expect(result.dayPlans[0].sessions[0].sessionType).toBe("circle");
    });

    it("should throw error for missing dayPlans", () => {
      const invalidInput = {};
      expect(() => validateAndNormalizeSchedule(invalidInput)).toThrow(
        "Invalid response: missing dayPlans array"
      );
    });

    it("should throw error for invalid session type", () => {
      const invalidInput = {
        dayPlans: [
          {
            dayIndex: 0,
            sessions: [
              {
                title: "Test",
                sessionType: "invalid_type",
                startTimeLocal: "10:00",
                endTimeLocal: "11:00",
              },
            ],
          },
        ],
      };

      expect(() => validateAndNormalizeSchedule(invalidInput)).toThrow(
        "Invalid session type"
      );
    });

    it("should throw error for invalid time format", () => {
      const invalidInput = {
        dayPlans: [
          {
            dayIndex: 0,
            sessions: [
              {
                title: "Test",
                sessionType: "circle",
                startTimeLocal: "25:00", // Invalid hour
                endTimeLocal: "11:00",
              },
            ],
          },
        ],
      };

      expect(() => validateAndNormalizeSchedule(invalidInput)).toThrow(
        "Invalid start time"
      );
    });

    it("should handle missing optional fields", () => {
      const input = {
        dayPlans: [
          {
            dayIndex: 0,
            // theme is optional
            sessions: [
              {
                // title is required but has default
                sessionType: "free",
                startTimeLocal: "14:00",
                endTimeLocal: "16:00",
              },
            ],
          },
        ],
      };

      const result = validateAndNormalizeSchedule(input);
      expect(result.dayPlans[0].theme).toBe("Day 1");
      expect(result.dayPlans[0].sessions[0].title).toBe("Untitled Session");
    });

    it("should normalize session type case", () => {
      const input = {
        dayPlans: [
          {
            dayIndex: 0,
            sessions: [
              {
                title: "Test",
                sessionType: "CIRCLE", // Uppercase
                startTimeLocal: "10:00",
                endTimeLocal: "11:00",
              },
            ],
          },
        ],
      };

      const result = validateAndNormalizeSchedule(input);
      expect(result.dayPlans[0].sessions[0].sessionType).toBe("circle");
    });

    it("should handle multiple days", () => {
      const input = {
        dayPlans: [
          {
            dayIndex: 0,
            theme: "Day 1",
            sessions: [
              {
                title: "Session 1",
                sessionType: "talk",
                startTimeLocal: "09:00",
                endTimeLocal: "10:00",
              },
            ],
          },
          {
            dayIndex: 1,
            theme: "Day 2",
            sessions: [
              {
                title: "Session 2",
                sessionType: "ritual",
                startTimeLocal: "09:00",
                endTimeLocal: "10:00",
              },
            ],
          },
        ],
      };

      const result = validateAndNormalizeSchedule(input);
      expect(result.dayPlans).toHaveLength(2);
      expect(result.dayPlans[0].dayIndex).toBe(0);
      expect(result.dayPlans[1].dayIndex).toBe(1);
    });

    it("should validate time format strictly", () => {
      const testCases = [
        { time: "9:00", valid: false }, // Missing leading zero
        { time: "09:00", valid: true },
        { time: "23:59", valid: true },
        { time: "24:00", valid: false }, // Invalid hour
        { time: "12:60", valid: false }, // Invalid minute
        { time: "00:00", valid: true },
      ];

      testCases.forEach(({ time, valid }) => {
        const input = {
          dayPlans: [
            {
              dayIndex: 0,
              sessions: [
                {
                  title: "Test",
                  sessionType: "break",
                  startTimeLocal: time,
                  endTimeLocal: "12:00",
                },
              ],
            },
          ],
        };

        if (valid) {
          expect(() => validateAndNormalizeSchedule(input)).not.toThrow();
        } else {
          expect(() => validateAndNormalizeSchedule(input)).toThrow();
        }
      });
    });
  });
});
