import Anthropic from "@anthropic-ai/sdk";
import {
  toolSearchSpaces,
  toolGetSpaceDetails,
  toolCheckAvailability,
  toolCreateBooking,
  toolCaptureInquiry,
  ChatBookingError,
} from "./tools";
import type { ChatMessage } from "./types";

// Real AI path: used automatically when ANTHROPIC_API_KEY is set in the
// environment. Claude is given tools that read/write the same SQLite tables
// as the REST API, so anything it says about availability or bookings is
// grounded in real data rather than invented.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "search_spaces",
    description:
      "Search available event spaces by city, minimum guest capacity, max price per hour, or a free-text query. Call this whenever the guest describes what they're looking for.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string" },
        minCapacity: { type: "number" },
        maxPrice: { type: "number" },
        query: { type: "string", description: "free text, e.g. 'rooftop' or 'soundstage'" },
      },
    },
  },
  {
    name: "get_space_details",
    description: "Get full details (description, amenities, address, hours, fees) for one named space.",
    input_schema: {
      type: "object",
      properties: { spaceName: { type: "string" } },
      required: ["spaceName"],
    },
  },
  {
    name: "check_availability",
    description:
      "Check real-time availability for a space on a specific date (YYYY-MM-DD). Optionally pass startTime ('HH:MM', 24h) and durationHours to check one exact slot; otherwise returns open slots for the day.",
    input_schema: {
      type: "object",
      properties: {
        spaceName: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
        startTime: { type: "string", description: "HH:MM 24-hour time, optional" },
        durationHours: { type: "number" },
      },
      required: ["spaceName", "date"],
    },
  },
  {
    name: "create_booking",
    description:
      "Create a confirmed booking. Only call this after the guest has explicitly confirmed the space, date, time range, guest count, and given their name and email. Always check_availability first.",
    input_schema: {
      type: "object",
      properties: {
        spaceName: { type: "string" },
        eventDate: { type: "string", description: "YYYY-MM-DD" },
        startTime: { type: "string", description: "HH:MM 24-hour" },
        endTime: { type: "string", description: "HH:MM 24-hour" },
        guestCount: { type: "number" },
        customerName: { type: "string" },
        customerEmail: { type: "string" },
        customerPhone: { type: "string" },
        eventType: { type: "string" },
        notes: { type: "string" },
      },
      required: [
        "spaceName",
        "eventDate",
        "startTime",
        "endTime",
        "guestCount",
        "customerName",
        "customerEmail",
      ],
    },
  },
  {
    name: "capture_inquiry",
    description:
      "Log a general inquiry (question staff should follow up on, or interest that doesn't fit a direct booking) with the guest's name, email and message.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        message: { type: "string" },
        spaceName: { type: "string" },
      },
      required: ["name", "email", "message"],
    },
  },
];

async function runTool(name: string, input: unknown) {
  switch (name) {
    case "search_spaces":
      return toolSearchSpaces(input as Parameters<typeof toolSearchSpaces>[0]);
    case "get_space_details":
      return toolGetSpaceDetails(input as Parameters<typeof toolGetSpaceDetails>[0]);
    case "check_availability":
      return toolCheckAvailability(input as Parameters<typeof toolCheckAvailability>[0]);
    case "create_booking":
      try {
        return await toolCreateBooking(input as Parameters<typeof toolCreateBooking>[0]);
      } catch (err) {
        if (err instanceof ChatBookingError) return { success: false, reason: err.message };
        throw err;
      }
    case "capture_inquiry":
      return toolCaptureInquiry(input as Parameters<typeof toolCaptureInquiry>[0]);
    default:
      return { error: `Unknown tool ${name}` };
  }
}

const SYSTEM_PROMPT = `You are the booking assistant for Gathered, a marketplace of event spaces (studios, lofts, pavilions, rooftop venues). Today's date is ${new Date().toISOString().slice(0, 10)}.

Be concise, warm, and concrete. Always use the tools to look up real availability and space details rather than guessing — never invent prices, amenities, or open slots. Before creating a booking, read back the space, date, time range, guest count, and total so the guest can confirm. Only call create_booking once they've confirmed and you have their name and email. If a space or slot isn't available, offer the closest real alternative from search results. If the guest asks something you can't resolve with your tools, use capture_inquiry to log it for the team.`;

export async function runClaudeChat(messages: ChatMessage[]): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let turn = 0; turn < 6; turn++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: conversation,
    });

    if (response.stop_reason !== "tool_use") {
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
    }

    conversation.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === "tool_use") {
        const result = await runTool(block.name, block.input);
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
    }
    conversation.push({ role: "user", content: toolResults });
  }

  return "Sorry, I'm having trouble finishing that thought — could you try rephrasing, or I can take your details for the team to follow up?";
}
