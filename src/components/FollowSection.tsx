import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  getFollowState,
  isFollowing as isFollowingFn,
  followUser,
  unfollowUser,
} from "@/lib/follow.functions";

function formatCount(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function FollowSection({
  profileId,
  isOwner,
  theme,
}: {
  profileId: string;
  isOwner: boolean;
  theme: { card: string; muted: string; accent: string };
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const getState = useServerFn(getFollowState);
  const checkFollowing = useServerFn(isFollowingFn);
  const doFollow = useServerFn(followUser);
  const doUnfollow = useServerFn(unfollowUser);

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [iFollow, setIFollow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getState({ data: { profileId } }).then((r) => {
      if (!alive) return;
      setFollowers(r.followerCount);
      setFollowing(r.followingCount);
    });
    if (user && !isOwner) {
      checkFollowing({ data: { profileId } }).then((r) => {
        if (alive) setIFollow(r.isFollowing);
      });
    }
    return () => {
      alive = false;
    };
  }, [profileId, user?.id]);

  const handleClick = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      if (iFollow) {
        await doUnfollow({ data: { profileId } });
        setIFollow(false);
        setFollowers((c) => Math.max(0, c - 1));
      } else {
        await doFollow({ data: { profileId } });
        setIFollow(true);
        setFollowers((c) => c + 1);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="flex items-center gap-5 text-sm">
        <div className="flex flex-col items-center">
          <span className="font-semibold">{formatCount(followers)}</span>
          <span className={`text-xs ${theme.muted}`}>abonnés</span>
        </div>
        <div className="h-8 w-px bg-current/10" />
        <div className="flex flex-col items-center">
          <span className="font-semibold">{formatCount(following)}</span>
          <span className={`text-xs ${theme.muted}`}>abonnements</span>
        </div>
      </div>

      {!isOwner && (
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow-glow transition disabled:opacity-60 ${
            iFollow
              ? `border border-current/20 ${theme.card}`
              : `bg-gradient-button text-primary-foreground hover:scale-[1.03]`
          }`}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : iFollow ? (
            <UserCheck className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {iFollow ? "Abonné" : "Suivre"}
        </button>
      )}
    </div>
  );
}
