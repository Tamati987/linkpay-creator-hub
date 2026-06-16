import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Loader2, MessageCircle, Minus, Phone, Send, Video, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  listConversations,
  listMessages,
  sendMessage,
} from "@/lib/messages.functions";
import { createVideoRoom } from "@/lib/video-call.functions";

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

type DockState = {
  listOpen: boolean;
  openThreads: string[]; // otherIds, most recent first; max 2 visible on desktop, 1 on mobile
};

let externalToggle: (() => void) | null = null;
let externalOpenThread: ((id: string) => void) | null = null;
export function openMessengerDock() {
  externalToggle?.();
}
export function openMessengerThread(id: string) {
  externalOpenThread?.(id);
}

function Avatar({ p, size = 36 }: { p: Profile | null; size?: number }) {
  const s = `${size}px`;
  if (!p) return <div style={{ width: s, height: s }} className="rounded-full bg-muted" />;
  if (p.avatar_url) {
    return (
      <img
        src={p.avatar_url}
        alt=""
        style={{ width: s, height: s }}
        className="rounded-full object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: s, height: s }}
      className="grid place-items-center rounded-full bg-muted text-xs font-semibold"
    >
      {(p.display_name || p.username).slice(0, 2).toUpperCase()}
    </div>
  );
}

function renderMessageBody(body: string) {
  const parts = body.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      const isCall = part.includes("daily.co");
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline ${isCall ? "font-semibold" : ""}`}
        >
          {isCall ? "Rejoindre l'appel vidéo" : part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });

export function MessengerDock() {
  const { user } = useAuth();
  const fetchConvos = useServerFn(listConversations);
  const [state, setState] = useState<DockState>({ listOpen: false, openThreads: [] });
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);

  const reloadConvos = () => {
    setLoadingConvos(true);
    fetchConvos()
      .then((r) => setConvos(r.conversations as Conversation[]))
      .finally(() => setLoadingConvos(false));
  };

  useEffect(() => {
    externalToggle = () => {
      setState((s) => ({ ...s, listOpen: !s.listOpen }));
      if (!convos.length) reloadConvos();
    };
    externalOpenThread = (id: string) => {
      setState((s) => ({
        listOpen: false,
        openThreads: [id, ...s.openThreads.filter((x) => x !== id)].slice(0, 2),
      }));
    };
    return () => {
      externalToggle = null;
      externalOpenThread = null;
    };
  }, [convos.length]);

  useEffect(() => {
    if (!user) return;
    reloadConvos();
    const channel = supabase
      .channel(`dock-msgs:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const m = payload.new;
          if (m.sender_id === user.id || m.recipient_id === user.id) {
            reloadConvos();
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (!user) return null;

  const closeThread = (id: string) =>
    setState((s) => ({ ...s, openThreads: s.openThreads.filter((x) => x !== id) }));

  return (
    <>
      {/* Conversation list popup */}
      {state.listOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-lg font-bold">Discussions</h3>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, listOpen: false }))}
              className="grid h-8 w-8 place-items-center rounded-full hover:bg-accent"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loadingConvos ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
              </div>
            ) : convos.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Aucune conversation. Recherchez quelqu'un pour commencer.
              </div>
            ) : (
              <ul>
                {convos.map((c) => (
                  <li key={c.otherId}>
                    <button
                      type="button"
                      onClick={() => openMessengerThread(c.otherId)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-accent"
                    >
                      <Avatar p={c.profile} size={44} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="truncate text-sm font-semibold">
                            {c.profile.display_name || c.profile.username}
                          </span>
                          {c.unread > 0 && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div
                          className={`truncate text-xs ${
                            c.unread > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {c.lastBody}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            to="/messages"
            onClick={() => setState((s) => ({ ...s, listOpen: false }))}
            className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-accent"
          >
            Voir tous les messages
          </Link>
        </div>
      )}

      {/* Floating bubble button (hidden when list is open) */}
      {!state.listOpen && (
        <button
          type="button"
          onClick={() => {
            setState((s) => ({ ...s, listOpen: true }));
            reloadConvos();
          }}
          aria-label="Ouvrir Messenger"
          className="fixed bottom-4 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:scale-105 md:hidden"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      )}

      {/* Chat windows */}
      <div className="pointer-events-none fixed bottom-0 right-4 z-40 flex items-end gap-2 sm:right-[calc(1rem+0px)]">
        {state.openThreads.map((id, idx) => (
          <ChatWindow
            key={id}
            otherId={id}
            offsetClass={idx === 0 ? "" : "hidden sm:flex"}
            onClose={() => closeThread(id)}
          />
        ))}
      </div>
    </>
  );
}

function ChatWindow({
  otherId,
  onClose,
  offsetClass,
}: {
  otherId: string;
  onClose: () => void;
  offsetClass: string;
}) {
  const { user } = useAuth();
  const fetchMessages = useServerFn(listMessages);
  const send = useServerFn(sendMessage);
  const createRoom = useServerFn(createVideoRoom);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [other, setOther] = useState<Profile | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [startingCall, setStartingCall] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetchMessages({ data: { otherId } })
      .then((r) => {
        setMessages(r.messages as Msg[]);
        setOther(r.other as Profile | null);
      })
      .finally(() => setLoading(false));
  }, [otherId]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`window:${user.id}:${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: any) => {
          const m = payload.new as Msg;
          const involvesPair =
            (m.sender_id === user.id && m.recipient_id === otherId) ||
            (m.sender_id === otherId && m.recipient_id === user.id);
          if (involvesPair) setMessages((arr) => (arr.some((x) => x.id === m.id) ? arr : [...arr, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, otherId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, minimized]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || sending) return;
    setSending(true);
    try {
      const r = await send({ data: { recipientId: otherId, body: body.trim() } });
      setMessages((arr) => [...arr, r.message as Msg]);
      setBody("");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  const onStartVideoCall = async () => {
    if (startingCall) return;
    setStartingCall(true);
    // Open tab synchronously so popup blockers don't intercept
    const win = window.open("about:blank", "_blank");
    try {
      const { url } = await createRoom();
      if (win) win.location.href = url;
      else window.open(url, "_blank");
      const msgBody = `📹 Appel vidéo : rejoignez ici → ${url}`;
      const r = await send({ data: { recipientId: otherId, body: msgBody } });
      setMessages((arr) => [...arr, r.message as Msg]);
      toast.success("Appel vidéo créé");
    } catch (err: any) {
      if (win) win.close();
      toast.error(err?.message ?? "Impossible de créer l'appel vidéo");
    } finally {
      setStartingCall(false);
    }
  };

  return (
    <div
      className={`pointer-events-auto ${offsetClass} flex w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-card shadow-2xl`}
      style={{ height: minimized ? 48 : 440 }}
    >
      <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Avatar p={other} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {other?.display_name || other?.username || "…"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">Actif récemment</div>
          </div>
        </button>
        <button
          type="button"
          aria-label="Appel"
          onClick={() => toast.info("Appel vocal bientôt disponible")}
          className="grid h-7 w-7 place-items-center rounded-full text-primary hover:bg-accent"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Appel vidéo"
          onClick={onStartVideoCall}
          disabled={startingCall}
          className="grid h-7 w-7 place-items-center rounded-full text-primary hover:bg-accent disabled:opacity-50"
        >
          {startingCall ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          aria-label="Réduire"
          className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent"
        >
          {minimized ? <ChevronDown className="h-4 w-4 rotate-180" /> : <Minus className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="grid h-7 w-7 place-items-center rounded-full hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {!minimized && (
        <>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
              </div>
            ) : messages.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Démarrez la conversation 👋
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-1.5 text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="whitespace-pre-wrap break-words">{renderMessageBody(m.body)}</div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={endRef} />
          </div>
          <form onSubmit={onSend} className="flex items-center gap-1.5 border-t border-border p-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Aa"
              maxLength={4000}
              className="flex-1 rounded-full bg-muted px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={!body.trim() || sending}
              className="grid h-9 w-9 place-items-center rounded-full text-primary hover:bg-accent disabled:opacity-50"
              aria-label="Envoyer"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
