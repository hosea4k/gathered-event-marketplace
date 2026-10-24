export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Opaque slot-filling state the rule-based engine round-trips with the client. */
export interface ChatState {
  intent?: "booking" | null;
  spaceName?: string;
  eventDate?: string;
  startTime?: string;
  durationHours?: number;
  endTime?: string;
  guestCount?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  eventType?: string;
  pendingInquiryMessage?: string;
  awaiting?:
    | "space"
    | "date"
    | "time"
    | "guests"
    | "name"
    | "email"
    | "confirm"
    | "inquiry_contact"
    | null;
}
