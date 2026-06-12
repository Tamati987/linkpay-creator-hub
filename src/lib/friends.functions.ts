import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_pro: boolean;
};

const uuid = z.object({ profileId: z.string().uuid() }).parse;

export const getFriendshipState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(uuid)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    if (me === data.profileId) {
      return { status: "self" as const, requesterId: null as string | null };
    }
    const { data: row } = await supabaseAdmin
      .from("friendships")
      .select("requester_id, addressee_id, status")
      .or(
        `and(requester_id.eq.${me},addressee_id.eq.${data.profileId}),and(requester_id.eq.${data.profileId},addressee_id.eq.${me})`,
      )
      .maybeSingle();
    if (!row) return { status: "none" as const, requesterId: null };
    if (row.status === "accepted") {
      return { status: "accepted" as const, requesterId: row.requester_id };
    }
    return {
      status: row.requester_id === me ? ("pending_outgoing" as const) : ("pending_incoming" as const),
      requesterId: row.requester_id,
    };
  });

export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(uuid)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    if (me === data.profileId) throw new Error("Impossible de s'ajouter soi-même.");
    const { data: existing } = await supabaseAdmin
      .from("friendships")
      .select("id, status, requester_id")
      .or(
        `and(requester_id.eq.${me},addressee_id.eq.${data.profileId}),and(requester_id.eq.${data.profileId},addressee_id.eq.${me})`,
      )
      .maybeSingle();
    if (existing) {
      if (existing.status === "accepted") throw new Error("Vous êtes déjà amis.");
      if (existing.requester_id === me) throw new Error("Demande déjà envoyée.");
      // Auto-accept if the other user already sent us a request
      const { error } = await supabaseAdmin
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { status: "accepted" as const };
    }
    const { error } = await supabaseAdmin
      .from("friendships")
      .insert({ requester_id: me, addressee_id: data.profileId, status: "pending" });
    if (error) throw new Error(error.message);
    return { status: "pending_outgoing" as const };
  });

export const acceptFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(uuid)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { error } = await supabaseAdmin
      .from("friendships")
      .update({ status: "accepted" })
      .eq("requester_id", data.profileId)
      .eq("addressee_id", me)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const declineOrCancelFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(uuid)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { error } = await supabaseAdmin
      .from("friendships")
      .delete()
      .or(
        `and(requester_id.eq.${me},addressee_id.eq.${data.profileId}),and(requester_id.eq.${data.profileId},addressee_id.eq.${me})`,
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFriend = declineOrCancelFriendRequest;

async function hydrate(ids: string[]) {
  if (ids.length === 0) return new Map<string, Profile>();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_pro")
    .in("id", ids);
  return new Map((data ?? []).map((p) => [p.id, p as Profile]));
}

export const listFriends = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { data: rows } = await supabaseAdmin
      .from("friendships")
      .select("requester_id, addressee_id, created_at")
      .eq("status", "accepted")
      .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
      .order("created_at", { ascending: false });
    const ids = (rows ?? []).map((r) => (r.requester_id === me ? r.addressee_id : r.requester_id));
    const byId = await hydrate(ids);
    return { friends: ids.map((id) => byId.get(id)).filter(Boolean) as Profile[] };
  });

export const listIncomingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { data: rows } = await supabaseAdmin
      .from("friendships")
      .select("requester_id, created_at")
      .eq("status", "pending")
      .eq("addressee_id", me)
      .order("created_at", { ascending: false });
    const ids = (rows ?? []).map((r) => r.requester_id);
    const byId = await hydrate(ids);
    return { requests: ids.map((id) => byId.get(id)).filter(Boolean) as Profile[] };
  });

export const listOutgoingRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const me = context.userId;
    const { data: rows } = await supabaseAdmin
      .from("friendships")
      .select("addressee_id, created_at")
      .eq("status", "pending")
      .eq("requester_id", me)
      .order("created_at", { ascending: false });
    const ids = (rows ?? []).map((r) => r.addressee_id);
    const byId = await hydrate(ids);
    return { requests: ids.map((id) => byId.get(id)).filter(Boolean) as Profile[] };
  });
