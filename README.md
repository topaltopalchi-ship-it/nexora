# NEXORA AI

**The AI Agent Network Connecting Human Needs to Real-World Resources.**

A multilingual, AI-assisted coordination platform connecting verified human needs with real-world resources in Dubai.

## Product decisions
- Platforms: responsive web + mobile apps (native mobile is a follow-on client)
- Pilot: Dubai, UAE
- Languages: English, Arabic, Persian
- Brand: NEXORA AI

## MVP
1. Food Rescue: provider listings, reservation, collection/delivery confirmation.
2. Healthcare Access: referrals to verified providers; no AI diagnosis or treatment decisions.
3. Safe Support & Housing: referrals only to verified organizations/hosts, with human review before placement.

Medication transfers and autonomous crisis response are not enabled in the MVP. Medication access must route through licensed pharmacies/providers. Suicide-crisis response requires trained, staffed local partners and emergency protocols before activation.

## Architecture
- Next.js responsive web client
- Supabase Auth + PostgreSQL with Row Level Security
- Server-side/Edge Functions for privileged workflows
- Trust-and-safety controls, human review, and audit events
- AI agents receive scoped tools, never unrestricted database access

## Local development
Prerequisites: Node.js 22+, npm.

    npm install
    cp .env.example .env.local
    npm run dev

Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY after the dedicated NEXORA Supabase project is provisioned. Never put a service-role/secret key in browser variables.

Database migrations: `supabase/migrations/` (apply all files in filename order to a fresh dedicated project)

## Current implementation status
- English, Persian, and Arabic landing page, authentication, and dashboard interfaces.
- Supabase email/password sign-up and sign-in; new accounts store their chosen language and account purpose.
- Authenticated users can submit support requests and resources for review.
- Trusted reviewers have a multilingual review console at `/review`, backed by a database allowlist, a permission-checked decision function, and an audit log.
- A read-only suggestion engine recommends up to 10 verified resources for a user's latest open need when category and city match; it does not create matches, reserve resources, or allocate support automatically.
- Row Level Security is enabled on all nine public tables; personal requests remain private and providers cannot self-verify resources.
- The dedicated Supabase project is provisioned and the live schema, policies, and migration history have been checked.
- The production web host, Auth redirect domain/email delivery, and first trusted reviewer still need configuration.
- AI matching and privileged server workflows remain future work; current suggestions are deterministic and transparent.

For a fresh Supabase project, apply all migration files in filename order. The linked NEXORA Supabase project has already been provisioned. Register the first reviewer account, then grant reviewer status using the owner-only SQL in the setup guide. See [Supabase setup and launch checklist](docs/SUPABASE_SETUP.md) before deploying.
