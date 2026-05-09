import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, X, ArrowLeft } from "lucide-react";

// TODO: remplacer par le vrai lien Stripe Checkout fourni par l'utilisateur
const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/test_placeholder";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs — LinkPay Pro" },
      {
        name: "description",
        content:
          "Comparez LinkPay Gratuit et Pro. Liens illimités, 0% de commission, statistiques détaillées et domaine personnalisé.",
      },
      { property: "og:title", content: "Tarifs — LinkPay Pro" },
      {
        property: "og:description",
        content: "Passez à LinkPay Pro pour 9$/mois. Économisez 15$/mois vs Linktree.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-button shadow-glow">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">LinkPay</span>
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-elevated"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Tarifs simples
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Choisissez le plan qui vous fait grandir
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Commencez gratuitement. Passez à Pro quand vos ventes décollent.
            <span className="ml-1 font-medium text-foreground">
              Économisez 15$/mois vs Linktree.
            </span>
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          {/* FREE */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gratuit
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">0$</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pour démarrer et tester votre audience.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Feature included>Jusqu'à 5 liens</Feature>
              <Feature included>Page publique mobile-first</Feature>
              <Feature included>Vente de produits digitaux</Feature>
              <Feature>Commission de 5% sur les ventes</Feature>
              <Feature>Branding LinkPay visible</Feature>
              <Feature missing>Statistiques détaillées</Feature>
              <Feature missing>Domaine personnalisé</Feature>
            </ul>

            <Link
              to="/signup"
              className="mt-7 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-elevated"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* PRO */}
          <div className="relative rounded-2xl border border-primary/50 bg-card p-6 shadow-glow">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-button px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-glow">
              Recommandé
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-wider text-primary">
                Pro
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                -15$/mois vs Linktree
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">9$</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pour les créateurs qui veulent maximiser leurs revenus.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Feature included>Liens illimités</Feature>
              <Feature included highlight>
                0% de commission sur les ventes
              </Feature>
              <Feature included highlight>Suppression du branding LinkPay</Feature>
              <Feature included highlight>Statistiques détaillées</Feature>
              <Feature included highlight>Domaine personnalisé</Feature>
              <Feature included>Thèmes premium</Feature>
              <Feature included>Support prioritaire</Feature>
            </ul>

            <a
              href={STRIPE_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-button px-4 text-sm font-medium text-primary-foreground shadow-glow transition hover:opacity-95"
            >
              <Sparkles className="h-3.5 w-3.5" /> Devenir Pro
            </a>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Annulable à tout moment. Sans engagement.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted-foreground">
          Une question ? Tous les plans incluent l'hébergement, le SSL et les
          mises à jour automatiques.
        </p>
      </main>
    </div>
  );
}

function Feature({
  children,
  included,
  missing,
  highlight,
}: {
  children: React.ReactNode;
  included?: boolean;
  missing?: boolean;
  highlight?: boolean;
}) {
  return (
    <li className="flex items-start gap-2">
      {missing ? (
        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
      ) : (
        <Check
          className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
            included ? (highlight ? "text-primary" : "text-foreground") : "text-muted-foreground"
          }`}
        />
      )}
      <span
        className={
          missing
            ? "text-muted-foreground/70 line-through"
            : highlight
              ? "font-medium text-foreground"
              : "text-foreground/90"
        }
      >
        {children}
      </span>
    </li>
  );
}
