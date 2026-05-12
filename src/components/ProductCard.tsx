import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { ShoppingBag } from "lucide-react";
import { createProductCheckout } from "@/lib/stripe.functions";

type Product = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  image_url?: string | null;
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export function ProductCard({
  product,
  sellerId: _sellerId,
}: {
  product: Product;
  sellerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const startCheckout = useServerFn(createProductCheckout);

  const buy = async () => {
    if (!email || !accepted) return;
    setLoading(true);
    try {
      const { url } = await startCheckout({
        data: { productId: product.id, email, acceptedRetraction: true },
      });
      if (url) window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {product.image_url && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="block w-full overflow-hidden"
          aria-label={product.title}
        >
          <img
            src={product.image_url}
            alt={product.title}
            className="aspect-[16/9] w-full object-cover transition hover:opacity-95"
          />
        </button>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-surface-elevated"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-button shadow-glow">
            <ShoppingBag className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-semibold">{product.title}</div>
            <div className="text-xs text-muted-foreground">
              Produit digital
            </div>
          </div>
        </div>
        <span className="rounded-lg bg-accent px-2.5 py-1 text-sm font-semibold tabular-nums">
          {formatPrice(product.price_cents)}
        </span>
      </button>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-4">
          {product.description && (
            <p className="mb-3 text-sm text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="space-y-2">
            <input
              type="email"
              placeholder="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
            <label className="flex items-start gap-2 px-1 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary"
              />
              <span>
                Je renonce expressément à mon droit de rétractation de 14 jours,
                le contenu numérique étant fourni immédiatement après paiement.
              </span>
            </label>
            <button
              onClick={buy}
              disabled={loading || !email || !accepted}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gradient-button text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {loading
                ? "Redirection…"
                : `Acheter — ${formatPrice(product.price_cents)}`}
            </button>
            <p className="text-center text-[11px] text-muted-foreground">
              Paiement sécurisé par Stripe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
