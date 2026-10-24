export default function SearchFilters({
  defaultValues,
}: {
  defaultValues: { query?: string; city?: string; minCapacity?: string; maxPrice?: string };
}) {
  return (
    <form
      action="/"
      method="GET"
      className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:gap-3"
    >
      <div className="flex-1">
        <label className="label" htmlFor="query">
          Search
        </label>
        <input
          id="query"
          name="query"
          type="text"
          placeholder="Name, amenity, vibe…"
          defaultValue={defaultValues.query}
          className="input"
        />
      </div>
      <div className="sm:w-40">
        <label className="label" htmlFor="city">
          City
        </label>
        <input
          id="city"
          name="city"
          type="text"
          placeholder="Any city"
          defaultValue={defaultValues.city}
          className="input"
        />
      </div>
      <div className="sm:w-36">
        <label className="label" htmlFor="minCapacity">
          Guests (min)
        </label>
        <input
          id="minCapacity"
          name="minCapacity"
          type="number"
          min={0}
          placeholder="Any"
          defaultValue={defaultValues.minCapacity}
          className="input"
        />
      </div>
      <div className="sm:w-36">
        <label className="label" htmlFor="maxPrice">
          Max $/hr
        </label>
        <input
          id="maxPrice"
          name="maxPrice"
          type="number"
          min={0}
          placeholder="Any"
          defaultValue={defaultValues.maxPrice}
          className="input"
        />
      </div>
      <button type="submit" className="btn-primary h-[42px] sm:w-32">
        Search
      </button>
    </form>
  );
}
