"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Cancel this booking?")) return;
        setBusy(true);
        await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: "POST" });
        setBusy(false);
        router.refresh();
      }}
    >
      Cancel
    </button>
  );
}
