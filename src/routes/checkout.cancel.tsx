import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/cancel")({
  head: () => ({ meta: [{ title: "Paiement annulé — Zeno" }] }),
  component: CancelPage,
});

function CancelPage() {
  return (
    <div className="min-h-screen grid place-items-center px-5">
      <div className="max-w-md text-center rounded-2xl glass p-8 shadow-soft">
        <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-semibold">Paiement annulé</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun montant n'a été débité. Vous pouvez réessayer à tout moment.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-border bg-surface px-5 text-sm font-medium hover:bg-surface-elevated"
        >
          Retour
        </Link>
      </div>
    </div>
  );
}
