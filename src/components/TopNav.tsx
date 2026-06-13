import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Home, MessageCircle, PlaySquare, Users } from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";
import { UserSearchBar } from "@/components/UserSearchBar";
import { useAuth } from "@/lib/auth";
import { getUnreadCount } from "@/lib/messages.functions";
import { supabase } from "@/integrations/supabase/client";

export function TopNav({ onOpenMessenger }: { onOpenMessenger: () => void }) {
  const { user, profile } = useAuth() as any;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fetchUnread = useServerFn(getUnreadCount);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    fetchUnread().then((r) => alive && setUnread(r.count));
    const channel = supabase
      .channel(`nav-msgs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          if (payload.new?.recipient_id === user.id) {
            fetchUnread().then((r) => alive && setUnread(r.count));
          }
        },
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Accueil" },
    { to: "/messages", icon: Users, label: "Amis" },
    { to: "/dashboard", icon: PlaySquare, label: "Vidéos" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-3 sm:px-4">
        <Link to="/dashboard" className="shrink-0" aria-label="Accueil">
          <ZenoLogo size="sm" />
        </Link>
        <div className="hidden min-w-0 flex-1 max-w-xs sm:block">
          <UserSearchBar placeholder="Rechercher sur Zeno" />
        </div>

        <nav className="mx-auto hidden items-center gap-1 md:flex">
          {navItems.map((it) => {
            const active = pathname === it.to;
            const Icon = it.icon;
            return (
              <Link
                key={it.label}
                to={it.to}
                aria-label={it.label}
                className={`relative grid h-10 w-20 place-items-center rounded-xl transition hover:bg-accent ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-6 w-6" />
                {active && (
                  <span className="absolute -bottom-[14px] left-0 right-0 h-[3px] rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenMessenger}
            aria-label="Messenger"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-accent hover:bg-accent/70"
          >
            <MessageCircle className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
          <Link
            to="/dashboard"
            aria-label="Notifications"
            className="grid h-10 w-10 place-items-center rounded-full bg-accent hover:bg-accent/70"
          >
            <Bell className="h-5 w-5" />
          </Link>
          {profile?.username ? (
            <Link
              to="/$username"
              params={{ username: profile.username }}
              aria-label="Mon profil"
              className="ml-1 grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-accent ring-2 ring-transparent hover:ring-primary"
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">
                  {(profile.display_name || profile.username).slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
