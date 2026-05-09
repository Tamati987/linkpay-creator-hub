import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  BellRing,
  Check,
  Crown,
  EyeOff,
  ExternalLink,
  Eye,
  Globe,
  Image as ImageIcon,
  Lock,
  LogOut,
  Mail,
  Palette,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Timer,
  Trash2,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProLockModal } from "@/components/ProLockModal";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

type LinkRow = { id: string; title: string; url: string; position: number };
type ProductRow = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  file_path: string | null;
  image_url: string | null;
  position: number;
};

function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [lockedFeature, setLockedFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["dashboard", user?.id],
    queryFn: async () => {
      const uid = user!.id;
      const [{ data: profile }, { data: links }, { data: products }, { data: purchases }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase
            .from("links")
            .select("*")
            .eq("user_id", uid)
            .order("position", { ascending: true })
            .order("created_at", { ascending: true }),
          supabase
            .from("products")
            .select("*")
            .eq("user_id", uid)
            .order("position", { ascending: true })
            .order("created_at", { ascending: true }),
          supabase.from("purchases").select("amount_cents").eq("seller_id", uid),
        ]);
      return {
        profile: profile as Profile | null,
        links: (links ?? []) as LinkRow[],
        products: (products ?? []) as ProductRow[],
        earningsCents: (purchases ?? []).reduce(
          (s, p: { amount_cents: number }) => s + p.amount_cents,
          0
        ),
        salesCount: (purchases ?? []).length,
      };
    },
  });

  if (loading || !user || isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  const { profile, links, products, earningsCents, salesCount } = data;
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Profil introuvable.
      </div>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["dashboard", user.id] });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-button shadow-glow">
              <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold">LinkPay</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/pricing"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-button px-3 text-xs font-medium text-primary-foreground shadow-glow"
            >
              <Crown className="h-3.5 w-3.5" /> Business Ultime
            </Link>
            <Link
              to="/$username"
              params={{ username: profile.username }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium transition hover:bg-surface-elevated"
            >
              <Eye className="h-3.5 w-3.5" /> Voir ma page
            </Link>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Gains totaux" value={formatPrice(earningsCents)} icon={<Wallet className="h-4 w-4" />} />
          <Stat label="Ventes" value={salesCount.toString()} />
          <Stat
            label="Lien public"
            value={`linkpay/${profile.username}`}
            mono
          />
        </div>

        <ProfileSection profile={profile} onSaved={refresh} />
        <LinksSection userId={user.id} links={links} onChanged={refresh} />
        <ProductsSection userId={user.id} products={products} onChanged={refresh} />
        <ProFeaturesSection onLockedClick={setLockedFeature} />
      </main>

      <ProLockModal
        open={lockedFeature !== null}
        onClose={() => setLockedFeature(null)}
        feature={lockedFeature ?? undefined}
      />
    </div>
  );
}

function ProFeaturesSection({
  onLockedClick,
}: {
  onLockedClick: (feature: string) => void;
}) {
  const features = [
    { label: "Vente directe de produits", icon: ShoppingBag },
    { label: "Compte à rebours marketing", icon: Timer },
    { label: "Formulaire de capture d'emails", icon: Mail },
    { label: "Domaine personnalisé", icon: Globe },
    { label: "Suppression du branding", icon: EyeOff },
    { label: "Notifications email de ventes", icon: BellRing },
    { label: "Statistiques détaillées", icon: BarChart3 },
    { label: "Thèmes Premium", icon: Palette },
  ];
  return (
    <section className="rounded-2xl border border-primary/30 bg-card p-5 shadow-glow">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Crown className="h-3.5 w-3.5 text-primary" /> Business Ultime
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Le plan tout-en-un pour vendre, capturer et convertir.
          </p>
        </div>
        <Link
          to="/pricing"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-button px-3 text-xs font-medium text-primary-foreground shadow-glow"
        >
          <Crown className="h-3.5 w-3.5" /> Débloquer
        </Link>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {features.map((f) => (
          <button
            key={f.label}
            onClick={() => onLockedClick(f.label)}
            className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-surface p-3 text-left transition hover:border-primary/40 hover:bg-surface-elevated"
          >
            <div className="flex items-center gap-2 text-sm">
              <f.icon className="h-4 w-4 text-primary/80" />
              <span>{f.label}</span>
            </div>
            <Lock className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
          </button>
        ))}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div
        className={`mt-2 text-lg font-semibold tracking-tight ${mono ? "font-mono text-base" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProfileSection({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, bio, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profil mis à jour");
    onSaved();
  };

  const onAvatar = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (error) {
      setUploading(false);
      return toast.error(error.message);
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: e2 } = await supabase
      .from("profiles")
      .update({ avatar_url: pub.publicUrl })
      .eq("id", profile.id);
    setUploading(false);
    if (e2) return toast.error(e2.message);
    toast.success("Photo mise à jour");
    onSaved();
  };

  return (
    <Card title="Profil">
      <div className="flex items-start gap-4">
        <div className="relative">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="h-16 w-16 rounded-full border border-border object-cover"
              alt=""
            />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full border border-border bg-surface text-sm text-muted-foreground">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-gradient-button shadow-glow">
            <Upload className="h-3.5 w-3.5 text-primary-foreground" />
            <input
              type="file"
              accept="image/*"
              hidden
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])}
            />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nom affiché"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Votre bio (1-2 phrases)"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center rounded-lg bg-gradient-button px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function LinksSection({
  userId,
  links,
  onChanged,
}: {
  userId: string;
  links: LinkRow[];
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const add = async () => {
    if (!title || !url) return;
    const { error } = await supabase.from("links").insert({
      user_id: userId,
      title,
      url,
      position: links.length,
    });
    if (error) return toast.error(error.message);
    setTitle("");
    setUrl("");
    onChanged();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <Card title="Liens">
      <div className="space-y-2">
        {links.map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2"
          >
            <div className="flex-1 px-2 text-sm">
              <div className="font-medium">{l.title}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                {l.url}
              </div>
            </div>
            <button
              onClick={() => remove(l.id)}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {links.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Aucun lien encore. Ajoutez votre Instagram, YouTube…
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre (ex. Instagram)"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        />
        <button
          onClick={add}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-button px-3 text-xs font-medium text-primary-foreground shadow-glow"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
    </Card>
  );
}

function ProductsSection({
  userId,
  products,
  onChanged,
}: {
  userId: string;
  products: ProductRow[];
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const imagePreview = image ? URL.createObjectURL(image) : null;

  const add = async () => {
    const priceNum = parseFloat(price);
    if (!title || isNaN(priceNum) || priceNum < 0) {
      return toast.error("Titre et prix valides requis");
    }
    setLoading(true);
    let filePath: string | null = null;
    if (file) {
      if (file.size > MAX_PRODUCT_FILE_BYTES) {
        setLoading(false);
        return toast.error(PRODUCT_FILE_TOO_LARGE_MSG);
      }
      const path = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from("products").upload(path, file);
      if (error) {
        setLoading(false);
        return toast.error(error.message);
      }
      filePath = path;
    }
    let imageUrl: string | null = null;
    if (image) {
      const ext = (image.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "jpg";
      const path = `${userId}/${Date.now()}-cover.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, image, {
        cacheControl: "3600",
      });
      if (error) {
        setLoading(false);
        return toast.error(error.message);
      }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }
    const { error } = await supabase.from("products").insert({
      user_id: userId,
      title,
      description,
      price_cents: Math.round(priceNum * 100),
      file_path: filePath,
      image_url: imageUrl,
      position: products.length,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setTitle("");
    setDescription("");
    setPrice("");
    setFile(null);
    setImage(null);
    onChanged();
    toast.success("Produit ajouté");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <Card title="Produits">
      <div className="space-y-2">
        {products.map((p) => (
          <ProductRowItem key={p.id} product={p} userId={userId} onChanged={onChanged} onRemove={remove} />
        ))}
        {products.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Aucun produit. Uploadez un e-book, un preset, une formation…
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du produit"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Prix € (ex. 19.90)"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description courte (optionnel)"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface px-3 text-xs text-muted-foreground transition hover:bg-surface-elevated">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="h-6 w-6 rounded object-cover" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            {image ? image.name : "Visuel (image)"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs text-muted-foreground transition hover:bg-surface-elevated">
            <Upload className="h-3.5 w-3.5" />
            {file ? file.name : "Fichier (PDF, ZIP…)"}
            <input
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button
            onClick={add}
            disabled={loading}
            className="ml-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-button px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" /> {loading ? "Ajout…" : "Ajouter le produit"}
          </button>
        </div>
      </div>
    </Card>
  );
}

const MAX_PRODUCT_FILE_BYTES = 25 * 1024 * 1024;
const PRODUCT_FILE_TOO_LARGE_MSG =
  "Pour garantir une vitesse de téléchargement optimale à vos clients, les fichiers sont limités à 25 Mo. Veuillez compresser votre PDF ou utiliser un lien externe.";

function sanitizeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "fichier";
  const ext = (dot > 0 ? name.slice(dot + 1) : "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);
  return ext ? `${base}.${ext}` : base;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    cents / 100
  );

function ProductRowItem({
  product,
  userId,
  onChanged,
  onRemove,
}: {
  product: ProductRow;
  userId: string;
  onChanged: () => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((product.price_cents / 100).toString());
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const imagePreview = image ? URL.createObjectURL(image) : product.image_url;

  const cancel = () => {
    setEditing(false);
    setTitle(product.title);
    setDescription(product.description);
    setPrice((product.price_cents / 100).toString());
    setImage(null);
  };

  const save = async () => {
    const priceNum = parseFloat(price);
    if (!title || isNaN(priceNum) || priceNum < 0) {
      return toast.error("Titre et prix valides requis");
    }
    setSaving(true);
    let imageUrl = product.image_url;
    if (image) {
      const ext = image.name.split(".").pop();
      const path = `${userId}/${Date.now()}-cover.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, image, { cacheControl: "3600" });
      if (upErr) {
        setSaving(false);
        return toast.error(upErr.message);
      }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }
    const { error } = await supabase
      .from("products")
      .update({
        title,
        description,
        price_cents: Math.round(priceNum * 100),
        image_url: imageUrl,
      })
      .eq("id", product.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Produit mis à jour");
    setEditing(false);
    setImage(null);
    onChanged();
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="h-12 w-12 rounded-md border border-border object-cover"
          />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-md border border-dashed border-border text-muted-foreground">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 px-2">
          <div className="text-sm font-medium">{product.title}</div>
          {product.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {product.description}
            </div>
          )}
        </div>
        <span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold tabular-nums">
          {formatPrice(product.price_cents)}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          aria-label="Modifier"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onRemove(product.id)}
          className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
          aria-label="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        <label className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-background">
          {imagePreview ? (
            <img src={imagePreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="flex-1 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="Prix €"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={cancel}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Annuler
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-button px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60"
        >
          <Check className="h-3.5 w-3.5" /> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
