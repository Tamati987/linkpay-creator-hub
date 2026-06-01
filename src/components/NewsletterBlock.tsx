import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function NewsletterBlock({ userId }: { userId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ user_id: userId, email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        // already subscribed — treat as success
      } else if (error.code === "23514") {
        toast.error("Adresse email invalide");
        return;
      } else {
        console.error("[newsletter] insert failed", error);
        toast.error("Impossible de s'inscrire. Réessayez plus tard.");
        return;
      }
    }
    setDone(true);
    toast.success("Inscription confirmée");
  };

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Mail className="h-4 w-4 text-primary" /> Rejoignez ma newsletter
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Recevez mes nouveautés et exclus directement par email.
      </p>
      {done ? (
        <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
          Merci ! Vous êtes inscrit.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex gap-2">
          <input
            type="email"
            required
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <button
            disabled={loading}
            className="inline-flex h-10 items-center rounded-lg bg-gradient-button px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {loading ? "…" : "S'inscrire"}
          </button>
        </form>
      )}
    </div>
  );
}
