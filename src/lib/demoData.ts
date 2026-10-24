/**
 * Shared demo event-space data — used by both scripts/seed.ts (for local/CI
 * seeding) and the one-time /api/admin/seed route (for seeding a live
 * deployment where only the app itself has database access, e.g. behind an
 * IP allowlist).
 */

function photoSet(seed: string, count: number) {
  return Array.from({ length: count }, (_, i) => `https://picsum.photos/seed/${seed}-${i}/1200/800`);
}

export const demoSpaces = [
  {
    name: "The Glasshouse Loft",
    tagline: "Light-filled industrial loft with skyline views",
    description:
      "A converted warehouse loft with floor-to-ceiling windows, exposed brick, and a private rooftop terrace. Popular for product launches, photo/video shoots, and upscale mixers. In-house AV and a freight elevator for easy load-in.",
    address: "88 Wharf Street",
    city: "Brisbane",
    capacity: 120,
    pricePerHour: 180,
    minHours: 3,
    cleaningFee: 150,
    amenities: ["Rooftop terrace", "In-house AV/sound", "Freight elevator", "Air conditioning", "On-site parking", "Catering kitchen"],
    photos: photoSet("glasshouse", 5),
    openTime: "08:00",
    closeTime: "23:00",
  },
  {
    name: "Ironwood Studio",
    tagline: "Blackout soundstage built for music video and film shoots",
    description:
      "A 400 sqm blackout soundstage with cyc wall, grid rigging, and isolated power for lighting rigs. Built for music videos, commercial shoots, and livestream production. Green room and wardrobe area included.",
    address: "14 Foundry Lane",
    city: "Brisbane",
    capacity: 60,
    pricePerHour: 220,
    minHours: 4,
    cleaningFee: 100,
    amenities: ["Cyc wall", "Grid rigging", "Isolated power", "Green room", "Loading dock", "Wi-Fi"],
    photos: photoSet("ironwood", 5),
    openTime: "07:00",
    closeTime: "23:59",
  },
  {
    name: "Harborline Pavilion",
    tagline: "Waterfront glass pavilion for weddings & galas",
    description:
      "An elegant glass-walled pavilion on the river with a private dock and landscaped gardens. Seats up to 220 for formal events. Preferred-vendor catering and full event coordination support available on request.",
    address: "3 Riverside Walk",
    city: "Brisbane",
    capacity: 220,
    pricePerHour: 350,
    minHours: 5,
    cleaningFee: 300,
    amenities: ["Private dock", "Garden terrace", "Dance floor", "Bridal suite", "Valet parking", "Built-in bar"],
    photos: photoSet("harborline", 5),
    openTime: "09:00",
    closeTime: "00:00",
  },
  {
    name: "The Tin Shed Sessions Room",
    tagline: "Intimate live-room for showcases, listening parties & podcasts",
    description:
      "A warm, acoustically treated live room for 20–50 guests. Ideal for album listening parties, acoustic showcases, podcast tapings, and small label events. Comes with a basic PA, mixing desk, and recording hookup.",
    address: "22 Logan Road",
    city: "Brisbane",
    capacity: 50,
    pricePerHour: 95,
    minHours: 2,
    cleaningFee: 50,
    amenities: ["PA system", "Recording hookup", "Acoustic treatment", "Lounge seating", "Street parking"],
    photos: photoSet("tinshed", 5),
    openTime: "10:00",
    closeTime: "23:00",
  },
  {
    name: "Meridian Rooftop Bar (Private Hire)",
    tagline: "Private rooftop bar hire with 360° city views",
    description:
      "Buy out our rooftop bar for private parties, label showcases, and brand activations. Full bar service, resident DJ booth, and heated cabanas for cooler nights. Minimum spend applies on top of the venue hire fee.",
    address: "501 Elizabeth Street",
    city: "Brisbane",
    capacity: 180,
    pricePerHour: 300,
    minHours: 4,
    cleaningFee: 200,
    amenities: ["Full bar service", "DJ booth", "Heated cabanas", "City views", "Coat check"],
    photos: photoSet("meridian", 5),
    openTime: "16:00",
    closeTime: "02:00",
  },
  {
    name: "Northside Collective Warehouse",
    tagline: "Raw warehouse space for pop-ups, markets & underground shows",
    description:
      "A flexible 600 sqm raw warehouse with roller-door access, polished concrete floors, and a modular lighting rig. Suited to pop-up shops, markets, underground shows, and large-format art installs.",
    address: "9 Depot Street",
    city: "Brisbane",
    capacity: 300,
    pricePerHour: 160,
    minHours: 4,
    cleaningFee: 220,
    amenities: ["Roller-door access", "Modular lighting rig", "Loading dock", "On-site security option", "Flexible floor plan"],
    photos: photoSet("northside", 5),
    openTime: "08:00",
    closeTime: "23:59",
  },
];

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 6)
  );
}
