import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Loader2, X, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Result = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_pro: boolean;
};

export function UserSearchBar({
  className = "",
  placeholder = "Rechercher un utilisateur…",
}: {
  className?: string;
  placeholder?: string;
}) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_pro")
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(8);
      setResults((data ?? []) as Result[]);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-full border border-border glass px-3 py-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          aria-label="Rechercher un utilisateur"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            aria-label="Effacer"
            className="text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-glow">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.id} className="flex items-center gap-1 pr-2 transition hover:bg-accent">
                  <Link
                    to="/$username"
                    params={{ username: r.username }}
                    onClick={() => setOpen(false)}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2"
                  >
                    {r.avatar_url ? (
                      <img
                        src={r.avatar_url}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-xs font-semibold">
                        {(r.display_name || r.username).slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {r.display_name || r.username}
                        {r.is_pro && (
                          <span className="ml-1 text-xs text-primary">✓</span>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        @{r.username}
                      </div>
                    </div>
                  </Link>
                  {user && user.id !== r.id && (
                    <Link
                      to="/messages"
                      search={{ to: r.id }}
                      onClick={() => setOpen(false)}
                      aria-label={`Écrire à ${r.username}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-primary hover:text-primary-foreground"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
