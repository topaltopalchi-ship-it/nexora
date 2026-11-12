# NEXORA Dubai Pilot — Product Scope

## Product definition

NEXORA is a multilingual social-assistance coordination service. It helps a person express a need, discovers potentially relevant verified organizations, and coordinates a safe referral with human oversight.

It is not a marketplace, e-commerce product, virtual shopping environment, or game. Any legacy virtual-market/game prototype must not be treated as part of the product roadmap.

## Primary roles

- **Beneficiary:** submits and tracks their own assistance request.
- **Provider:** an approved organization that maintains service descriptions, coverage areas, and capacity.
- **Reviewer:** a trained, authorized person who verifies resources and reviews sensitive referrals.
- **Administrator:** manages trusted organizations, reviewer access, operational policies, and audit oversight.

## MVP journeys

### Request help
1. Choose a support category: food, healthcare access, safe support/housing, or general assistance.
2. Select an area in Dubai; exact address is optional and should only be requested when operationally necessary.
3. Provide a short description and urgency.
4. Review consent and privacy information before submission.
5. Track request status and receive safe next steps.

### Offer help or register a service
1. Individuals, restaurants, licensed healthcare providers, pharmacies, charities, and accommodation providers can submit an offer.
2. Offer types include food parcels, prepared meals, clothing, medicines (licensed providers only), free medical consultations, temporary accommodation, transport, and other practical support.
3. Capture the offer type, provider type, public summary, Dubai area, quantity/capacity, unit, availability end, and (where relevant) expiry date.
4. Every new offer is private and pending review until an authorized reviewer verifies the provider and the offer.
5. Availability is never promised until the provider confirms the specific referral.
6. Medicines are not exchanged person-to-person; medicine offers require licensed/authorized providers and local regulatory review. Clinical services require credential verification. Accommodation referrals require human review and provider confirmation.

### Find suitable support
1. Match only against active, verified resources.
2. Rank suggestions using transparent factors such as category, service area, availability, and capacity.
3. Explain why each resource is suggested and show when its information was last verified.
4. Never treat a score as a guarantee of eligibility or service availability.

### Human review
1. Sensitive referrals enter a restricted reviewer queue.
2. Reviewers see only the information necessary to make the referral decision.
3. Reviewer actions are approve, reject, or request clarification, with a reason.
4. Record an immutable audit event for each decision.
5. Notify the beneficiary without exposing provider or reviewer private information.

## Safety boundaries

- No AI diagnosis, prescribing, treatment selection, or clinical triage.
- No automated housing placement or unsupervised high-risk referrals.
- No peer-to-peer medicine exchange or medication transfers.
- No claim of 24/7 emergency response unless a staffed local partner and tested escalation agreement exist.
- Emergency screens must use locally verified UAE contact details and be reviewed by local partners before release.
- Do not expose beneficiary names, phone numbers, exact addresses, or sensitive request descriptions to public users.
- Provider verification must be performed by authorized staff, not self-attested by the provider alone.\n- Medicine offers must not enable person-to-person transfer and must remain unavailable until licensed-provider and local regulatory checks are complete.\n- Clinical and accommodation offers require additional human review before referral.

## Dubai pilot operating requirements

Before real launch, NEXORA needs written agreements and operating procedures with local support organizations, a trained reviewer rota, verified service directories, consent language, incident escalation, data retention rules, and a tested complaint process.

Privacy and regulatory requirements for UAE personal and health data must be reviewed by qualified local counsel and relevant partners. This document is product guidance, not legal advice.

## Release gates

- [ ] English and Arabic content reviewed by native speakers; RTL and accessibility tested.
- [ ] Persian content reviewed and RTL tested.
- [ ] Beneficiary/provider/reviewer authorization tests pass.
- [ ] RLS tests prove users cannot read or alter another person's requests.
- [ ] Reviewer actions are server-authorized and audited.
- [ ] Resource availability and verification timestamps are visible and accurate.
- [ ] End-to-end tests use synthetic data and cover request, suggestion, review, notification, and closure.
- [ ] Mobile browser tests pass on Samsung Android and iPhone Safari.
- [ ] Partner directory, emergency escalation, consent, privacy, and data-retention procedures are approved before real users are onboarded.
