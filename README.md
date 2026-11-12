# NEXORA AI

**A trusted, multilingual social-assistance coordination network.**

NEXORA helps people in need find verified organizations and real-world support in Dubai. It coordinates requests, trusted resources, and human-reviewed referrals. It is not a marketplace, shopping app, or game.

## Product direction

- **Pilot location:** Dubai, United Arab Emirates
- **Platforms:** responsive web first; installable mobile PWA; native Android and iOS clients can follow
- **Languages:** English, Arabic, Persian (RTL supported)
- **Core promise:** help people reach appropriate, verified support with dignity, privacy, and human oversight

## MVP assistance pathways

1. **Food assistance:** discover verified food-support organizations and coordinate safe collection or delivery.
2. **Healthcare access:** connect people to licensed clinics, hospitals, and approved service providers. NEXORA does not diagnose, prescribe, or make treatment decisions.
3. **Safe support and housing:** refer people only to verified organizations and approved providers. Placement requires human review.
4. **General assistance:** route requests to an appropriate trusted organization when the need does not fit the above categories.

Emergency and crisis support must show locally validated emergency contacts and route to trained, staffed partners. NEXORA must not imply that an unstaffed app provides emergency response. Medication transfers, peer-to-peer medicine exchange, and autonomous crisis decisions are out of scope.

## Core user journeys

- A person creates an account or uses an approved low-friction intake route.
- They submit a need with category, area, urgency, and only the minimum necessary details.
- The system suggests relevant verified resources; it does not make eligibility or clinical decisions.
- An authorized human reviewer checks sensitive referrals and approves, rejects, or requests clarification.
- The person receives a clear status and safe next steps.
- Verified organizations maintain their service information and capacity through a controlled provider workflow.

## Trust, safety, and privacy

- Row Level Security protects personal requests and organization data.
- Collect the minimum personal data needed; never expose a person's identity or exact location in public resource listings.
- Resource verification and reviewer authorization are controlled by trusted administrators.
- AI may classify or summarize requests and explain resource relevance, but cannot approve placements, diagnose, prescribe, or autonomously handle emergencies.
- Sensitive actions require audit events and a human decision.
- Do not promise availability, delivery, housing, or clinical access until a provider confirms it.

## Architecture

- Next.js responsive web application
- Supabase Auth and PostgreSQL with Row Level Security
- Server-side/Edge Functions for privileged workflows
- Human-review queue, audit events, and verified-resource directory
- AI tools restricted to scoped, non-privileged operations

## Local development

Prerequisites: Node.js 22+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` after the dedicated NEXORA Supabase project is provisioned. Never expose a service-role or secret key in browser variables.

Initial schema: `supabase/migrations/202611110001_initial_core.sql`.

## Dubai pilot readiness checklist

- Confirm local NGO, food-bank, healthcare, shelter, and social-service partners.
- Validate service categories, referral protocols, safeguarding, consent, and escalation procedures with those partners.
- Review UAE privacy, health-data, hosting, and regulatory requirements with qualified local counsel.
- Configure production Supabase Auth URLs, email delivery, backups, monitoring, and incident response.
- Onboard and train authorized reviewers before accepting sensitive requests.
- Test English and Arabic RTL flows on current Samsung Android and Apple iPhone devices.
- Run end-to-end tests with synthetic data before any real beneficiary data is collected.

## Current status

This repository contains the product foundation and parts of the request, verified-resource, matching, and human-review workflows. A complete production deployment is **not** implied: the deployment environment, partner network, operational staffing, and end-to-end acceptance tests must be verified before launch.
