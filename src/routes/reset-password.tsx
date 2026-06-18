import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — Zeno" },
      { name: "description", content: "Définissez un nouveau mot de passe pour votre compte Zeno." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-exchanges the recovery link and emits PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Le mot de passe doit faire au moins 6 caractères");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen px-6 py-6">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Connexion
      </Link>

      <div className="mx-auto mt-12 max-w-sm">
        <div className="mb-8">
          <ZenoLogo />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready
            ? "Choisissez un nouveau mot de passe pour votre compte."
            : "Validation du lien de réinitialisation…"}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <div>
            <label htmlFor="new-password" className="sr-only">Nouveau mot de passe</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!ready}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="sr-only">Confirmer</label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={!ready}
              className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-60"
            />
          </div>
          <button
            disabled={loading || !ready}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-button text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {loading ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </form>
      </div>
    </div>
  );
}
