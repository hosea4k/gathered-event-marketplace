import Image from "next/image";
import Link from "next/link";
import type { Space } from "@/lib/types";

export default function SpaceCard({ space }: { space: Space }) {
  return (
    <Link
      href={`/spaces/${space.slug}`}
      className="card group block overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--accent-soft)]">
        {space.photos[0] && (
          <Image
            src={space.photos[0]}
            alt={space.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Up to {space.capacity} guests
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{space.name}</h3>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{space.city}</p>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{space.tagline}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-semibold">${space.pricePerHour}</span>
          <span className="text-sm text-[var(--muted)]">/ hour</span>
          <span className="text-xs text-[var(--muted)]">· {space.minHours}h min</span>
        </div>
      </div>
    </Link>
  );
}
