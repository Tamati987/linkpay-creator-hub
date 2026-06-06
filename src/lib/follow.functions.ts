import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getFollowState = createServerFn({ method: "POST" })
  .inputValidator(z.object({ profileId: z.string().uuid() }).parse)
  .handler(async ({ data }) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabaseAdmin
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", data.profileId),
      supabaseAdmin
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", data.profileId),
    ]);
    return {
      followerCount: followers ?? 0,
      followingCount: following ?? 0,
    };
  });

export const isFollowing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ profileId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { data: row } = await supabaseAdmin
      .from("follows")
      .select("id")
      .eq("follower_id", context.userId)
      .eq("following_id", data.profileId)
      .maybeSingle();
    return { isFollowing: !!row };
  });

export const followUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ profileId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    if (data.profileId === context.userId) {
      throw new Error("Vous ne pouvez pas vous suivre vous-même");
    }
    const { error } = await supabaseAdmin
      .from("follows")
      .insert({ follower_id: context.userId, following_id: data.profileId });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const unfollowUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ profileId: z.string().uuid() }).parse)
  .handler(async ({ data, context }) => {
    const { error } = await supabaseAdmin
      .from("follows")
      .delete()
      .eq("follower_id", context.userId)
      .eq("following_id", data.profileId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
