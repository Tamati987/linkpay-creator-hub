ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_profile_billing_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user <> 'service_role' THEN
    NEW.is_pro := OLD.is_pro;
    NEW.stripe_customer_id := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
    NEW.purchased_avatars := OLD.purchased_avatars;
    NEW.stripe_connect_account_id := OLD.stripe_connect_account_id;
    NEW.stripe_connect_charges_enabled := OLD.stripe_connect_charges_enabled;
    NEW.stripe_connect_payouts_enabled := OLD.stripe_connect_payouts_enabled;
  END IF;
  RETURN NEW;
END;
$function$;