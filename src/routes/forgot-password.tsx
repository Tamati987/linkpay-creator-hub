import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — Zeno" },
      { name: "description", content: "Réinitialisez votre mot de passe Zeno par email." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Email envoyé. Vérifiez votre boîte de réception.");
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

        <h1 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        {sent ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
            Si un compte est associé à <span className="text-foreground">{email}</span>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 space-y-3">
            <div>
              <label htmlFor="forgot-email" className="sr-only">Email</label>
              <input
                id="forgot-email"
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <button
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-button text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Vous vous souvenez de votre mot de passe ?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
