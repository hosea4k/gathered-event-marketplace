export interface Space {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  pricePerHour: number;
  minHours: number;
  cleaningFee: number;
  amenities: string[];
  photos: string[];
  openTime: string; // "HH:MM"
  closeTime: string; // "HH:MM"
  isActive: boolean;
  createdAt: string;
}

export type BookingStatus = "confirmed" | "cancelled";
export type BookingSource = "web" | "chatbot" | "admin";

export interface Booking {
  id: string;
  spaceId: string;
  eventDate: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  eventType: string | null;
  notes: string | null;
  totalPrice: number;
  status: BookingStatus;
  source: BookingSource;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  spaceId: string | null;
  name: string;
  email: string;
  message: string;
  status: "new" | "read";
  createdAt: string;
}

export interface SpaceFilters {
  city?: string;
  minCapacity?: number;
  maxPrice?: number;
  query?: string;
}

export interface CreateBookingInput {
  spaceId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  eventType?: string;
  notes?: string;
  source?: BookingSource;
}
