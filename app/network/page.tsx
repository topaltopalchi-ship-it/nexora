"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Category = "all" | "food" | "healthcare" | "housing" | "transport" | "other";
type Resource = {
  id: string;
  title: string;
  public_summary: string;
  category: Exclude<Category, "all">;
  city: string;
  quantity: number;
  available_until: string | null;
};

const labels: Record<Category, string> = {
  all: "All",
  food: "Food",
  healthcare: "Healthcare",
  housing: "Housing",
  transport: "Transport",
  other: "Other",
};

export default function NetworkPage() {
  const [category, setCategory] = useState<Category>("all");
  const [city, setCity] = useState("Dubai");
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const categories = useMemo(() => Object.keys(labels) as Category[], []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotice("");
      const supabase = createClient();
      let query = supabase
        .from("resources")
        .select("id,title,public_summary,category,city,quantity,available_until")
        .eq("status", "verified")
        .order("created_at", { ascending: false });

      if (category !== "all") query = query.eq("category", category);
      if (city.trim()) query = query.ilike("city", city.trim());

      const { data, error } = await query;
      if (error) setNotice(error.message);
      else setResources((data ?? []) as Resource[]);
      setLoading(false);
    }

    void load();
  }, [category, city]);

  return (
    <main className="network-shell">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">N</span>
          <span>NEXORA<span className="brand-ai"> AI</span></span>
        </Link>
        <Link className="network-account" href="/dashboard">My workspace ↗</Link>
      </header>

      <section className="network-hero">
        <span className="kicker">VERIFIED RESOURCE NETWORK</span>
        <h1>Find trusted local support.</h1>
        <p>Browse resources that have completed NEXORA's verification process. Sensitive cases remain under human review.</p>
      </section>

      <section className="network-filters" aria-label="Resource filters">
        <div className="filter-group">
          <span>Category</span>
          <div className="filter-pills">
            {categories.map((item) => (
              <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>
                {labels[item]}
              </button>
            ))}
          </div>
        </div>
        <label className="city-filter">
          <span>City</span>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Dubai" />
        </label>
      </section>

      {notice && <p className="form-message" role="status">{notice}</p>}

      {loading ? (
        <div className="network-empty">Loading verified resources…</div>
      ) : resources.length === 0 ? (
        <div className="network-empty">
          <strong>No verified resources found.</strong>
          <p>Try another category or city. Providers can submit resources from their NEXORA workspace.</p>
          <Link className="button button-primary" href="/dashboard">Offer a resource <span>↗</span></Link>
        </div>
      ) : (
        <div className="resource-grid">
          {resources.map((resource) => (
            <article className="resource-card" key={resource.id}>
              <div className="resource-card-top">
                <span>{labels[resource.category]}</span>
                <span className="verified-badge">✓ VERIFIED</span>
              </div>
              <h2>{resource.title}</h2>
              <p>{resource.public_summary}</p>
              <div className="resource-meta">
                <span>{resource.city}</span>
                <span>Available: {resource.quantity}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
