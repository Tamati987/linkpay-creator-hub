import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, UserPlus, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  getFriendshipState,
  sendFriendRequest,
  acceptFriendRequest,
  declineOrCancelFriendRequest,
} from "@/lib/friends.functions";

type Status = "self" | "none" | "pending_outgoing" | "pending_incoming" | "accepted";

export function FriendButton({
  profileId,
  theme,
}: {
  profileId: string;
  theme: { card: string };
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const getState = useServerFn(getFriendshipState);
  const send = useServerFn(sendFriendRequest);
  const accept = useServerFn(acceptFriendRequest);
  const cancel = useServerFn(declineOrCancelFriendRequest);

  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setStatus("none");
      return;
    }
    let alive = true;
    getState({ data: { profileId } }).then((r) => {
      if (alive) setStatus(r.status as Status);
    });
    return () => {
      alive = false;
    };
  }, [user?.id, profileId]);

  if (status === "self" || status === null) return null;

  const run = async (fn: () => Promise<unknown>, next: Status, msg: string) => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setBusy(true);
    try {
      await fn();
      setStatus(next);
      toast.success(msg);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const base = `inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60`;

  if (status === "none") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(() => send({ data: { profileId } }), "pending_outgoing", "Demande envoyée")
        }
        className={`${base} bg-gradient-button text-primary-foreground hover:scale-[1.03]`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Ajouter
      </button>
    );
  }

  if (status === "pending_outgoing") {
    return (
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          run(() => cancel({ data: { profileId } }), "none", "Demande annulée")
        }
        className={`${base} border border-current/20 ${theme.card}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
        En attente
      </button>
    );
  }

  if (status === "pending_incoming") {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            run(() => accept({ data: { profileId } }), "accepted", "Vous êtes amis !")
          }
          className={`${base} bg-gradient-button text-primary-foreground hover:scale-[1.03]`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Accepter
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => cancel({ data: { profileId } }), "none", "Demande refusée")}
          className={`${base} border border-current/20 ${theme.card}`}
          aria-label="Refuser"
        >
          <UserX className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // accepted
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => run(() => cancel({ data: { profileId } }), "none", "Ami retiré")}
      className={`${base} border border-current/20 ${theme.card}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
      Amis
    </button>
  );
}
