import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("id, actor_id, type, message, link, is_read, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);

    const actorIds = Array.from(
      new Set((data ?? []).map((n) => n.actor_id).filter(Boolean) as string[]),
    );
    let actors: Record<string, { username: string; display_name: string; avatar_url: string | null }> = {};
    if (actorIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", actorIds);
      for (const p of profs ?? []) {
        actors[p.id] = {
          username: p.username,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        };
      }
    }

    return {
      notifications: (data ?? []).map((n) => ({
        ...n,
        actor: n.actor_id ? actors[n.actor_id] ?? null : null,
      })),
    };
  });

export const markAllRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", context.userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getNotificationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("notification_settings")
      .select("new_link, new_product, new_follow, profile_update")
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      settings: data ?? {
        new_link: true,
        new_product: true,
        new_follow: true,
        profile_update: true,
      },
    };
  });

export const updateNotificationSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      new_link: z.boolean(),
      new_product: z.boolean(),
      new_follow: z.boolean(),
      profile_update: z.boolean(),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("notification_settings")
      .upsert({ user_id: context.userId, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
