import { listAllBookingsForAdmin } from "@/lib/bookings";
import CancelBookingButton from "@/components/admin/CancelBookingButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const bookings = await listAllBookingsForAdmin();
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const upcoming = confirmed.filter((b) => b.eventDate >= todayISO());
  const revenue = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div>
      <h1 className="text-xl font-semibold">Bookings</h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Stat label="Upcoming" value={String(upcoming.length)} />
        <Stat label="Total confirmed" value={String(confirmed.length)} />
        <Stat label="Total value" value={`$${revenue.toLocaleString()}`} />
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] text-left text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3">Space</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-b border-[var(--border)] last:border-0">
                <td className="px-4 py-3 font-medium">{b.spaceName}</td>
                <td className="px-4 py-3">{b.eventDate}</td>
                <td className="px-4 py-3">
                  {b.startTime}–{b.endTime}
                </td>
                <td className="px-4 py-3">{b.guestCount}</td>
                <td className="px-4 py-3">
                  <div>{b.customerName}</div>
                  <div className="text-xs text-[var(--muted)]">{b.customerEmail}</div>
                </td>
                <td className="px-4 py-3 capitalize text-[var(--muted)]">{b.source}</td>
                <td className="px-4 py-3">${b.totalPrice}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      b.status === "confirmed" ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {b.status === "confirmed" && <CancelBookingButton bookingId={b.id} />}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[var(--muted)]">
                  No bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
