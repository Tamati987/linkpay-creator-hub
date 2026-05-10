import { useState } from "react";
import { toast } from "sonner";
import { Download, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  sellerId,
}: {
  product: Product;
  sellerId: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const buy = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("purchases").insert({
      product_id: product.id,
      seller_id: sellerId,
      buyer_email: email,
      amount_cents: product.price_cents,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Merci pour votre achat !");
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

          {done ? (
            <div className="rounded-xl border border-border bg-card p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Download className="h-4 w-4" /> Achat confirmé
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Un email avec le lien de téléchargement vous sera envoyé.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="email"
                placeholder="Votre email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
              />
              <button
                onClick={buy}
                disabled={loading || !email}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gradient-button text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {loading
                  ? "Traitement…"
                  : `Acheter — ${formatPrice(product.price_cents)}`}
              </button>
              <p className="text-center text-[11px] text-muted-foreground">
                Démo : aucun paiement réel n'est traité.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
