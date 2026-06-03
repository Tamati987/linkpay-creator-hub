import { useState } from "react";
import { ExternalLink, ShoppingBag } from "lucide-react";

type Product = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  image_url?: string | null;
  payout_url?: string | null;
};

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export function ProductCard({
  product,
}: {
  product: Product;
  sellerId: string;
}) {
  const [open, setOpen] = useState(false);

  if (!product.payout_url) return null;

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
            <div className="text-xs text-muted-foreground">Produit digital</div>
          </div>
        </div>
        <span className="rounded-lg bg-accent px-2.5 py-1 text-sm font-semibold tabular-nums">
          {formatPrice(product.price_cents)}
        </span>
      </button>

      {open && (
        <div className="border-t border-border bg-surface px-4 py-4">
          {product.description && (
            <p className="mb-3 text-sm text-muted-foreground">{product.description}</p>
          )}
          <a
            href={product.payout_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-button text-sm font-medium text-primary-foreground shadow-glow"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Acheter — {formatPrice(product.price_cents)}
          </a>
        </div>
      )}
    </div>
  );
}
