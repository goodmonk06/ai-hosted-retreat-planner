import OpenAI from "openai";
import { AIScheduleRequest, AIScheduleResponse } from "./types";
import { SessionType } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert retreat planner specializing in transformative multi-day programs.
Your role is to design thoughtful, balanced schedules that support participant growth and well-being.

Key principles:
- Balance structured activities with free time
- Include proper meal times and breaks
- Vary session types (circles, talks, rituals, breaks, meals, free time)
- Build energy throughout the retreat with intentional pacing
- Allow for integration time after intense sessions
- Consider group size for different activities

Return your response as a valid JSON object matching this structure:
{
  "dayPlans": [
    {
      "dayIndex": 0,
      "theme": "Theme for the day",
      "notesMarkdown": "Notes about the day's focus",
      "sessions": [
        {
          "title": "Session title",
          "sessionType": "circle|talk|break|meal|ritual|free",
          "startTimeLocal": "HH:MM",
          "endTimeLocal": "HH:MM",
          "facilitatorName": "Optional facilitator name",
          "description": "Brief description",
          "metaJson": {}
        }
      ]
    }
  ]
}`;

export async function generateRetreatSchedule(
  request: AIScheduleRequest
): Promise<AIScheduleResponse> {
  const { daysCount, participantCount, preferences } = request;

  const userPrompt = `Create a ${daysCount}-day retreat schedule for approximately ${participantCount} participants.

Preferences:
${preferences?.innerWorkFocus ? `- Inner work focus: ${preferences.innerWorkFocus}/10` : ""}
${preferences?.socialFocus ? `- Social connection focus: ${preferences.socialFocus}/10` : ""}
${preferences?.physicalActivity ? `- Physical activity level: ${preferences.physicalActivity}/10` : ""}
${preferences?.customRequirements ? `- Custom requirements: ${preferences.customRequirements}` : ""}

Guidelines:
- Day 0 is arrival day (typically starts afternoon)
- Final day should include closing activities and departure
- Include morning practices, meals, teaching sessions, group work, and free time
- Ensure proper breaks between sessions
- Consider energy levels throughout each day
- Make the schedule realistic and achievable

Return a complete JSON response with all ${daysCount} days planned.`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from AI");
    }

    const parsed = JSON.parse(responseContent);

    // Validate and normalize the response
    return validateAndNormalizeSchedule(parsed);
  } catch (error) {
    console.error("Error generating schedule:", error);
    throw new Error(`Failed to generate schedule: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function validateAndNormalizeSchedule(parsed: any): AIScheduleResponse {
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
