# Supabase setup and first-run checklist

This guide provisions the backend for the NEXORA web MVP. Use a **dedicated Supabase project** for NEXORA; do not reuse a personal or unrelated production database.

## 1. Create the project

1. Create a Supabase project in a region suitable for the Dubai pilot and record its project URL.
2. In **Project Settings → API**, copy the project URL and the publishable key.
3. Add these values to the deployment provider as environment variables:

   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY\`

4. For local development, copy \`.env.example\` to \`.env.local\` and fill in those two values.
5. Never add a service-role/secret key to a \`NEXT_PUBLIC_*\` variable, browser code, GitHub commits, or screenshots.

## 2. Apply database migrations

Open the Supabase SQL Editor for the NEXORA project and run the migration files in filename order:

1. \`supabase/migrations/202611110001_initial_core.sql\`
2. \`supabase/migrations/202611110002_profile_trigger.sql\`

Do not run these migrations against a database that contains unrelated application data. The initial migration creates the NEXORA tables, enum types, indexes, grants, row-level security policies, and the profile creation trigger.

## 3. Configure authentication

In **Authentication → URL Configuration**:

- Set the Site URL to the deployed NEXORA origin.
- Add the local development origin (for example, \`http://localhost:3000/**\`) to the allowed redirect URLs.
- Add the production origin and any preview origin that is actually used.
- Configure email confirmation and outgoing email delivery before inviting pilot users.

The current signup flow uses email and password. Do not advertise the service publicly until email delivery, abuse controls, and account recovery have been tested.

## 4. Verify the database

After applying migrations, run the following read-only checks in the SQL Editor:

\`\`\`sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select id, preferred_language, account_type
from public.profiles
limit 5;
\`\`\`

Confirm that row-level security is enabled on every application table. The expected public tables are \`profiles\`, \`organizations\`, \`organization_members\`, \`needs\`, \`resources\`, \`matches\`, and \`outcome_events\`.

## 5. Manual smoke test

Use two separate test accounts:

- Account A: create a support request, then confirm it appears only in Account A's activity.
- Account B: submit a resource and confirm its status is \`pending_review\`.
- Confirm Account B cannot mark its own resource as \`verified\`.
- Confirm an unverified resource is not visible to Account A.
- Confirm a verified resource is visible only after a trusted reviewer workflow has been configured.
- Change the dashboard language to English, Persian, and Arabic; reload the page and confirm the saved language is restored.
- Confirm that the language used for a new support request matches the selected profile language.

The reviewer console is available at `/review`. The trusted-review migration adds a private reviewer allowlist, a database-enforced review function, a distinct rejected state, and an audit log. Providers cannot grant themselves reviewer access or change a pending resource to verified. Do not manually weaken RLS.

### Provision the first trusted reviewer

After the reviewer has created an account, run this statement in the Supabase SQL Editor as the project owner. Replace the email with the exact address of the trusted reviewer:

```sql
insert into public.platform_reviewers (user_id, granted_by)
select id, null
from auth.users
where lower(email) = lower('trusted-reviewer@example.com')
on conflict (user_id) do update set active = true;
```

To revoke access, run `update public.platform_reviewers set active = false where user_id = '<user-uuid>';`. Never expose reviewer provisioning through the public client.

## 6. Before a public pilot

Complete the following before using real people or real support cases:

- Provision at least two trusted reviewers using the SQL below; verify that non-reviewers cannot open the queue or call the review function.
- Test approval, rejection, duplicate review attempts, and audit records using separate provider and reviewer accounts.
- Configure rate limits, abuse reporting, account recovery, and operational monitoring.
- Publish privacy, consent, retention, and deletion policies; obtain UAE legal review.
- Establish staffed local partners for food safety, licensed healthcare referrals, and vetted accommodation.
- Keep medical records, exact home addresses, identity documents, medication records, and crisis case details out of this MVP.
- Keep human review in the loop for sensitive referrals and placements.

NEXORA is a coordination platform, not an emergency service or healthcare provider.
