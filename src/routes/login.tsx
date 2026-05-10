import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard" });
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

        <h1 className="text-2xl font-semibold tracking-tight">Bon retour</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez-vous pour gérer votre page.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <button
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-button text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?{" "}
          <Link to="/signup" className="text-foreground underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
