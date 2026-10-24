import Link from "next/link";
import { listAllSpacesForAdmin } from "@/lib/spaces";
import DeleteSpaceButton from "@/components/admin/DeleteSpaceButton";

export const dynamic = "force-dynamic";

export default async function AdminSpacesPage() {
  const spaces = await listAllSpacesForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Spaces</h1>
        <Link href="/admin/spaces/new" className="btn-primary px-4 py-2 text-sm">
          + Add space
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {spaces.map((s) => (
          <div key={s.id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-medium">
                {s.name}{" "}
                {!s.isActive && <span className="badge ml-2">Unlisted</span>}
              </p>
              <p className="text-sm text-[var(--muted)]">
                {s.city} · ${s.pricePerHour}/hr · up to {s.capacity} guests
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/spaces/${s.id}/edit`} className="text-xs font-medium hover:underline">
                Edit
              </Link>
              {s.isActive && <DeleteSpaceButton spaceId={s.id} />}
            </div>
          </div>
        ))}
        {spaces.length === 0 && <p className="text-[var(--muted)]">No spaces yet.</p>}
      </div>
    </div>
  );
}
