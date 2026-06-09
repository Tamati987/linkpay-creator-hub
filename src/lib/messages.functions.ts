import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { data: rows, error } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const map = new Map<string, { otherId: string; lastBody: string; lastAt: string; unread: number }>();
    for (const m of rows ?? []) {
      const other = m.sender_id === me ? m.recipient_id : m.sender_id;
      let entry = map.get(other);
      if (!entry) {
        entry = { otherId: other, lastBody: m.body, lastAt: m.created_at, unread: 0 };
        map.set(other, entry);
      }
      if (m.recipient_id === me && !m.read_at) entry.unread += 1;
    }
    const others = [...map.keys()];
    if (others.length === 0) return { conversations: [] };

    const { data: profs } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_pro")
      .in("id", others);
    const byId = new Map((profs ?? []).map((p) => [p.id, p]));
    const conversations = [...map.values()]
      .map((c) => ({ ...c, profile: byId.get(c.otherId) ?? null }))
      .filter((c) => c.profile);
    return { conversations };
  });

export const listMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ otherId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { data: rows, error } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${data.otherId}),and(sender_id.eq.${data.otherId},recipient_id.eq.${me})`,
      )
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, avatar_url, is_pro")
      .eq("id", data.otherId)
      .maybeSingle();

    await supabaseAdmin
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", me)
      .eq("sender_id", data.otherId)
      .is("read_at", null);

    return { messages: rows ?? [], other: prof };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      recipientId: z.string().uuid(),
      body: z.string().trim().min(1).max(4000),
    }).parse,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    if (me === data.recipientId) throw new Error("Impossible de s'envoyer un message.");

    // Enforce connection: at least one follow relation exists
    const { data: rel } = await supabaseAdmin
      .from("follows")
      .select("id")
      .or(
        `and(follower_id.eq.${me},following_id.eq.${data.recipientId}),and(follower_id.eq.${data.recipientId},following_id.eq.${me})`,
      )
      .limit(1)
      .maybeSingle();
    if (!rel) throw new Error("Vous devez suivre cet utilisateur (ou être suivi par lui) pour lui envoyer un message.");

    const { data: row, error } = await supabaseAdmin
      .from("messages")
      .insert({ sender_id: me, recipient_id: data.recipientId, body: data.body })
      .select("id, sender_id, recipient_id, body, read_at, created_at")
      .single();
    if (error) throw new Error(error.message);
    return { message: row };
  });

export const getUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", context.userId)
      .is("read_at", null);
    return { count: count ?? 0 };
  });
