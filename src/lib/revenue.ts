import { supabase } from "@/integrations/supabase/client";

export type Bucket = "daily" | "weekly" | "monthly" | "annual";

export type MetricRow = {
  label: string;
  bucket_start: string;
  subs: number;
  orders_count: number;
  revenue_cents: number;
  ambassador_cents: number;
  agency_cents: number;
};

export type ProductRow = { product: string; sold: number; revenue_cents: number };

export type LedgerRow = {
  id: string;
  order_id: string;
  eligible_cents: number;
  ambassador_cents: number;
  agency_cents: number;
  currency: string;
  payout_status: "pending" | "approved" | "paid" | "reversed";
  created_at: string;
};

/** Money formatting from integer minor units — never from floats. */
export function money(cents: number, currency = "NGN") {
  return (cents / 100).toLocaleString("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export async function fetchMetrics(bucket: Bucket): Promise<MetricRow[]> {
  const { data, error } = await supabase.rpc("admin_revenue_metrics", { _bucket: bucket });
  if (error) throw error;
  return (data ?? []) as MetricRow[];
}

export async function fetchProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase.rpc("admin_product_performance");
  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

/** Ambassador-scoped: RLS returns only rows attributed to the signed-in ambassador. */
export async function fetchMyLedger(): Promise<LedgerRow[]> {
  const { data, error } = await supabase
    .from("revenue_ledger")
    .select("id,order_id,eligible_cents,ambassador_cents,agency_cents,currency,payout_status,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LedgerRow[];
}

export function summariseLedger(rows: LedgerRow[]) {
  const live = rows.filter((r) => r.payout_status !== "reversed");
  const sum = (f: (r: LedgerRow) => number, rs: LedgerRow[] = live) => rs.reduce((a, r) => a + f(r), 0);
  return {
    gross: sum((r) => r.eligible_cents),
    ambassador: sum((r) => r.ambassador_cents),
    agency: sum((r) => r.agency_cents),
    pending: sum((r) => r.ambassador_cents, live.filter((r) => r.payout_status === "pending")),
    approved: sum((r) => r.ambassador_cents, live.filter((r) => r.payout_status === "approved")),
    paid: sum((r) => r.ambassador_cents, live.filter((r) => r.payout_status === "paid")),
    reversed: sum((r) => r.ambassador_cents, rows.filter((r) => r.payout_status === "reversed")),
    orders: live.length,
  };
}
