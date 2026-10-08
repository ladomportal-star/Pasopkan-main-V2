-- Retire the empty lowercase Drizzle tables after the Prisma schema has been
-- deployed. Keep this migration safe for both the existing Supabase project
-- and a fresh database where these tables never existed.
BEGIN;

DO $$
DECLARE
  legacy_table text;
  row_count bigint;
BEGIN
  FOREACH legacy_table IN ARRAY ARRAY[
    'check_ins', 'coupons', 'event_dates', 'events', 'notifications',
    'order_items', 'orders', 'organizers', 'payments', 'ticket_tiers', 'users'
  ] LOOP
    IF to_regclass(format('public.%I', legacy_table)) IS NOT NULL THEN
      EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE', legacy_table);
      EXECUTE format('SELECT count(*) FROM public.%I', legacy_table) INTO row_count;
      IF row_count <> 0 THEN
        RAISE EXCEPTION 'Refusing to remove non-empty legacy table public.% (% rows)',
          legacy_table, row_count;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- RESTRICT prevents removing any object outside this reviewed table set.
DROP TABLE IF EXISTS
  public.check_ins,
  public.coupons,
  public.event_dates,
  public.events,
  public.notifications,
  public.order_items,
  public.orders,
  public.organizers,
  public.payments,
  public.ticket_tiers,
  public.users
RESTRICT;

COMMIT;
