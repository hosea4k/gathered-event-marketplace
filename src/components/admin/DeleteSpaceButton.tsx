"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteSpaceButton({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        if (!confirm("Unlist this space? It will stop appearing to guests, but past bookings are kept.")) return;
        setBusy(true);
        await fetch(`/api/admin/spaces/${spaceId}`, { method: "DELETE" });
        setBusy(false);
        router.refresh();
      }}
    >
      Unlist
    </button>
  );
}
