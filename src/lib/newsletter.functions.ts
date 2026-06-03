import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const subscribeToNewsletter = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      email: z.string().email().max(254),
    }).parse,
  )
  .handler(async ({ data }) => {
    const { data: creator } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!creator) throw new Error("Créateur introuvable.");

    const email = data.email.trim().toLowerCase();

    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ user_id: data.userId, email });

    if (error && error.code !== "23505") {
      console.error("[newsletter] insert failed", error);
      throw new Error("Impossible de s'inscrire. Réessayez plus tard.");
    }

    return { ok: true };
  });
