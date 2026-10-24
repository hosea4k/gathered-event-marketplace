import { listInquiriesForAdmin } from "@/lib/inquiries";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await listInquiriesForAdmin();

  return (
    <div>
      <h1 className="text-xl font-semibold">Inquiries</h1>
      <div className="mt-4 space-y-3">
        {inquiries.length === 0 && <p className="text-[var(--muted)]">No inquiries yet.</p>}
        {inquiries.map((i) => (
          <div key={i.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-[var(--muted)]">{new Date(i.createdAt).toLocaleString()}</p>
            </div>
            <p className="text-sm text-[var(--muted)]">{i.email}</p>
            <p className="mt-2 whitespace-pre-line text-sm">{i.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
