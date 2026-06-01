import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  head: () => ({
    meta: [
      { title: "Achat confirmé — Zeno" },
      { name: "description", content: "Votre achat a été confirmé. Un email avec votre lien de téléchargement vous sera envoyé sous peu." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Achat confirmé — Zeno" },
      { property: "og:description", content: "Votre achat sur Zeno a bien été confirmé." },
      { property: "og:url", content: "https://zenolinkkitapp.com/checkout/success" },
    ],
    links: [{ rel: "canonical", href: "https://zenolinkkitapp.com/checkout/success" }],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <div className="min-h-screen grid place-items-center px-5">
      <div className="max-w-md text-center rounded-2xl glass p-8 shadow-soft">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">Merci pour votre achat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Un email avec votre lien de téléchargement vous sera envoyé sous peu.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-gradient-button px-5 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
