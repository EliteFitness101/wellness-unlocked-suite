-- 1. Orders: attribution + payment status + idempotency key
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS ambassador_id uuid,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending','paid','refunded','cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS orders_external_ref_key
  ON public.orders (external_ref) WHERE external_ref IS NOT NULL;

-- 2. Canonical revenue ledger: 40% Global Ambassador / 60% Agency Logistics & System Integrity
CREATE TABLE IF NOT EXISTS public.revenue_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  ambassador_id uuid,
  eligible_cents bigint NOT NULL,
  ambassador_cents bigint NOT NULL,
  agency_cents bigint NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  payout_status text NOT NULL DEFAULT 'pending',
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT revenue_ledger_payout_status_check CHECK (payout_status IN ('pending','approved','paid','reversed')),
  CONSTRAINT revenue_ledger_split_check CHECK (ambassador_cents + agency_cents = eligible_cents)
);

GRANT SELECT ON public.revenue_ledger TO authenticated;
GRANT ALL ON public.revenue_ledger TO service_role;
ALTER TABLE public.revenue_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ambassadors read own ledger rows" ON public.revenue_ledger;
CREATE POLICY "Ambassadors read own ledger rows" ON public.revenue_ledger
  FOR SELECT TO authenticated USING (ambassador_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all ledger rows" ON public.revenue_ledger;
CREATE POLICY "Admins read all ledger rows" ON public.revenue_ledger
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. Idempotent allocation trigger (single source of truth)
CREATE OR REPLACE FUNCTION public.allocate_order_revenue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eligible bigint;
  v_ambassador bigint;
BEGIN
  IF NEW.status = 'paid' THEN
    v_eligible := GREATEST(COALESCE(NEW.amount_cents, 0), 0);
    v_ambassador := (v_eligible * 40) / 100;  -- floor; remainder accrues to agency
    INSERT INTO public.revenue_ledger
      (order_id, ambassador_id, eligible_cents, ambassador_cents, agency_cents, currency)
    VALUES
      (NEW.id, NEW.ambassador_id, v_eligible, v_ambassador, v_eligible - v_ambassador, NEW.currency)
    ON CONFLICT (order_id) DO NOTHING;
  ELSIF NEW.status IN ('refunded','cancelled') THEN
    UPDATE public.revenue_ledger
       SET payout_status = 'reversed', reversed_at = now()
     WHERE order_id = NEW.id AND payout_status <> 'paid';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.allocate_order_revenue() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS orders_allocate_revenue ON public.orders;
CREATE TRIGGER orders_allocate_revenue
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.allocate_order_revenue();

-- 4. Admin aggregate metrics from real data only
CREATE OR REPLACE FUNCTION public.admin_revenue_metrics(_bucket text)
RETURNS TABLE (label text, bucket_start timestamptz, subs bigint, orders_count bigint, revenue_cents bigint, ambassador_cents bigint, agency_cents bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trunc text;
  v_span interval;
  v_fmt text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _bucket = 'daily' THEN v_trunc := 'day'; v_span := interval '7 days'; v_fmt := 'Dy';
  ELSIF _bucket = 'weekly' THEN v_trunc := 'week'; v_span := interval '12 weeks'; v_fmt := 'DD Mon';
  ELSIF _bucket = 'monthly' THEN v_trunc := 'month'; v_span := interval '12 months'; v_fmt := 'Mon';
  ELSIF _bucket = 'annual' THEN v_trunc := 'year'; v_span := interval '5 years'; v_fmt := 'YYYY';
  ELSE RAISE EXCEPTION 'invalid bucket';
  END IF;

  RETURN QUERY
  WITH buckets AS (
    SELECT generate_series(date_trunc(v_trunc, now() - v_span), date_trunc(v_trunc, now()), ('1 ' || v_trunc)::interval) AS b
  ),
  rev AS (
    SELECT date_trunc(v_trunc, o.created_at) AS b,
           count(*) AS orders_count,
           COALESCE(sum(l.eligible_cents),0) AS revenue_cents,
           COALESCE(sum(l.ambassador_cents),0) AS ambassador_cents,
           COALESCE(sum(l.agency_cents),0) AS agency_cents
      FROM public.orders o
      JOIN public.revenue_ledger l ON l.order_id = o.id AND l.payout_status <> 'reversed'
     GROUP BY 1
  ),
  subs AS (
    SELECT date_trunc(v_trunc, p.created_at) AS b, count(*) AS subs FROM public.profiles p GROUP BY 1
  )
  SELECT to_char(buckets.b, v_fmt),
         buckets.b,
         COALESCE(subs.subs, 0),
         COALESCE(rev.orders_count, 0),
         COALESCE(rev.revenue_cents, 0),
         COALESCE(rev.ambassador_cents, 0),
         COALESCE(rev.agency_cents, 0)
    FROM buckets
    LEFT JOIN rev ON rev.b = buckets.b
    LEFT JOIN subs ON subs.b = buckets.b
   ORDER BY buckets.b;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_revenue_metrics(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_revenue_metrics(text) TO authenticated;

-- 5. Product performance (admin only, real data)
CREATE OR REPLACE FUNCTION public.admin_product_performance()
RETURNS TABLE (product text, sold bigint, revenue_cents bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT o.product, count(*)::bigint, COALESCE(sum(l.eligible_cents),0)::bigint
    FROM public.orders o
    JOIN public.revenue_ledger l ON l.order_id = o.id AND l.payout_status <> 'reversed'
   GROUP BY o.product
   ORDER BY 3 DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_product_performance() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_product_performance() TO authenticated;