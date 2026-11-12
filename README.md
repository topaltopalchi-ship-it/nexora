# NEXORA AI

**The AI Agent Network Connecting Human Needs to Real-World Resources.**

A multilingual, AI-assisted city marketplace connecting people with real stores, real sellers and real products across Tabriz, Iran.

## Product decisions
- Platforms: responsive web + mobile apps (native mobile is a follow-on client)
- Pilot city: Tabriz, Iran
- Languages: English, Arabic, Persian
- Brand: NEXORA AI

## MVP
1. Virtual Tabriz Marketplace: city map, neighborhoods, stores, products and seller voice conversations.\n2. Food Rescue: provider listings, reservation, collection/delivery confirmation.
3. Healthcare Access: referrals to verified providers; no AI diagnosis or treatment decisions.
4. Safe Support & Housing: referrals only to verified organizations/hosts, with human review before placement.

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

## Status
Foundation commit: product scope, security boundaries, and initial database migration. This repository is not yet connected to a provisioned NEXORA backend or deployed hosting environment.
\n\n## Virtual Tabriz Marketplace\n\nThe first commerce experience lives at `/marketplace`. It is designed as the foundation for a city-wide virtual shopping layer: neighborhoods and shopping districts, participating stores, product discovery, seller voice contact, cart/checkout and delivery tracking.\n\nThe current UI uses representative Tabriz districts as product placeholders. Real businesses, coordinates, inventory, prices and delivery providers should be connected through the production database and merchant onboarding flow.\n