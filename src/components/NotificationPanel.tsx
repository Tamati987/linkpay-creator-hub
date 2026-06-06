import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bell, X, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  listNotifications,
  markAllRead as markAllReadFn,
  markRead as markReadFn,
} from "@/lib/notifications.functions";

type Actor = { username: string; display_name: string; avatar_url: string | null } | null;
type Notif = {
  id: string;
  actor_id: string | null;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
  actor: Actor;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString("fr-FR");
}

export function NotificationPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const fetchList = useServerFn(listNotifications);
  const markAll = useServerFn(markAllReadFn);
  const markOne = useServerFn(markReadFn);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Hide on public profile page ("/$username")
  const hideOnProfile = useMemo(() => {
    return routerState.matches.some((m) => m.routeId === "/$username");
  }, [routerState.matches]);

  const unread = items.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) return;
    fetchList()
      .then((r) => {
        setItems(r.notifications as Notif[]);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user?.id]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload: any) => {
          const row = payload.new as Notif;
          let actor: Actor = null;
          if (row.actor_id) {
            const { data } = await supabase
              .from("profiles")
              .select("username, display_name, avatar_url")
              .eq("id", row.actor_id)
              .maybeSingle();
            if (data) actor = data as Actor;
          }
          const full: Notif = { ...row, actor };
          setItems((prev) => [full, ...prev].slice(0, 50));
          toast(`🔔 ${row.message}`, {
            action: row.link
              ? {
                  label: "Voir",
                  onClick: () => navigate({ to: row.link! as string } as any),
                }
              : undefined,
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleClickItem = async (n: Notif) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
      markOne({ data: { id: n.id } }).catch(() => {});
    }
    if (n.link) navigate({ to: n.link as string } as any);
    setOpen(false);
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    try {
      await markAll();
    } catch {
      // ignore
    }
  };

  if (!user || hideOnProfile) return null;

  return (
    <>
      {/* Bell button — fixed left desktop, bottom-left mobile */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="fixed bottom-4 left-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-border bg-card/90 shadow-lg backdrop-blur transition hover:bg-card md:bottom-auto md:top-1/2 md:-translate-y-1/2"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed bottom-20 left-4 z-50 flex h-[70vh] max-h-[600px] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl md:bottom-auto md:left-20 md:top-1/2 md:-translate-y-1/2">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <h2 className="text-sm font-semibold">Notifications</h2>
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAll}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Tout lire
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="grid h-7 w-7 place-items-center rounded-md transition hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              {!loaded ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Aucune activité récente.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClickItem(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/50 ${
                          !n.is_read ? "bg-primary/5" : ""
                        }`}
                      >
                        {n.actor?.avatar_url ? (
                          <img
                            src={n.actor.avatar_url}
                            alt=""
                            className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                            {(n.actor?.display_name || n.actor?.username || "?")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug">{n.message}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
