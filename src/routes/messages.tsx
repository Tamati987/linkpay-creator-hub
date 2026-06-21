import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, MessageCircle, Phone, Send, Video } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  listConversations,
  listMessages,
  sendMessage,
} from "@/lib/messages.functions";
import { createVideoRoom } from "@/lib/video-call.functions";

export const Route = createFileRoute("/messages")({
  validateSearch: z.object({ to: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Messages — Zeno" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MessagesPage,
});

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};
type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_pro: boolean;
};
type Conversation = {
  otherId: string;
  lastBody: string;
  lastAt: string;
  unread: number;
  profile: Profile;
};

function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { to } = useSearch({ from: "/messages" });

  const fetchConvos = useServerFn(listConversations);
  const fetchMessages = useServerFn(listMessages);
  const send = useServerFn(sendMessage);

  const [convos, setConvos] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(to ?? null);
  const [active, setActive] = useState<{ messages: Msg[]; other: Profile | null }>({
    messages: [],
    other: null,
  });
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchConvos()
      .then((r) => setConvos(r.conversations as Conversation[]))
      .finally(() => setLoadingConvos(false));
  }, [user?.id]);

  useEffect(() => {
    if (to) setActiveId(to);
  }, [to]);

  const loadThread = (otherId: string) => {
    setLoadingThread(true);
    fetchMessages({ data: { otherId } })
      .then((r) => {
        setActive({ messages: r.messages as Msg[], other: r.other as Profile | null });
        setConvos((cs) => cs.map((c) => (c.otherId === otherId ? { ...c, unread: 0 } : c)));
      })
      .finally(() => setLoadingThread(false));
  };

  useEffect(() => {
    if (!activeId) return;
    loadThread(activeId);
  }, [activeId]);

  // Realtime new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`messages:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg;
          if (m.sender_id !== user.id && m.recipient_id !== user.id) return;
          const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
          if (activeId === other) {
            setActive((s) => ({ ...s, messages: [...s.messages, m] }));
          }
          // refresh convo list
          fetchConvos().then((r) => setConvos(r.conversations as Conversation[]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active.messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !body.trim() || sending) return;
    setSending(true);
    try {
      const r = await send({ data: { recipientId: activeId, body: body.trim() } });
      setActive((s) => ({ ...s, messages: [...s.messages, r.message as Msg] }));
      setBody("");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  const activeProfile = active.other;
  const showThread = !!activeId;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:py-6">
        <div className="mb-4 flex items-center gap-3">
          <Link
            to="/dashboard"
            className="grid h-9 w-9 place-items-center rounded-full border border-border hover:bg-accent"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold">Messages</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-[320px_1fr]">
          {/* Conversations list */}
          <aside
            className={`${
              showThread ? "hidden md:block" : "block"
            } rounded-2xl border border-border bg-card`}
          >
            {loadingConvos ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
              </div>
            ) : convos.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-6 w-6 opacity-60" />
                Aucune conversation pour le moment.
                <br />
                Recherchez un utilisateur pour lui écrire.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {convos.map((c) => (
                  <li key={c.otherId}>
                    <button
                      type="button"
                      onClick={() => setActiveId(c.otherId)}
                      className={`flex w-full items-center gap-3 p-3 text-left transition hover:bg-accent ${
                        activeId === c.otherId ? "bg-accent" : ""
                      }`}
                    >
                      {c.profile.avatar_url ? (
                        <img
                          src={c.profile.avatar_url}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-sm font-semibold">
                          {(c.profile.display_name || c.profile.username)
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {c.profile.display_name || c.profile.username}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {timeAgo(c.lastAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {c.lastBody}
                          </span>
                          {c.unread > 0 && (
                            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Thread */}
          <section
            className={`${
              showThread ? "block" : "hidden md:block"
            } flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card`}
          >
            {!activeId ? (
              <div className="m-auto p-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-60" />
                Sélectionnez une conversation
              </div>
            ) : (
              <>
                <header className="flex items-center gap-3 border-b border-border p-3">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent md:hidden"
                    aria-label="Retour"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  {activeProfile && (
                    <Link
                      to="/$username"
                      params={{ username: activeProfile.username }}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      {activeProfile.avatar_url ? (
                        <img
                          src={activeProfile.avatar_url}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-muted text-xs font-semibold">
                          {(activeProfile.display_name || activeProfile.username)
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {activeProfile.display_name || activeProfile.username}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          @{activeProfile.username}
                        </div>
                      </div>
                    </Link>
                  )}
                </header>

                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {loadingThread ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
                    </div>
                  ) : active.messages.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      Démarrez la conversation 👋
                    </div>
                  ) : (
                    active.messages.map((m) => {
                      const mine = m.sender_id === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex ${mine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                              mine
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">{m.body}</div>
                            <div
                              className={`mt-0.5 text-[10px] ${
                                mine ? "text-primary-foreground/70" : "text-muted-foreground"
                              }`}
                            >
                              {new Date(m.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={endRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="flex items-center gap-2 border-t border-border p-3"
                >
                  <input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Écrire un message…"
                    maxLength={4000}
                    className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={!body.trim() || sending}
                    className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground transition hover:scale-105 disabled:opacity-50"
                    aria-label="Envoyer"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 604800) return `${Math.floor(s / 86400)} j`;
  return d.toLocaleDateString();
}
