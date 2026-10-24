import Link from "next/link";
import LogoutButton from "@/components/admin/LogoutButton";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href="/admin" className="hover:text-[var(--accent)]">
            Bookings
          </Link>
          <Link href="/admin/spaces" className="hover:text-[var(--accent)]">
            Spaces
          </Link>
          <Link href="/admin/inquiries" className="hover:text-[var(--accent)]">
            Inquiries
          </Link>
        </nav>
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
