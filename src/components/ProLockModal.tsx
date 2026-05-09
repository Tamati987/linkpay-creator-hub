import { Crown, Lock, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ProLockModal({
  open,
  onClose,
  feature,
}: {
  open: boolean;
  onClose: () => void;
  feature?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-primary/40 bg-card p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-button shadow-glow">
          <Lock className="h-4 w-4 text-primary-foreground" />
        </div>

        <h3 className="text-lg font-semibold tracking-tight">
          {feature ?? "Cette fonctionnalité"} est réservée au plan Business Ultime
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Débloquez la vente directe, le compte à rebours, la capture de
          prospects, le domaine personnalisé et bien plus pour seulement{" "}
          <span className="font-semibold text-foreground">9$/mois</span>.
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/pricing"
            onClick={onClose}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-button px-4 text-sm font-medium text-primary-foreground shadow-glow"
          >
            <Crown className="h-3.5 w-3.5" /> Passer à Business Ultime
          </Link>
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm text-muted-foreground hover:text-foreground"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
