# NEXORA AI — technical foundation

## System boundaries
- Client: responsive Next.js web application; native mobile client will consume the same API.
- Identity: Supabase Auth. Authorization is enforced in PostgreSQL RLS, not client-side filters.
- Data: PostgreSQL. Only verified resource summaries are discoverable to signed-in users.
- Workflow: trusted server/Edge Functions create matches and advance protected lifecycle transitions.
- AI: intent extraction, translation assistance, and candidate ranking only. AI cannot verify identity/resources, approve clinical or housing placements, release funds, or make crisis decisions.
- Trust & Safety: independent review queue, provider verification, audit trail, rate limits, abuse reporting, and human escalation.

## MVP workflows
1. A requester creates a private need.
2. A provider submits a resource; it remains pending review.
3. An authorized reviewer verifies the provider/resource.
4. Verified resource summaries become discoverable to signed-in users.
5. A server-side matcher proposes candidates; a human coordinator approves sensitive matches.
6. Reservation, collection/delivery, and recipient confirmation create outcome events.
7. A need is counted as resolved only after outcome confirmation.

## Initial data model
profiles, organizations, organization_members, needs, resources, matches, outcome_events.

Medical records, crisis cases, identity documents, exact home addresses, and medication records are intentionally excluded from this first schema. Add them only with a separate threat model, legal basis, consent model, and specialist access controls.

## Security invariants
- RLS is enabled on every public table.
- No anon table access is granted.
- Never expose a Supabase secret/service-role key in a browser bundle.
- User-editable metadata is never used for authorization.
- Resource owners cannot self-mark resources as verified.
- Client users cannot create matches or change match status.
- Sensitive placements require human approval and verified organizations.
- No unrestricted LLM database access; use narrow server tools and allowlists.

## Launch gates
- Dedicated Supabase project and environment secrets.
- Auth email/SMS provider configuration and abuse throttling.
- Trusted server-side role management for reviewers.
- Privacy notice, consent wording, retention/deletion process, UAE legal review.
- Dubai partners for food safety, licensed healthcare referrals, and vetted accommodation.
- Operational support and incident-response ownership.


## Autonomous operations architecture

NEXORA is designed as an independent operations platform, not a directory that waits for a person to coordinate every routine step.

- **Event intake:** database triggers enqueue durable jobs when a beneficiary request is created or a resource becomes verified/changes capacity.
- **Orchestration:** `automation_jobs` persists work, deduplicates events, retries transient failures with backoff, and recovers stale worker leases.
- **Execution:** the Supabase Edge Function `automation-worker` claims jobs using a service-role-only RPC, runs the matching workflow, and records completion or retry state.
- **Matching:** deterministic matching considers verified resource status, category, city, availability window, and positive quantity. It creates proposed matches only; it does not reserve stock or promise delivery.
- **Sensitive pathways:** healthcare and housing proposals are marked `human_review_required`. No automated diagnosis, treatment, eligibility ruling, crisis response, or housing placement is allowed.
- **Operations:** the worker must be deployed and called on a schedule. A queue without a running worker is not autonomous in production.

### Worker deployment

1. Apply migrations in order, including `202611120007_autonomous_workflow_engine.sql`.
2. Deploy `supabase/functions/automation-worker/index.ts`.
3. Set `AUTOMATION_WORKER_SECRET` as a function secret. Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the Edge Function runtime.
4. Invoke the function on a schedule (for example, once per minute) with `Authorization: Bearer <AUTOMATION_WORKER_SECRET>`.
5. Monitor failed jobs and queue age; configure alerting before real beneficiaries are onboarded.

This first autonomous release performs deterministic resource matching and workflow orchestration. AI classification, provider confirmation, inventory reservation, automated notifications, and self-healing infrastructure are later capabilities and must be added with separate tests and permissions.
