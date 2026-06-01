import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Créer un compte — Zeno" },
      { name: "description", content: "Réservez votre nom d'utilisateur Zeno en 30 secondes et créez votre page de liens premium." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Créer un compte — Zeno" },
      { property: "og:description", content: "Créez votre page Zeno en 30 secondes." },
      { property: "og:url", content: "https://zenolinkkitapp.com/signup" },
    ],
    links: [{ rel: "canonical", href: "https://zenolinkkitapp.com/signup" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanUsername = username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 30);
    if (cleanUsername.length < 3) {
      toast.error("Le username doit faire au moins 3 caractères (a-z, 0-9, _)");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { username: cleanUsername, display_name: cleanUsername },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé ! Vérifiez votre email pour confirmer.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Accueil
      </Link>

      <div className="mx-auto mt-12 max-w-sm">
        <div className="mb-8">
          <ZenoLogo />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Créez votre page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réservez votre nom d'utilisateur en 30 secondes.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <div>
            <label htmlFor="signup-username" className="sr-only">Nom d'utilisateur</label>
            <div className="flex h-11 items-center overflow-hidden rounded-xl border border-border bg-surface px-3.5 text-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
              <span className="text-muted-foreground">zeno.app/</span>
              <input
                id="signup-username"
                required
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-transparent outline-none"
              />
            </div>
          </div>
          <div>
            <label htmlFor="signup-email" className="sr-only">Email</label>
            <input
              id="signup-email"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="sr-only">Mot de passe</label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={6}
              placeholder="Mot de passe (6+ caractères)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <button
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-button text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
