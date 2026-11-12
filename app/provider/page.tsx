"use client";

import "../auth-layout.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Offer = {
  id: string;
  title: string;
  category: string;
  resource_type: string;
  quantity: number;
  unit: string;
  city: string;
  status: string;
  available_until: string | null;
  created_at: string;
};
type Match = { id: string; status: string; created_at: string };
type Organization = { id: string; name: string; organization_type: string; city: string; verification_status: string; member_role: string; created_at: string };
type TeamMember = { user_id: string; member_role: string; display_name: string | null; email: string | null; joined_at: string };
type TeamInvite = { id: string; email: string; member_role: string; expires_at: string; created_at: string };

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Awaiting verification",
  verified: "Verified",
  reserved: "Reserved",
  fulfilled: "Fulfilled",
  expired: "Expired",
  suspended: "Unavailable",
};

export default function ProviderPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [email, setEmail] = useState("");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("charity");
  const [orgCity, setOrgCity] = useState("Dubai");
  const [registrationReference, setRegistrationReference] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgBusy, setOrgBusy] = useState(false);
  const [teamOrgId, setTeamOrgId] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("coordinator");
  const [inviteToken, setInviteToken] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) { router.replace("/auth"); return; }
      setEmail(user.email ?? "");
      // RLS remains the security boundary; this explicit owner filter is defense in depth.
      const [offerResult, matchResult, organizationResult] = await Promise.all([
        supabase.from("resources")
          .select("id,title,category,resource_type,quantity,unit,city,status,available_until,created_at")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("matches")
          .select("id,status,created_at")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      if (offerResult.error) throw offerResult.error;
      if (matchResult.error) throw matchResult.error;
      setOffers((offerResult.data ?? []) as Offer[]);
      setMatches((matchResult.data ?? []) as Match[]);
      if (organizationResult.error) throw organizationResult.error;
      setOrganizations((organizationResult.data ?? []) as Organization[]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load provider activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const loadTeam = useCallback(async (organizationId: string) => {
    if (!organizationId) { setTeamMembers([]); setTeamInvites([]); return; }
    const supabase = createClient();
    const [membersResult, invitesResult] = await Promise.all([
      supabase.rpc("my_organization_members", { p_organization_id: organizationId }),
      supabase.rpc("my_organization_invitations", { p_organization_id: organizationId }),
    ]);
    if (membersResult.error) throw membersResult.error;
    setTeamMembers((membersResult.data ?? []) as TeamMember[]);
    if (!invitesResult.error) setTeamInvites((invitesResult.data ?? []) as TeamInvite[]);
    else setTeamInvites([]);
  }, []);

  useEffect(() => {
    if (teamOrgId) void loadTeam(teamOrgId).catch(error => setNotice(error instanceof Error ? error.message : "Could not load organization team."));
  }, [teamOrgId, loadTeam]);

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setTeamBusy(true); setInviteToken(""); setNotice("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("invite_organization_member", {
        p_organization_id: teamOrgId, p_email: inviteEmail.trim(), p_member_role: inviteRole
      });
      if (error) throw error;
      setInviteToken(data as string); setInviteEmail("");
      await loadTeam(teamOrgId);
      setNotice("Invitation created. Share the one-time token securely with the invited person.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not create invitation."); }
    finally { setTeamBusy(false); }
  }

  async function removeMember(userId: string) {
    if (!window.confirm("Remove this member from the organization?")) return;
    setTeamBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("revoke_organization_member", {
        p_organization_id: teamOrgId, p_member_user_id: userId
      });
      if (error) throw error;
      await loadTeam(teamOrgId);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not remove member."); }
    finally { setTeamBusy(false); }
  }

  async function cancelInvite(invitationId: string) {
    setTeamBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("cancel_organization_invitation", { p_invitation_id: invitationId });
      if (error) throw error;
      await loadTeam(teamOrgId);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not cancel invitation."); }
    finally { setTeamBusy(false); }
  }

  const visibleOffers = useMemo(
    () => filter === "all" ? offers : offers.filter(offer => offer.status === filter),
    [offers, filter]
  );
  const pendingCount = offers.filter(offer => offer.status === "pending_review").length;
  const verifiedCount = offers.filter(offer => offer.status === "verified").length;

  async function submitOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrgBusy(true);
    setNotice("");
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("submit_provider_organization", {
        p_name: orgName.trim(),
        p_organization_type: orgType,
        p_city: orgCity.trim(),
        p_registration_reference: registrationReference.trim(),
        p_contact_email: orgEmail.trim() || null,
        p_website: orgWebsite.trim() || null,
      });
      if (error) throw error;
      setOrgName(""); setRegistrationReference(""); setOrgEmail(""); setOrgWebsite("");
      setNotice("Organization submitted. It remains pending until an authorized NEXORA administrator completes verification.");
      await load(true);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not submit the organization.");
    } finally { setOrgBusy(false); }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return <main className="dashboard-shell"><p>Loading your provider workspace…</p></main>;

  return <main className="dashboard-shell">
    <header className="dashboard-header">
      <Link className="brand" href="/"><span className="brand-mark">N</span><span>NEXORA<span className="brand-ai"> AI</span></span></Link>
      <div className="dashboard-user"><span>{email}</span><button onClick={signOut}>Sign out</button></div>
    </header>
    <section className="dashboard-welcome">
      <span className="kicker">PROVIDER WORKSPACE</span>
      <h1>Your assistance offers</h1>
      <p>Track the review status and activity of resources submitted from your account.</p>
      <div className="review-actions">
        <Link className="button button-primary" href="/dashboard">Submit a new offer</Link>
        <button className="review-secondary" onClick={() => void load(true)} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh activity"}</button>
      </div>
    </section>

    {notice && <p className="form-message" role="status">{notice}</p>}

    <section className="dashboard-panel activity-panel" style={{ marginBottom: 18 }}>
      <h2>Organizations you represent</h2>
      {organizations.length === 0 ? <p className="empty-state">No organization is linked to your account yet.</p> :
        organizations.map(org => <article className="activity-row" key={org.id}>
          <div><strong>{org.name}</strong><small>{org.organization_type.replaceAll("_", " ")} · {org.city} · {org.member_role}</small></div>
          <span className="status-pill">{org.verification_status === "verified" ? "Verified" : org.verification_status === "pending" ? "Pending verification" : org.verification_status}</span>
        </article>)}
      {organizations.some(org => org.member_role === "owner") && <section className="dashboard-panel activity-panel" style={{ marginTop: 16 }}>
        <h3>Organization team</h3>
        <label>Manage organization<select value={teamOrgId} onChange={event => setTeamOrgId(event.target.value)}>{organizations.filter(org => org.member_role === "owner").map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
        <form className="auth-form" onSubmit={inviteMember}>
          <h4>Invite a team member</h4>
          <label>Member email<input type="email" required value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} /></label>
          <label>Role<select value={inviteRole} onChange={event => setInviteRole(event.target.value)}><option value="coordinator">Coordinator — manage assistance offers</option><option value="reviewer">Reviewer — view organization-linked offers</option></select></label>
          <button className="button button-primary" disabled={teamBusy || !teamOrgId}>{teamBusy ? "Working…" : "Create invitation"}</button>
        </form>
        {inviteToken && <div className="form-message"><strong>One-time invitation token</strong><p>{inviteToken}</p><small>Send this token only to the invited email address. It expires after 7 days and can be used once at /invite.</small></div>}
        <h4>Current members</h4>
        {teamMembers.map(member => <article className="activity-row" key={member.user_id}>
          <div><strong>{member.display_name || member.email || member.user_id}</strong><small>{member.email} · {member.member_role}</small></div>
          {member.member_role !== "owner" && <button className="review-danger" disabled={teamBusy} onClick={() => void removeMember(member.user_id)}>Remove</button>}
        </article>)}
        <h4>Pending invitations</h4>
        {teamInvites.length === 0 ? <p className="empty-state">No pending invitations.</p> : teamInvites.map(invite => <article className="activity-row" key={invite.id}>
          <div><strong>{invite.email}</strong><small>{invite.member_role} · expires {new Date(invite.expires_at).toLocaleDateString()}</small></div>
          <button className="review-danger" disabled={teamBusy} onClick={() => void cancelInvite(invite.id)}>Cancel</button>
        </article>)}
      </section>}
      <p className="dashboard-safety">Submitting an organization does not verify it. An authorized administrator must independently check its legal identity and authorization before approval.</p>
      <form className="auth-form" onSubmit={submitOrganization}>
        <h3>Register an organization</h3>
        <label>Legal or public organization name<input value={orgName} onChange={event => setOrgName(event.target.value)} required minLength={2} maxLength={160} /></label>
        <label>Organization type<select value={orgType} onChange={event => setOrgType(event.target.value)}><option value="charity">Charity / NGO</option><option value="healthcare_provider">Healthcare provider</option><option value="pharmacy">Pharmacy</option><option value="accommodation_provider">Accommodation provider</option><option value="restaurant">Restaurant / food provider</option><option value="company">Company / other service</option></select></label>
        <label>Service area<input value={orgCity} onChange={event => setOrgCity(event.target.value)} required maxLength={100} /></label>
        <label>Registration or authorization reference<input value={registrationReference} onChange={event => setRegistrationReference(event.target.value)} required minLength={3} maxLength={120} placeholder="Reference checked privately by NEXORA" /></label>
        <label>Organization contact email (optional)<input type="email" value={orgEmail} onChange={event => setOrgEmail(event.target.value)} maxLength={254} /></label>
        <label>Official website (optional)<input type="url" value={orgWebsite} onChange={event => setOrgWebsite(event.target.value)} placeholder="https://" maxLength={300} /></label>
        <button className="button button-primary auth-submit" disabled={orgBusy}>{orgBusy ? "Submitting…" : "Submit organization for verification"}</button>
      </form>
    </section>

    <section className="dashboard-grid" aria-label="Provider activity summary">
      <div className="dashboard-panel activity-panel">
        <h2>Offer overview</h2>
        <div className="review-meta">
          <div><dt>Total offers</dt><dd>{offers.length}</dd></div>
          <div><dt>Awaiting review</dt><dd>{pendingCount}</dd></div>
          <div><dt>Verified offers</dt><dd>{verifiedCount}</dd></div>
          <div><dt>Referrals</dt><dd>{matches.length}</dd></div>
        </div>
        <p className="dashboard-safety">A verified status means a NEXORA reviewer approved the listing. It does not replace licensing, credential checks, or confirmation of current availability.</p>
      </div>
      <div className="dashboard-panel activity-panel">
        <h2>Referral activity</h2>
        {matches.length === 0 ? <p className="empty-state">No referrals have been created for your offers.</p> :
          matches.slice(0, 8).map(match => <article className="activity-row" key={match.id}>
            <div><strong>Referral activity</strong><small>{new Date(match.created_at).toLocaleDateString()}</small></div>
            <span className="status-pill">{match.status.replaceAll("_", " ")}</span>
          </article>)}
        <p className="dashboard-safety">A referral is not a confirmed booking or delivery. Contact the person only through an approved NEXORA workflow.</p>
      </div>
    </section>

    <section className="dashboard-panel activity-panel" style={{ marginTop: 18 }}>
      <div className="review-card-head">
        <div><h2>Your submitted offers</h2><p>Only offers belonging to your signed-in account are shown.</p></div>
        <label>Filter
          <select value={filter} onChange={event => setFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Awaiting verification</option>
            <option value="verified">Verified</option>
            <option value="reserved">Reserved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="expired">Expired</option>
            <option value="suspended">Unavailable</option>
          </select>
        </label>
      </div>
      {visibleOffers.length === 0 ? <p className="empty-state">No offers match this filter. You can submit an offer from your workspace.</p> :
        visibleOffers.map(offer => <article className="activity-row" key={offer.id}>
          <div>
            <strong>{offer.title}</strong>
            <small>{offer.resource_type.replaceAll("_", " ")} · {offer.quantity} {offer.unit} · {offer.city}</small>
            {offer.available_until && <small>Availability window ends {new Date(offer.available_until).toLocaleString()}</small>}
            <small>Submitted {new Date(offer.created_at).toLocaleDateString()}</small>
          </div>
          <span className="status-pill">{statusLabel[offer.status] ?? offer.status}</span>
        </article>)}
    </section>
    <p className="dashboard-safety">Offers awaiting review are not visible to beneficiaries. Do not assume that a listed quantity is still available; confirm each referral through the agreed provider process. NEXORA is not an emergency service.</p>
  </main>;
}
