import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Crown, TrendingUp, Users } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Panel, Pill, SectionTitle, Stat } from "@/components/luxe/ui";
import { AGENCY_SHARE, adminSeries } from "@/lib/luxe-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Ambassador Admin — AURA" },
      {
        name: "description",
        content:
          "Ambassador command centre: subscriber growth, product sales, earnings and agency revenue share at a glance.",
      },
      { property: "og:title", content: "Ambassador Admin — AURA" },
      {
        property: "og:description",
        content: "Track subscribers, products sold, earnings and revenue share.",
      },
    ],
  }),
  component: Admin,
});

const currency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Admin() {
  const { user, isAdmin, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<"daily" | "monthly">("daily");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const series = range === "daily" ? adminSeries.daily : adminSeries.monthly;
  const totals = useMemo(() => {
    const subs = series.reduce((a, s) => a + s.subs, 0);
    const revenue = series.reduce((a, s) => a + s.revenue, 0);
    const products = adminSeries.products.reduce((a, p) => a + p.sold, 0);
    return { subs, revenue, products, agency: revenue * AGENCY_SHARE, net: revenue * (1 - AGENCY_SHARE) };
  }, [series]);
  const max = Math.max(...series.map((s) => s.revenue));

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24">
        <Panel glow>
          <SectionTitle eyebrow="Restricted" title="Ambassador access only" />
          <p className="text-sm text-muted-foreground">
            This command centre is reserved for verified ambassadors and admins.
          </p>
          <Link to="/dashboard" className="mt-5 inline-block rounded-full border border-border px-4 py-2 text-xs tracking-wide">
            Back to my dashboard
          </Link>
        </Panel>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Command centre</p>
          <h1 className="font-display text-3xl sm:text-4xl">
            {profile?.display_name ?? "Ambassador"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Pill>
            <Crown className="mr-1 h-3.5 w-3.5" /> Verified ambassador
          </Pill>
          <Link to="/dashboard" className="rounded-full border border-border px-3 py-1.5 text-xs tracking-wide">
            <ArrowLeft className="mr-1 inline h-3.5 w-3.5" /> Member view
          </Link>
        </div>
      </header>

      <div className="mb-6 flex gap-2">
        {(["daily", "monthly"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`rounded-full border px-4 py-1.5 text-xs capitalize tracking-wide ${
              range === r ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {r === "daily" ? "This week" : "This year"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New subscribers" value={String(totals.subs)} hint={range === "daily" ? "Last 7 days" : "Year to date"} />
        <Stat label="Gross revenue" value={currency(totals.revenue)} accent />
        <Stat label="Products sold" value={String(totals.products)} hint="All-time catalogue" />
        <Stat label="Your earnings" value={currency(totals.net)} hint={`${Math.round(AGENCY_SHARE * 100)}% agency share applied`} />
      </div>

      <Panel className="mt-6">
        <SectionTitle
          eyebrow={range === "daily" ? "Daily" : "Monthly"}
          title="Revenue & growth"
          action={
            <span className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> peak {currency(max)}
            </span>
          }
        />
        <div className="flex h-48 items-end gap-3">
          {series.map((s) => (
            <div key={s.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-primary/80"
                style={{ height: `${(s.revenue / max) * 100}%` }}
                title={`${s.label}: ${currency(s.revenue)}`}
              />
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionTitle eyebrow="Catalogue" title="Products sold" />
          <ul className="space-y-3">
            {adminSeries.products.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sold} sold</p>
                </div>
                <span className="font-display text-lg">{currency(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel glow>
          <SectionTitle eyebrow="Revenue share" title="Lifecycle split" />
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>Ambassador ({Math.round((1 - AGENCY_SHARE) * 100)}%)</span>
                <span>{currency(totals.net)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${(1 - AGENCY_SHARE) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>Agency ({Math.round(AGENCY_SHARE * 100)}%)</span>
                <span>{currency(totals.agency)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-accent" style={{ width: `${AGENCY_SHARE * 100}%` }} />
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Share applies for the lifecycle of every enrolment.
            </p>
          </div>
        </Panel>
      </div>
    </main>
  );
}
