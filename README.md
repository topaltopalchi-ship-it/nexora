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

Initial schema: supabase/migrations/202611110001_initial_core.sql

## Current implementation status
- English, Persian, and Arabic landing page, authentication, and dashboard interfaces.
- Supabase email/password sign-up and sign-in; new accounts store their chosen language and account purpose.
- Authenticated users can submit support requests and resources for review.
- Trusted reviewers have a multilingual review console at `/review`, backed by a database allowlist, a permission-checked decision function, and an audit log.
- Row Level Security keeps personal requests private and prevents providers from self-verifying resources.
- Supabase provisioning and trusted reviewer/server workflows are still required before a public pilot.
- No production hosting or live AI matching engine is configured yet.

Apply all three migrations and provision trusted reviewers before testing the review console. See [Supabase setup and launch checklist](docs/SUPABASE_SETUP.md) before deploying.
