import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Link2, PlayCircle, ShoppingBag, Sparkles, Wallet, Zap } from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zeno — Liens, vidéos et ventes en une page" },
      {
        name: "description",
        content:
          "Zeno réunit vos réseaux, vidéos YouTube/TikTok/Twitch et produits digitaux sur une page mobile ultra-rapide.",
      },
      { property: "og:title", content: "Zeno — Liens, vidéos et ventes en une page" },
      {
        property: "og:description",
        content:
          "Zeno réunit vos réseaux, vidéos YouTube/TikTok/Twitch et produits digitaux sur une page mobile ultra-rapide.",
      },
      { property: "og:url", content: "https://zenolinkkitapp.com/" },
    ],
    links: [{ rel: "canonical", href: "https://zenolinkkitapp.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Zeno",
              url: "https://zenolinkkitapp.com",
            },
            {
              "@type": "WebSite",
              name: "Zeno",
              url: "https://zenolinkkitapp.com",
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/">
          <ZenoLogo />
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/pricing"
            className="hidden rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground sm:inline"
          >
            Tarifs
          </Link>
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
        <div className="inline-flex items-center gap-2 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          La nouvelle plateforme de liens en bio
        </div>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          Une page.
          <br />
          <span className="bg-gradient-to-r from-primary to-pink-300 bg-clip-text text-transparent">
            Vos liens. Vos vidéos. Vos ventes.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Zeno réunit vos réseaux, vos vidéos YouTube/TikTok/Twitch et vos
          produits digitaux dans une page mobile ultra-rapide.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-button px-5 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Créer ma page Zeno <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex h-11 items-center rounded-xl border border-border glass px-5 text-sm font-medium text-foreground transition hover:bg-surface-elevated"
          >
            Voir les tarifs
          </Link>
        </div>

        <div className="mt-20 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Link2, title: "Tous vos liens", desc: "Réseaux sociaux, sites, blogs, en un endroit." },
            { icon: PlayCircle, title: "Vidéos intégrées", desc: "YouTube, TikTok, Twitch & Vimeo lisibles in-page." },
            { icon: ShoppingBag, title: "Ventes digitales", desc: "PDF, e-books, presets — achat en un clic." },
            { icon: Wallet, title: "0% de frais (Pro)", desc: "Gardez 100% de vos revenus." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl glass p-5 shadow-soft">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-3xl glass-strong p-8 text-left shadow-glow">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            <Zap className="h-3.5 w-3.5" /> Manifeste
          </div>
          <p className="mt-3 text-balance text-lg font-medium text-foreground sm:text-xl">
            Ne payez plus des abonnements hors de prix pour des fonctions basiques.
            <span className="text-muted-foreground">
              {" "}Zeno Pro vous offre la puissance multimédia pour une fraction du coût.
            </span>
          </p>
          <Link
            to="/pricing"
            className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-button px-4 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Découvrir Zeno Pro <Sparkles className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
