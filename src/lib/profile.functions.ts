import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ALL_AVATARS, getAvatar } from "@/lib/avatars";

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

export const setAvatar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ avatarId: z.string().min(1).max(50) }).parse)
  .handler(async ({ data, context }) => {
    const avatar = getAvatar(data.avatarId);
    if (!avatar) throw new Error("Avatar invalide");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (avatar.premium) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("purchased_avatars")
        .eq("id", context.userId)
        .maybeSingle();
      const owned = (profile?.purchased_avatars ?? []) as string[];
      if (!owned.includes(avatar.id)) {
        throw new Error("Avatar non débloqué");
      }
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ avatar_url: avatar.url })
      .eq("id", context.userId);
    if (error) throw new Error("Impossible de mettre à jour l'avatar.");

    return { ok: true, url: avatar.url };
  });
