# Gathered — event space marketplace (prototype)

A working prototype of a single-vendor event space marketplace: browse spaces, check
live calendar availability, book instantly, and talk to an AI assistant that can
search, check availability, and complete a booking in conversation.

This is a **demo/prototype**, built to be a realistic starting point — not a
production system. See [Limitations & going to production](#limitations--going-to-production)
before using it for anything real.

## Features

- **Public site**: browse/search/filter spaces by city, guest capacity, and price;
  space detail pages with photo gallery, amenities, and a live availability calendar.
- **Booking engine**: time-slot booking with real conflict detection (no double-booking),
  minimum-hours and capacity enforcement, and live price calculation.
- **AI chatbot**: a floating assistant on every page that can search spaces, answer
  questions about a specific space, check real-time availability, and complete a full
  booking through conversation — or log an inquiry for the team if it can't help.
  Works out of the box with no API key (rule-based engine) and **automatically
  upgrades to real Claude-powered tool-calling** if you set `ANTHROPIC_API_KEY`.
- **Admin dashboard**: password-protected panel to view/cancel bookings, read
  inquiries, and create/edit/unlist spaces.

## Getting started

```bash
npm install
npm run seed      # populates the local database with 6 demo spaces
npm run dev        # http://localhost:3000
```

Copy `.env.example` to `.env.local` to customize the admin password or add a real
Anthropic API key:

```bash
cp .env.example .env.local
```

Admin panel: go to `/admin`, password is `admin123` by default (set `ADMIN_PASSWORD`
in `.env.local` to change it).

To wipe and reseed the database: `npm run db:reset`.

## Upgrading the chatbot to real Claude

The chatbot ships with a dependency-free, rule-based engine (date/time parsing,
intent detection, slot-filling) so it works immediately with zero setup. To upgrade
it to genuine Claude-powered tool-calling (better language understanding, more
natural conversation), add to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
# optional, defaults to claude-sonnet-4-5 — check
# https://docs.claude.com/en/docs/about-claude/models for current model IDs
ANTHROPIC_MODEL=claude-sonnet-4-5
```

`src/app/api/chat/route.ts` checks for this key on every request and routes to
`src/lib/chatbot/claude.ts` (Claude + tool use) instead of `src/lib/chatbot/rules.ts`
automatically — no other code changes needed. Both engines call the exact same
booking/availability functions in `src/lib/chatbot/tools.ts`, so behavior is
consistent either way.

## Architecture

- **Framework**: Next.js 16 (App Router, Turbopack). Note: Next 16 renamed
  `middleware.ts` to `proxy.ts` — that's `src/proxy.ts` here, guarding `/admin/*`.
- **Database**: Node's built-in `node:sqlite` (zero native dependencies, no
  download/build step) writing to a file at `data/venue.db`. This is intentionally
  simple for a prototype — see limitations below for swapping to a real database.
- **Styling**: Tailwind CSS v4, a small warm neutral design system defined in
  `src/app/globals.css`.
- **No ORM**: `src/lib/{spaces,bookings,inquiries}.ts` are thin, explicit data-access
  modules over raw SQL. Easy to read, easy to swap.
- **Chatbot**: `src/lib/chatbot/tools.ts` holds the actual logic (search, availability,
  booking, inquiry capture) shared by both the rule engine (`rules.ts` +
  `parsing.ts`) and the Claude tool-use engine (`claude.ts`).

```
src/
  app/
    page.tsx                  # homepage: search + listing grid
    spaces/[slug]/page.tsx    # space detail + booking panel
    inquire/page.tsx          # contact form
    admin/                    # password-protected dashboard
    api/                      # REST endpoints (spaces, bookings, availability,
                               #   chat, inquiries, admin/*)
  components/                 # UI (SpaceCard, BookingPanel, ChatWidget, admin/*)
  lib/
    db.ts                     # node:sqlite connection + schema
    spaces.ts, bookings.ts, inquiries.ts   # data access
    availability.ts           # overlap/slot-finding logic (pure functions)
    auth.ts                   # admin session cookie signing
    chatbot/                  # tools.ts, rules.ts, parsing.ts, claude.ts
  proxy.ts                    # protects /admin and /api/admin/*
scripts/seed.ts                # demo data
```

## Limitations & going to production

This was deliberately built fast and scoped as a **single-vendor prototype/demo**,
per the brief. Before using it for anything real, you'd want to address:

- **No real payments.** Bookings are recorded as "confirmed" with no deposit or
  charge taken. Add Stripe (or similar) and only confirm a booking after payment
  succeeds — ideally with a short-lived hold on the slot while checkout is in progress.
- **Single vendor only.** There's one admin login and no concept of separate venue
  owners. A true marketplace (independent space owners managing their own listings,
  calendars, and payouts) needs vendor accounts, an approval flow, and split payments
  — a materially bigger build.
- **SQLite + `node:sqlite` is a prototype choice.** It's dependency-free and perfect
  for getting started, but it's a single file on one machine (no concurrent
  multi-instance deployment) and the module is still marked experimental by Node.
  Swapping `src/lib/db.ts` for Postgres (e.g. via `postgres.js` or Drizzle) is a
  contained change — the rest of the app only calls the functions in
  `spaces.ts`/`bookings.ts`/`inquiries.ts`.
- **Admin auth is demo-grade.** One shared password via an env var, no user
  accounts, no audit log, no rate-limiting on login attempts.
- **No transactional email.** Booking confirmations are shown on-screen only; add an
  email provider (Resend, Postmark, etc.) to actually notify guests and the venue.
- **Chatbot date/time parsing (rule-based engine) is intentionally conservative** —
  it handles common phrasing well and always reads back what it understood so
  mistakes are visible, but it's not a full NLU system. The Claude-powered engine
  (once you add an API key) handles ambiguous phrasing far better.
- **Photos are placeholder images** (picsum.photos) — swap in real listing photos
  before launch, and consider image upload in the admin panel rather than pasting URLs.
- **Timezones aren't handled explicitly** — dates/times are treated as the venue's
  local wall-clock time throughout; fine for a single city, but would need real
  timezone handling for multiple regions.

None of this is hard to build on top of — the booking/availability logic, the
chatbot tool layer, and the data access modules are all written to be extended
rather than rewritten.
