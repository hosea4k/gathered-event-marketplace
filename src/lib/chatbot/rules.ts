import { listSpaces } from "@/lib/spaces";
import type { Space } from "@/lib/types";
import type { ChatMessage, ChatState } from "./types";
import {
  toolSearchSpaces,
  toolGetSpaceDetails,
  toolCheckAvailability,
  toolCreateBooking,
  toolCaptureInquiry,
  addHours,
} from "./tools";
import {
  parseDate,
  parseSingleTime,
  parseTimeRange,
  parseDurationHours,
  parseGuestCount,
  parseEmail,
  parsePhone,
  isAffirmative,
  isNegative,
} from "./parsing";

/**
 * Deterministic fallback chat engine — no external API calls, so it works
 * with zero configuration. It handles space search, FAQ, availability
 * checks, and a full slot-filling booking flow. Upgrades automatically to
 * the real Claude-powered engine (see claude.ts) once ANTHROPIC_API_KEY is set.
 */

function spaceKeyword(name: string): string {
  const stop = new Set(["the", "private", "hire", "room", "studio"]);
  const words = name.replace(/[()]/g, "").split(/\s+/).filter((w) => !stop.has(w.toLowerCase()));
  return words.find((w) => w.length >= 4) || words[0] || name;
}

function findMentionedSpace(text: string, spaces: Space[]): Space | null {
  const lower = text.toLowerCase();
  let best: Space | null = null;
  for (const space of spaces) {
    const kw = spaceKeyword(space.name).toLowerCase();
    if (lower.includes(kw)) {
      if (!best || kw.length > spaceKeyword(best.name).length) best = space;
    }
  }
  return best;
}

const FAQ: { pattern: RegExp; answer: string }[] = [
  {
    pattern: /\b(deposit|pay|payment|credit card)\b/,
    answer:
      "This is a demo marketplace, so no real payment is taken — confirming a booking here just reserves the slot. A production version would collect a deposit at checkout.",
  },
  {
    pattern: /\b(cancel|refund|reschedul)/,
    answer:
      "Cancellations aren't self-serve in this demo yet — reach out via the Contact page with your confirmation number and the venue admin can cancel or reschedule it from the dashboard.",
  },
  {
    pattern: /\b(minimum|min hours|how long)\b/,
    answer:
      "Minimum booking length depends on the space — ask me about a specific one (e.g. \"what's the minimum for Ironwood Studio?\") and I'll check.",
  },
];

export async function runRuleEngine(
  messages: ChatMessage[],
  state: ChatState
): Promise<{ reply: string; state: ChatState }> {
  const last = messages[messages.length - 1]?.content ?? "";
  const lower = last.toLowerCase();
  const allSpaces = await listSpaces({});

  if (/\b(cancel|never mind|start over|restart)\b/.test(lower) && state.awaiting) {
    return {
      reply: "No problem, I've cleared that booking request. What else can I help with?",
      state: {},
    };
  }

  if (state.awaiting) {
    return continueBooking(last, state, allSpaces);
  }

  if (/^\s*(hi|hello|hey|yo|good (morning|afternoon|evening))\b/.test(lower)) {
    return {
      reply:
        "Hey! I can help you find an event space, check availability, or book one on the spot. What are you working with — a shoot, a showcase, a launch, something else?",
      state,
    };
  }

  for (const faq of FAQ) {
    if (faq.pattern.test(lower)) return { reply: faq.answer, state };
  }

  const mentionedSpace = findMentionedSpace(last, allSpaces);
  const date = parseDate(last);
  const wantsAvailability = /\b(available|availability|free|open)\b/.test(lower);
  const wantsBooking = /\b(book|reserve|hold|schedule)\b/.test(lower);

  if (mentionedSpace && (wantsAvailability || date) && !wantsBooking) {
    if (!date) {
      return {
        reply: `What date would you like to check for ${mentionedSpace.name}?`,
        state: { spaceName: mentionedSpace.name },
      };
    }
    const result = await toolCheckAvailability({
      spaceName: mentionedSpace.name,
      date: date ?? "",
    });
    return { reply: formatAvailability(result), state };
  }

  if (wantsBooking) {
    const next: ChatState = { intent: "booking" };
    if (mentionedSpace) next.spaceName = mentionedSpace.name;
    if (date) next.eventDate = date;

    const range = parseTimeRange(last);
    if (range) {
      next.startTime = range[0];
      next.endTime = range[1];
    } else {
      const single = parseSingleTime(last);
      const duration = parseDurationHours(last);
      if (single) next.startTime = single;
      if (duration) next.durationHours = duration;
      if (single && duration) next.endTime = addHours(single, duration);
    }
    const guests = parseGuestCount(last);
    if (guests) next.guestCount = guests;

    return advanceBooking(next, allSpaces);
  }

  if (mentionedSpace) {
    const details = await toolGetSpaceDetails({ spaceName: mentionedSpace.name });
    return { reply: formatSpaceDetails(details), state };
  }

  const looksLikeSearch =
    /\b(space|venue|room|studio|loft|pavilion|rooftop|warehouse|looking for|show me|options|recommend)\b/.test(
      lower
    );
  if (looksLikeSearch) {
    const guests = parseGuestCount(last);
    const priceMatch = lower.match(/\$?(\d{2,4})\s*(per hour|\/hr|\/hour|budget)?/);
    const maxPrice = priceMatch && /budget|\/hr|\/hour|per hour|under|below/.test(lower) ? Number(priceMatch[1]) : undefined;
    const cityMatch = lower.match(/\bin ([a-z\s]+?)(?:[.,]|$)/);

    const result = await toolSearchSpaces({
      minCapacity: guests ?? undefined,
      maxPrice,
      city: cityMatch ? cityMatch[1].trim() : undefined,
    });
    return { reply: formatSearchResults(result), state };
  }

  return {
    reply:
      "I can help you search spaces, check availability, or book one. Try something like \"show me spaces for 50 guests\" or \"is Ironwood Studio free on Dec 5?\" — or share your name and email and I'll pass this along to the team.",
    state: { pendingInquiryMessage: last, awaiting: "inquiry_contact" },
  };
}

async function advanceBooking(
  state: ChatState,
  allSpaces: Space[]
): Promise<{ reply: string; state: ChatState }> {
  if (!state.spaceName) return { reply: "Which space would you like to book?", state: { ...state, awaiting: "space" as const } };
  if (!findMentionedSpace(state.spaceName, allSpaces)) {
    return {
      reply: `I couldn't find a space called "${state.spaceName}". Which space did you mean?`,
      state: { ...state, spaceName: undefined, awaiting: "space" as const },
    };
  }
  if (!state.eventDate) return { reply: `Got it, ${state.spaceName}. What date?`, state: { ...state, awaiting: "date" as const } };
  if (!state.startTime || !state.endTime) {
    return {
      reply: `What time on ${state.eventDate}? (e.g. "6pm to 10pm")`,
      state: { ...state, awaiting: "time" as const },
    };
  }
  if (!state.guestCount) return { reply: "How many guests?", state: { ...state, awaiting: "guests" as const } };
  if (!state.customerName) return { reply: "What name should the booking be under?", state: { ...state, awaiting: "name" as const } };
  if (!state.customerEmail) return { reply: "And what's the best email for the confirmation?", state: { ...state, awaiting: "email" as const } };

  const avail = await toolCheckAvailability({
    spaceName: state.spaceName,
    date: state.eventDate,
    startTime: state.startTime,
    durationHours: (timeToHours(state.endTime) - timeToHours(state.startTime)) || undefined,
  });
  if (!avail.available) {
    return {
      reply: `Unfortunately that slot isn't available: ${avail.reason} Want to try a different time?`,
      state: { ...state, startTime: undefined, endTime: undefined, durationHours: undefined, awaiting: "time" as const },
    };
  }

  return {
    reply: `Here's what I have — ${state.spaceName} on ${state.eventDate}, ${state.startTime}–${state.endTime}, ${state.guestCount} guests, under ${state.customerName} (${state.customerEmail}). Shall I confirm it?`,
    state: { ...state, awaiting: "confirm" as const },
  };
}

async function continueBooking(
  text: string,
  state: ChatState,
  allSpaces: Space[]
): Promise<{ reply: string; state: ChatState }> {
  const next: ChatState = { ...state };

  switch (state.awaiting) {
    case "space": {
      const match = findMentionedSpace(text, allSpaces) || allSpaces.find((s) => s.name.toLowerCase() === text.trim().toLowerCase());
      if (!match) return { reply: `I still couldn't match that to a listed space. Could you give me the exact name?`, state };
      next.spaceName = match.name;
      next.awaiting = undefined;
      return advanceBooking(next, allSpaces);
    }
    case "date": {
      const date = parseDate(text);
      if (!date) return { reply: `I couldn't parse that date — try something like "December 5" or "2026-12-05".`, state };
      next.eventDate = date;
      next.awaiting = undefined;
      return advanceBooking(next, allSpaces);
    }
    case "time": {
      const range = parseTimeRange(text);
      if (range) {
        next.startTime = range[0];
        next.endTime = range[1];
      } else {
        const single = parseSingleTime(text);
        const duration = parseDurationHours(text);
        if (single && duration) {
          next.startTime = single;
          next.endTime = addHours(single, duration);
        } else if (single && state.startTime && !state.endTime) {
          next.endTime = single;
        } else if (single) {
          next.startTime = single;
          return { reply: `And what time does it end, or how many hours?`, state: next };
        } else {
          return { reply: `I couldn't parse a time range — try "6pm to 10pm" or "6pm for 4 hours".`, state };
        }
      }
      next.awaiting = undefined;
      return advanceBooking(next, allSpaces);
    }
    case "guests": {
      const guests = parseGuestCount(text) ?? Number(text.replace(/\D/g, ""));
      if (!guests || Number.isNaN(guests)) return { reply: `How many guests, roughly? Just the number is fine.`, state };
      next.guestCount = guests;
      next.awaiting = undefined;
      return advanceBooking(next, allSpaces);
    }
    case "name": {
      const name = text.trim();
      if (name.length < 2) return { reply: `What name should I put the booking under?`, state };
      next.customerName = name;
      next.awaiting = undefined;
      return advanceBooking(next, allSpaces);
    }
    case "email": {
      const email = parseEmail(text);
      if (!email) return { reply: `That doesn't look like a valid email — could you double check it?`, state };
      next.customerEmail = email;
      const phone = parsePhone(text);
      if (phone) next.customerPhone = phone;
      next.awaiting = undefined;
      return advanceBooking(next, allSpaces);
    }
    case "inquiry_contact": {
      const email = parseEmail(text);
      if (!email) {
        return { reply: `Could you include an email address so the team can get back to you?`, state };
      }
      const name = text.replace(email, "").replace(/[,-]/g, " ").trim() || "Website visitor";
      await toolCaptureInquiry({
        name,
        email,
        message: state.pendingInquiryMessage ?? text,
      });
      return {
        reply: `Thanks, ${name} — I've logged that for the team and they'll follow up at ${email}. Anything else I can help with in the meantime?`,
        state: {},
      };
    }
    case "confirm": {
      if (isAffirmative(text)) {
        if (!next.spaceName || !next.eventDate || !next.startTime || !next.endTime || !next.guestCount || !next.customerName || !next.customerEmail) {
          return { reply: `Something's missing — let's start the booking over. Which space would you like?`, state: { intent: "booking", awaiting: "space" } };
        }
        const result = await toolCreateBooking({
          spaceName: next.spaceName,
          eventDate: next.eventDate,
          startTime: next.startTime,
          endTime: next.endTime,
          guestCount: next.guestCount,
          customerName: next.customerName,
          customerEmail: next.customerEmail,
          customerPhone: next.customerPhone,
        });
        if (!result.success) {
          return {
            reply: `Hmm, that didn't go through: ${result.reason} Want to try a different time?`,
            state: { ...next, startTime: undefined, endTime: undefined, awaiting: "time" },
          };
        }
        return {
          reply: `You're booked! Confirmation #${result.confirmationId} — ${result.spaceName} on ${result.eventDate}, ${result.startTime}–${result.endTime}. Total: $${result.totalPrice}. A confirmation would normally be emailed to you — anything else I can help with?`,
          state: {},
        };
      }
      if (isNegative(text)) {
        return {
          reply: `No problem — what would you like to change? You can just tell me the new space, date, time, or guest count.`,
          state: { intent: "booking", awaiting: "space" },
        };
      }
      return { reply: `Sorry, just to confirm — should I go ahead and book it? (yes/no)`, state };
    }
    default:
      return { reply: `Let's try that again — what would you like to do?`, state: {} };
  }
}

function timeToHours(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + m / 60;
}

function formatAvailability(result: Awaited<ReturnType<typeof toolCheckAvailability>>): string {
  if (!result.found) return result.message ?? "I couldn't find that space.";
  if ("available" in result) {
    return result.available
      ? `Yes — ${result.spaceName} is open ${result.requestedStart}–${result.requestedEnd} on ${result.date}. Want me to book it?`
      : `No — ${result.reason} Want me to suggest open times instead?`;
  }
  const slots = result.openSlotsForDuration ?? [];
  if (slots.length === 0) {
    return `${result.spaceName} doesn't have a ${result.durationHoursChecked}-hour opening on ${result.date} — it's booked ${result.existingBookings
      ?.map((b) => `${b.start}–${b.end}`)
      .join(", ")}. Want to try another date?`;
  }
  return `${result.spaceName} has these ${result.durationHoursChecked}-hour start times open on ${result.date}: ${slots.join(", ")}. Want me to book one?`;
}

function formatSpaceDetails(details: Awaited<ReturnType<typeof toolGetSpaceDetails>>): string {
  if (!details.found) return "I couldn't find that space.";
  const s = details.space;
  return `${s.name} — ${s.tagline}\n${s.city} · up to ${s.capacity} guests · $${s.pricePerHour}/hr (min ${s.minHours}h, +$${s.cleaningFee} cleaning fee)\nAmenities: ${s.amenities.join(", ")}\nOpen ${s.openTime}–${s.closeTime}.\n\nWant to check availability or book it?`;
}

function formatSearchResults(result: Awaited<ReturnType<typeof toolSearchSpaces>>): string {
  if (result.count === 0) return "I couldn't find any spaces matching that — want to widen the budget or guest count?";
  const top = result.spaces.slice(0, 4);
  const lines = top.map((s) => `• ${s.name} (${s.city}) — up to ${s.capacity} guests, $${s.pricePerHour}/hr`);
  return `Here's what I found:\n${lines.join("\n")}\n\nWant details on one, or should I check availability?`;
}
