import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { subscribeToNewsletter } from "@/lib/newsletter.functions";

export function NewsletterBlock({ userId }: { userId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const subscribe = useServerFn(subscribeToNewsletter);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await subscribe({ data: { userId, email } });
      setDone(true);
      toast.success("Inscription confirmée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible de s'inscrire.");
    } finally {
      setLoading(false);
    }
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
