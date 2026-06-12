import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, MessageCircle, UserX, Users } from "lucide-react";
import { toast } from "sonner";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  acceptFriendRequest,
  declineOrCancelFriendRequest,
} from "@/lib/friends.functions";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_pro: boolean;
};

function Avatar({ p }: { p: Profile }) {
  if (p.avatar_url) {
    return <img src={p.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-xs font-semibold">
      {(p.display_name || p.username).slice(0, 2).toUpperCase()}
    </div>
  );
}

export function FriendsPanel({ theme }: { theme: { card: string; muted: string } }) {
  const fetchFriends = useServerFn(listFriends);
  const fetchIn = useServerFn(listIncomingRequests);
  const fetchOut = useServerFn(listOutgoingRequests);
  const accept = useServerFn(acceptFriendRequest);
  const remove = useServerFn(declineOrCancelFriendRequest);

  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<Profile[]>([]);
  const [outgoing, setOutgoing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"friends" | "requests">("friends");

  const reload = () =>
    Promise.all([fetchFriends(), fetchIn(), fetchOut()]).then(([f, i, o]) => {
      setFriends(f.friends as Profile[]);
      setIncoming(i.requests as Profile[]);
      setOutgoing(o.requests as Profile[]);
      setLoading(false);
    });

  useEffect(() => {
    reload();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      await accept({ data: { profileId: id } });
      toast.success("Vous êtes amis !");
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const handleRemove = async (id: string, msg: string) => {
    try {
      await remove({ data: { profileId: id } });
      toast.success(msg);
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  return (
    <div className={`mt-6 rounded-2xl border border-current/10 ${theme.card} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" />
          Amis
        </div>
        <div className="flex rounded-full border border-current/15 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTab("friends")}
            className={`rounded-full px-3 py-1 transition ${
              tab === "friends" ? "bg-gradient-button text-primary-foreground" : ""
            }`}
          >
            Amis ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`rounded-full px-3 py-1 transition ${
              tab === "requests" ? "bg-gradient-button text-primary-foreground" : ""
            }`}
          >
            Demandes ({incoming.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className={`flex items-center justify-center gap-2 py-6 text-xs ${theme.muted}`}>
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      ) : tab === "friends" ? (
        friends.length === 0 ? (
          <div className={`py-6 text-center text-xs ${theme.muted}`}>
            Aucun ami pour l'instant. Recherchez des utilisateurs pour leur envoyer une demande.
          </div>
        ) : (
          <ul className="space-y-2">
            {friends.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-current/10 p-2"
              >
                <Link
                  to="/$username"
                  params={{ username: p.username }}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar p={p} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {p.display_name || p.username}
                    </div>
                    <div className={`truncate text-xs ${theme.muted}`}>@{p.username}</div>
                  </div>
                </Link>
                <Link
                  to="/messages"
                  search={{ to: p.id }}
                  className="grid h-8 w-8 place-items-center rounded-full border border-current/15 hover:scale-105"
                  aria-label="Message"
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => handleRemove(p.id, "Ami retiré")}
                  className="grid h-8 w-8 place-items-center rounded-full border border-current/15 hover:scale-105"
                  aria-label="Retirer"
                >
                  <UserX className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-4">
          <div>
            <div className={`mb-2 text-xs font-semibold uppercase ${theme.muted}`}>
              Reçues
            </div>
            {incoming.length === 0 ? (
              <div className={`py-3 text-center text-xs ${theme.muted}`}>
                Aucune demande reçue.
              </div>
            ) : (
              <ul className="space-y-2">
                {incoming.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-current/10 p-2"
                  >
                    <Link
                      to="/$username"
                      params={{ username: p.username }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <Avatar p={p} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {p.display_name || p.username}
                        </div>
                        <div className={`truncate text-xs ${theme.muted}`}>@{p.username}</div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleAccept(p.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-gradient-button text-primary-foreground hover:scale-105"
                      aria-label="Accepter"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id, "Demande refusée")}
                      className="grid h-8 w-8 place-items-center rounded-full border border-current/15 hover:scale-105"
                      aria-label="Refuser"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className={`mb-2 text-xs font-semibold uppercase ${theme.muted}`}>
              Envoyées
            </div>
            {outgoing.length === 0 ? (
              <div className={`py-3 text-center text-xs ${theme.muted}`}>
                Aucune demande envoyée.
              </div>
            ) : (
              <ul className="space-y-2">
                {outgoing.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-current/10 p-2"
                  >
                    <Link
                      to="/$username"
                      params={{ username: p.username }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <Avatar p={p} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {p.display_name || p.username}
                        </div>
                        <div className={`truncate text-xs ${theme.muted}`}>@{p.username}</div>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(p.id, "Demande annulée")}
                      className="rounded-full border border-current/15 px-3 py-1 text-xs hover:scale-105"
                    >
                      Annuler
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
