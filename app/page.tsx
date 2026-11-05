"use client";

import { useCallback, useEffect, useState } from "react";

type ServiceStatus = "connected" | "not_configured" | "error" | "checking";
type Health = { supabase: ServiceStatus; mongodb: ServiceStatus };

function Status({ name, status }: { name: string; status: ServiceStatus }) {
  const label = {
    connected: "Connected",
    not_configured: "Add credentials",
    error: "Connection failed",
    checking: "Checking…",
  }[status];

  return (
    <div className="service-row">
      <span className={`status-dot ${status}`} aria-hidden="true" />
      <span className="service-name">{name}</span>
      <span className={`status-label ${status}`}>{label}</span>
    </div>
  );
}

export default function Home() {
  const [health, setHealth] = useState<Health>({ supabase: "checking", mongodb: "checking" });
  const [loading, setLoading] = useState(false);

  const checkConnections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const result = (await response.json()) as Health;
      setHealth(result);
    } catch {
      setHealth({ supabase: "error", mongodb: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkConnections();
  }, [checkConnections]);

  return (
    <main className="page-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#home"><span className="brand-mark">R</span> therapture</a>
        <span className="starter-badge"><span /> STARTER APP</span>
      </nav>

      <section className="hero" id="home">
        <div className="eyebrow"><span /> YOUR APP STARTS HERE</div>
        <h1>Build something<br /><span>remarkable.</span></h1>
        <p className="hero-copy">A clean foundation, ready for your ideas—with Supabase and MongoDB waiting to plug in.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">Open Supabase <span>↗</span></a>
          <a className="button button-secondary" href="https://cloud.mongodb.com" target="_blank" rel="noreferrer">Open MongoDB <span>↗</span></a>
        </div>
      </section>

      <section className="connection-card" aria-labelledby="connections-heading">
        <div className="card-heading">
          <div>
            <div className="eyebrow muted">BACKEND SERVICES</div>
            <h2 id="connections-heading">Your connections</h2>
          </div>
          <button className="refresh-button" type="button" onClick={() => void checkConnections()} disabled={loading} aria-label="Check connections again">
            <span className={loading ? "spin" : ""}>↻</span> Refresh
          </button>
        </div>
        <div className="service-list">
          <Status name="Supabase" status={health.supabase} />
          <Status name="MongoDB" status={health.mongodb} />
        </div>
        {(health.supabase === "not_configured" || health.mongodb === "not_configured") && (
          <p className="hint">Add your connection values to <code>.env.local</code>, then restart the dev server.</p>
        )}
      </section>

      <footer><span>Made to be yours.</span><span>Next.js · Supabase · MongoDB</span></footer>
    </main>
  );
}
