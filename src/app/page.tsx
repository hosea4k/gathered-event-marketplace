import { listSpaces } from "@/lib/spaces";
import SpaceCard from "@/components/SpaceCard";
import SearchFilters from "@/components/SearchFilters";

// Reads Postgres directly on every request; without this, Next.js
// would be free to bake the listing into the build-time static shell.
export const dynamic = "force-dynamic";

export default async function Home(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const query = typeof sp.query === "string" ? sp.query : undefined;
  const city = typeof sp.city === "string" ? sp.city : undefined;
  const minCapacity = typeof sp.minCapacity === "string" ? Number(sp.minCapacity) : undefined;
  const maxPrice = typeof sp.maxPrice === "string" ? Number(sp.maxPrice) : undefined;

  const spaces = await listSpaces({
    query,
    city,
    minCapacity: Number.isFinite(minCapacity) ? minCapacity : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
  });

  return (
    <div>
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Find the right space for what you&apos;re building
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Soundstages, lofts, pavilions, and rooms built for shoots, showcases, and
            launches. Check real-time availability and book in minutes — or just ask
            the chat assistant in the corner.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <SearchFilters
          defaultValues={{
            query,
            city,
            minCapacity: minCapacity ? String(minCapacity) : undefined,
            maxPrice: maxPrice ? String(maxPrice) : undefined,
          }}
        />
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {spaces.length} space{spaces.length === 1 ? "" : "s"} available
          </h2>
        </div>
        {spaces.length === 0 ? (
          <div className="card p-10 text-center text-[var(--muted)]">
            No spaces match those filters yet. Try widening your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
