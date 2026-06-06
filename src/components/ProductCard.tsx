import { useState } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";

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
    currency: "EUR",
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
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/[0.06]"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-16 w-16 flex-none rounded-xl object-cover"
          />
        ) : (
          <div className="h-16 w-16 flex-none rounded-xl bg-gradient-to-br from-fuchsia-500/40 to-violet-600/40" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{product.title}</div>
          {product.description && (
            <div className="mt-0.5 line-clamp-2 text-xs text-white/60">
              {product.description}
            </div>
          )}
        </div>
        <div className="flex flex-none items-center gap-1.5">
          <span className="text-sm font-semibold tabular-nums text-fuchsia-300">
            {formatPrice(product.price_cents)}
          </span>
          <ChevronRight className="h-4 w-4 text-white/40" />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 bg-black/30 px-4 py-3">
          <a
            href={product.payout_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 text-sm font-medium text-white shadow-[0_0_30px_-5px_rgba(217,70,239,0.6)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Acheter — {formatPrice(product.price_cents)}
          </a>
        </div>
      )}
    </div>
  );
}
