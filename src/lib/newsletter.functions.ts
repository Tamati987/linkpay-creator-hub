import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      email: z.string().email().max(254),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: creator } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!creator) throw new Error("Créateur introuvable.");

    // Authenticated subscribers can only subscribe their own account's email.
    // This prevents anonymous attackers from mass-subscribing arbitrary addresses.
    const { data: claims } = { data: context.claims } as { data: { email?: string } };
    const authEmail = (claims?.email ?? "").trim().toLowerCase();
    const requestedEmail = data.email.trim().toLowerCase();
    if (!authEmail || authEmail !== requestedEmail) {
      throw new Error("Vous ne pouvez vous inscrire qu'avec l'adresse email de votre compte.");
    }

    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ user_id: data.userId, email: requestedEmail });

    if (error && error.code !== "23505") {
      console.error("[newsletter] insert failed", error);
      throw new Error("Impossible de s'inscrire. Réessayez plus tard.");
    }

    return { ok: true };
  });
