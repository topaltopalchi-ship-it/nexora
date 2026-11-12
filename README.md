# NEXORA AI

**An autonomous, multilingual social-assistance operations platform.**

NEXORA is an independent software platform that manages the routine social-assistance lifecycle itself: intake, request classification, resource discovery, deterministic matching, workflow orchestration, status updates, retries, and operational audit. It is not a marketplace, shopping app, or game.

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
- The autonomous workflow engine finds potentially relevant verified resources and creates traceable match proposals. It does not determine legal eligibility or make clinical decisions.
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
- Durable PostgreSQL job queue with event-driven enqueueing, retry/backoff, and an authenticated service-role worker
- Deterministic matching against verified, active resources; sensitive categories are flagged for human review
- AI tools (when enabled) restricted to scoped classification and explanation; no unrestricted database or privileged decision access

## Local development

Prerequisites: Node.js 22+ and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` after the dedicated NEXORA Supabase project is provisioned. Never expose a service-role or secret key in browser variables.

Initial schema: `supabase/migrations/202611110001_initial_core.sql`.

Autonomous workflow engine: `supabase/migrations/202611120007_autonomous_workflow_engine.sql`; worker: `supabase/functions/automation-worker/index.ts`.

Deploy the worker with `supabase functions deploy automation-worker`. Configure `AUTOMATION_WORKER_SECRET` as a function secret and invoke the function on a schedule (for example, every minute) with `Authorization: Bearer <AUTOMATION_WORKER_SECRET>`. The worker also needs the platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Never expose these secrets in client code.

## Dubai pilot readiness checklist

- Confirm local NGO, food-bank, healthcare, shelter, and social-service partners.
- Validate service categories, referral protocols, safeguarding, consent, and escalation procedures with those partners.
- Review UAE privacy, health-data, hosting, and regulatory requirements with qualified local counsel.
- Configure production Supabase Auth URLs, email delivery, backups, monitoring, and incident response.
- Onboard and train authorized reviewers before accepting sensitive requests.
- Test English and Arabic RTL flows on current Samsung Android and Apple iPhone devices.
- Run end-to-end tests with synthetic data before any real beneficiary data is collected.

## Current status

This repository contains an autonomous workflow foundation and a deterministic match-proposal engine. The worker must still be deployed and scheduled, and the migrations must be applied before jobs execute. Match proposals are not confirmed assistance: provider acceptance and human review remain required for sensitive healthcare/housing cases. A complete production deployment is **not** implied.
