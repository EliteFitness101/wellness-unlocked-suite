import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Crown, TrendingUp, Users } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Panel, Pill, SectionTitle, Stat } from "@/components/luxe/ui";
import { AGENCY_SHARE, AGENCY_SHARE_LABEL, AMBASSADOR_SHARE } from "@/lib/luxe-data";
import { fetchMetrics, fetchProducts, money, type Bucket } from "@/lib/revenue";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Ambassador Command Centre — AURA" },
      {
        name: "description",
        content:
          "Ambassador command centre: subscriber growth, product sales, earnings and the 40/60 revenue allocation, from live ledger data.",
      },
      { property: "og:title", content: "Ambassador Command Centre — AURA" },
      {
        property: "og:description",
        content: "Track subscribers, products sold, earnings and revenue allocation.",
      },
    ],
  }),
  component: Admin,
});

const ranges: Array<{ key: Bucket; label: string }> = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "annual", label: "Annual" },
];

function Admin() {
  const { user, isAdmin, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<Bucket>("daily");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const metrics = useQuery({
    queryKey: ["admin-metrics", range],
    queryFn: () => fetchMetrics(range),
    enabled: isAdmin,
  });
  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: fetchProducts,
    enabled: isAdmin,
  });

  const series = useMemo(() => metrics.data ?? [], [metrics.data]);
  const totals = useMemo(() => {
    const acc = series.reduce(
      (a, s) => ({
        subs: a.subs + Number(s.subs),
        orders: a.orders + Number(s.orders_count),
        revenue: a.revenue + Number(s.revenue_cents),
        ambassador: a.ambassador + Number(s.ambassador_cents),
        agency: a.agency + Number(s.agency_cents),
      }),
      { subs: 0, orders: 0, revenue: 0, ambassador: 0, agency: 0 },
    );
    return acc;
  }, [series]);
  const productsSold = (products.data ?? []).reduce((a, p) => a + Number(p.sold), 0);
  const max = Math.max(1, ...series.map((s) => Number(s.revenue_cents)));

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24">
        <Panel glow>
          <SectionTitle eyebrow="Restricted" title="Ambassador access only" />
          <p className="text-sm text-muted-foreground">
            This command centre is reserved for verified ambassadors and admins.
          </p>
          <Link
            to="/dashboard"
            className="mt-5 inline-block rounded-full border border-border px-4 py-2 text-xs tracking-wide"
          >
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
          <h1 className="font-display text-3xl sm:text-4xl">{profile?.display_name ?? "Ambassador"}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill>
            <Crown className="mr-1 h-3.5 w-3.5" /> Verified ambassador
          </Pill>
          <Link
            to="/dashboard"
            className="rounded-full border border-border px-3 py-1.5 text-xs tracking-wide"
          >
            <ArrowLeft className="mr-1 inline h-3.5 w-3.5" /> Member view
          </Link>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {ranges.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-full border px-4 py-1.5 text-xs tracking-wide ${
              range === r.key ? "border-primary bg-primary text-primary-foreground" : "border-border"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {metrics.isError ? (
        <Panel className="mb-6">
          <p className="text-sm text-destructive">
            Could not load live metrics: {(metrics.error as Error).message}
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="New subscribers" value={String(totals.subs)} hint={`${range} window`} />
        <Stat label="Attributed revenue" value={money(totals.revenue)} accent />
        <Stat label="Orders" value={String(totals.orders)} hint={`${productsSold} products sold`} />
        <Stat
          label="Global Ambassador (40%)"
          value={money(totals.ambassador)}
          hint="From the revenue ledger"
        />
      </div>

      <Panel className="mt-6">
        <SectionTitle
          eyebrow={range}
          title="Revenue & growth"
          action={
            <span className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> peak {money(max)}
            </span>
          }
        />
        {metrics.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading live ledger…</p>
        ) : series.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders recorded in this window yet.</p>
        ) : (
          <div className="flex h-48 items-end gap-2 overflow-x-auto">
            {series.map((s) => (
              <div key={s.bucket_start} className="flex min-w-8 flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-primary/80"
                  style={{ height: `${(Number(s.revenue_cents) / max) * 100}%` }}
                  title={`${s.label}: ${money(Number(s.revenue_cents))}`}
                />
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel>
          <SectionTitle eyebrow="Catalogue" title="Products sold" />
          {(products.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No paid orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {(products.data ?? []).map((p) => (
                <li
                  key={p.product}
                  className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{p.product}</p>
                    <p className="text-xs text-muted-foreground">{p.sold} sold</p>
                  </div>
                  <span className="font-display text-lg">{money(Number(p.revenue_cents))}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel glow>
          <SectionTitle eyebrow="Revenue allocation" title="Lifecycle split" />
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>Global Ambassador ({Math.round(AMBASSADOR_SHARE * 100)}%)</span>
                <span>{money(totals.ambassador)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${AMBASSADOR_SHARE * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>
                  {AGENCY_SHARE_LABEL} ({Math.round(AGENCY_SHARE * 100)}%)
                </span>
                <span>{money(totals.agency)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-accent" style={{ width: `${AGENCY_SHARE * 100}%` }} />
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Allocation is computed in the revenue ledger for the
              lifecycle of every enrolment.
            </p>
          </div>
        </Panel>
      </div>
    </main>
  );
}
