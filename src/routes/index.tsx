import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Link2, ShoppingBag, Sparkles, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-button shadow-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">LinkPay</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground"
          >
            Se connecter
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-button px-3.5 py-2 font-medium text-primary-foreground shadow-glow"
          >
            Commencer <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-24 pt-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          La nouvelle façon de monétiser votre audience
        </div>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          Une page.
          <br />
          <span className="bg-gradient-to-r from-primary to-pink-300 bg-clip-text text-transparent">
            Tous vos liens. Vos produits.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          LinkPay réunit vos réseaux et vos ventes digitales dans une page
          ultra-élégante, pensée pour mobile.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-button px-5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Créer ma page <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/demo"
            className="inline-flex h-11 items-center rounded-xl border border-border bg-surface px-5 text-sm font-medium text-foreground transition hover:bg-surface-elevated"
          >
            Voir un exemple
          </Link>
        </div>

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-3">
          {[
            {
              icon: Link2,
              title: "Tous vos liens",
              desc: "Instagram, YouTube, TikTok, Substack… en un endroit.",
            },
            {
              icon: ShoppingBag,
              title: "Vendez vos produits",
              desc: "E-books, presets, formations. Prix affiché, achat en un clic.",
            },
            {
              icon: Wallet,
              title: "Suivez vos gains",
              desc: "Tableau de bord clair pour piloter vos revenus.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
