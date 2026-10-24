import { notFound } from "next/navigation";
import { getSpaceBySlug } from "@/lib/spaces";
import PhotoGallery from "@/components/PhotoGallery";
import BookingPanel from "@/components/BookingPanel";

export const dynamic = "force-dynamic";

export default async function SpacePage(props: PageProps<"/spaces/[slug]">) {
  const { slug } = await props.params;
  const space = await getSpaceBySlug(slug);
  if (!space || !space.isActive) notFound();

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PhotoGallery photos={space.photos} alt={space.name} />

          <div className="mt-6">
            <h1 className="text-2xl font-semibold tracking-tight">{space.name}</h1>
            <p className="mt-1 text-[var(--muted)]">
              {space.address}, {space.city}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
              <span className="badge">Up to {space.capacity} guests</span>
              <span>${space.pricePerHour}/hour</span>
              <span>· {space.minHours}h minimum</span>
              <span>· ${space.cleaningFee} cleaning fee</span>
              <span>
                · Open {space.openTime}–{space.closeTime}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold">About this space</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-[var(--foreground)]">
              {space.description}
            </p>
          </div>

          <div className="mt-6">
            <h2 className="font-semibold">Amenities</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {space.amenities.map((a) => (
                <span key={a} className="badge">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <BookingPanel
              space={{
                id: space.id,
                name: space.name,
                pricePerHour: space.pricePerHour,
                cleaningFee: space.cleaningFee,
                minHours: space.minHours,
                capacity: space.capacity,
                openTime: space.openTime,
                closeTime: space.closeTime,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
