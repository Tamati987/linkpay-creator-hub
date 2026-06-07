import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getOwnPurchasedAvatars = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("purchased_avatars")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Impossible de charger le profil.");
    return { purchasedAvatars: (data?.purchased_avatars ?? []) as string[] };
  });
