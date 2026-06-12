import { useState } from "react";
import { Crown, Lock, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { FREE_AVATARS, PREMIUM_AVATARS, AVATAR_PRICE_CENTS, type AvatarPreset } from "@/lib/avatars";
import { setAvatar } from "@/lib/profile.functions";
import { createAvatarCheckout } from "@/lib/stripe.functions";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentUrl: string | null;
  ownedAvatarIds: string[];
  onSaved: () => void;
};

export function AvatarPicker({ open, onClose, userId, currentUrl, ownedAvatarIds, onSaved }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const checkoutFn = useServerFn(createAvatarCheckout);
  const setAvatarFn = useServerFn(setAvatar);

  if (!open) return null;

  const apply = async (a: AvatarPreset) => {
    setBusy(a.id);
    try {
      await setAvatarFn({ data: { avatarId: a.id } });
      toast.success("Avatar mis à jour");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(null);
    }
  };

  const buy = async (a: AvatarPreset) => {
    setBusy(a.id);
    try {
      const { url } = await checkoutFn({ data: { avatarId: a.id } });
      if (url) window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur paiement");
      setBusy(null);
    }
  };

  const Tile = ({ a }: { a: AvatarPreset }) => {
    const owned = !a.premium || ownedAvatarIds.includes(a.id);
    const isCurrent = currentUrl === a.url;
    return (
      <button
        onClick={() => (owned ? apply(a) : buy(a))}
        disabled={busy !== null}
        className={`group relative aspect-square overflow-hidden rounded-xl border bg-surface transition hover:scale-105 disabled:opacity-50 ${
          isCurrent ? "border-primary ring-2 ring-primary/50" : "border-border"
        }`}
      >
        <img src={a.url} alt="" className="h-full w-full object-cover" />
        {a.premium && !owned && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/70 backdrop-blur-[2px]">
            <Lock className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-semibold text-primary">1 $</span>
          </div>
        )}
        {isCurrent && (
          <div className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </div>
        )}
        {a.premium && owned && !isCurrent && (
          <Crown className="absolute right-1 top-1 h-4 w-4 text-amber-400 drop-shadow" />
        )}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 shadow-soft sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Choisir un avatar</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              2 gratuits inclus. 20 avatars premium à {(AVATAR_PRICE_CENTS / 100).toFixed(0)} $ chacun — débloqués à vie.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Gratuits</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {FREE_AVATARS.map((a) => <Tile key={a.id} a={a} />)}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Crown className="h-3 w-3 text-amber-400" /> Premium · 1 $
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {PREMIUM_AVATARS.map((a) => <Tile key={a.id} a={a} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
