import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Check, Sparkles, X, ArrowLeft, ShoppingBag, PlayCircle, Mail,
  Globe, EyeOff, BellRing, Crown, BarChart3,
} from "lucide-react";
import { ZenoLogo } from "@/components/ZenoLogo";
import { supabase } from "@/integrations/supabase/client";

const PAYPAL_PRO_CHECKOUT_URL = "https://www.paypal.com/ncp/payment/DP894ECPS5JSU";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Tarifs — Zeno Pro" },
      {
        name: "description",
        content:
          "Comparez Zeno Gratuit et Zeno Pro : liens illimités, vidéos intégrées, 0% de frais, branding retiré, statistiques avancées.",
      },
      { property: "og:title", content: "Zeno Pro — 9$/mois" },
      {
        property: "og:description",
        content: "La puissance multimédia pour une fraction du prix.",
      },
      { property: "og:url", content: "https://zenolinkkitapp.com/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://zenolinkkitapp.com/pricing" }],
  }),
  component: PricingPage,
});

function PricingPage() {
  const startCheckout = useServerFn(createProCheckout);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const goPro = async () => {
    setLoading(true);
    const checkoutWindow = window.open("", "_blank");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        checkoutWindow?.close();
        navigate({ to: "/login" });
        return;
      }
      const { url } = await startCheckout();
      if (url) {
        if (checkoutWindow) checkoutWindow.location.href = url;
        else window.location.href = url;
      } else {
        checkoutWindow?.close();
      }
    } catch (e: any) {
      checkoutWindow?.close();
      toast.error(e?.message || "Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/"><ZenoLogo size="sm" /></Link>
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border glass px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Tarifs simples & transparents
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            La puissance multimédia, sans le prix
          </h1>
          <p className="mt-3 text-balance text-sm text-muted-foreground">
            Ne payez plus des abonnements hors de prix pour des fonctions
            basiques.{" "}
            <span className="font-medium text-foreground">
              Zeno Pro vous offre la puissance multimédia pour une fraction du
              coût.
            </span>
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          {/* FREE */}
          <div className="rounded-2xl glass p-6 shadow-soft">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Gratuit</h2>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">0$</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Pour démarrer et tester votre audience.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Feature included>2 liens réseaux sociaux (Facebook, Instagram…)</Feature>
              <Feature included>1 lien vidéo (YouTube, TikTok…)</Feature>
              <Feature>Branding Zeno visible</Feature>
              <Feature missing>Site internet public</Feature>
              <Feature missing>Vente de produits digitaux</Feature>
              <Feature missing>Vidéos lisibles dans la page</Feature>
              <Feature missing>Newsletter & capture d'emails</Feature>
              <Feature missing>Domaine personnalisé</Feature>
              <Feature missing>Statistiques avancées</Feature>
            </ul>

            <Link
              to="/signup"
              className="mt-7 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-elevated"
            >
              Commencer gratuitement
            </Link>
          </div>

          {/* PRO */}
          <div className="relative rounded-2xl border border-primary/60 glass-strong p-6 shadow-glow">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-gradient-button px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow-glow">
              <Crown className="h-3 w-3" /> Recommandé
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wider text-primary">Zeno Pro</h2>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Tout inclus
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">9$</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Vendez, capturez et convertissez sans aucune limite.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <HeroFeature icon={PlayCircle} label="Vidéos intégrées" />
              <HeroFeature icon={ShoppingBag} label="Ventes 0% frais" />
              <HeroFeature icon={Mail} label="Newsletter" />
              <HeroFeature icon={Globe} label="Domaine perso" />
              <HeroFeature icon={EyeOff} label="Zéro branding" />
              <HeroFeature icon={BarChart3} label="Stats avancées" />
            </div>

            <ul className="mt-6 space-y-3 text-sm">
              <Feature included highlight>Liens réseaux sociaux & vidéos illimités</Feature>
              <Feature included highlight>Lecteur vidéo intégré : YouTube, TikTok, Twitch, Vimeo</Feature>
              <Feature included highlight>Vente directe de produits digitaux (PDF, e-books)</Feature>
              <Feature included highlight>Bloc Newsletter pour capturer les emails</Feature>
              <Feature included highlight>0% de commission sur les ventes</Feature>
              <Feature included highlight>Suppression totale du branding Zeno</Feature>
              <Feature included>Importer son propre nom de domaine</Feature>
              <Feature included>Statistiques détaillées</Feature>
              <Feature included>Notifications email à chaque vente</Feature>
              <Feature included>Support prioritaire</Feature>
            </ul>

            <button
              onClick={goPro}
              disabled={loading}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-button px-5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.01] hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
            >
              <Crown className="h-4 w-4" /> {loading ? "Redirection…" : "Passer à Zeno Pro"}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Annulable à tout moment. Sans engagement.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted-foreground">
          Tous les plans incluent l'hébergement, le SSL et les mises à jour
          automatiques. <BellRing className="inline h-3 w-3" />
        </p>
      </main>
    </div>
  );
}

function HeroFeature({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface/60 px-2.5 py-2">
      <Icon className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
      <span className="truncate text-[11px] font-medium text-foreground">{label}</span>
    </div>
  );
}

function Feature({
  children, included, missing, highlight,
}: { children: React.ReactNode; included?: boolean; missing?: boolean; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      {missing ? (
        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/60" />
      ) : (
        <Check className={`mt-0.5 h-4 w-4 flex-shrink-0 ${included ? (highlight ? "text-primary" : "text-foreground") : "text-muted-foreground"}`} />
      )}
      <span className={missing ? "text-muted-foreground/70 line-through" : highlight ? "font-medium text-foreground" : "text-foreground/90"}>
        {children}
      </span>
    </li>
  );
}
