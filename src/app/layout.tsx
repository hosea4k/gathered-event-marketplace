import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

// Deliberately not using next/font/google here: it fetches from
// fonts.googleapis.com at build time, which fails in network-restricted
// environments (this sandbox included). A system font stack (set in
// globals.css) looks native on every platform and has zero network risk.

export const metadata: Metadata = {
  title: "Gathered — find and book the perfect event space",
  description:
    "Browse event spaces, check live availability, and book instantly — with an AI assistant to help you find the right fit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-xl font-semibold tracking-tight">Gathered</span>
              <span className="hidden text-xs text-[var(--muted)] sm:inline">
                event spaces
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="btn-ghost px-3">
                Browse spaces
              </Link>
              <Link href="/inquire" className="btn-ghost px-3">
                Contact
              </Link>
              <Link href="/admin" className="btn-secondary px-3 py-2">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-[var(--muted)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} Gathered. Demo marketplace — not a real booking service.</p>
              <div className="flex gap-4">
                <Link href="/" className="hover:text-[var(--accent)]">
                  Browse spaces
                </Link>
                <Link href="/inquire" className="hover:text-[var(--accent)]">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>

        <ChatWidget />
      </body>
    </html>
  );
}
