import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check, Crown, ExternalLink, Eye, Globe, Image as ImageIcon, Lock, LogOut,
  Pencil, PlayCircle, Plus, Sparkles, Trash2, Upload, Wallet, X,
  Mail, Users,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProLockModal } from "@/components/ProLockModal";
import { ZenoLogo } from "@/components/ZenoLogo";
import { VideoEmbed } from "@/components/VideoEmbed";
import { inferLinkKind, isVideoUrl } from "@/lib/video";
import { detectSocialBrand } from "@/lib/social";
import { createPortalSession, createProCheckout } from "@/lib/stripe.functions";
import { AvatarPicker } from "@/components/AvatarPicker";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const FREE_SOCIAL_LIMIT = 2;
const FREE_VIDEO_LIMIT = 1;

type Profile = {
  id: string; username: string; display_name: string;
  bio: string; avatar_url: string | null; is_pro: boolean;
  stripe_customer_id: string | null;
  cover_url: string | null;
  purchased_avatars: string[] | null;
};
type LinkRow = { id: string; title: string; url: string; position: number; kind: "standard" | "social" | "video" };
type ProductRow = {
  id: string; title: string; description: string;
  price_cents: number; file_path: string | null; image_url: string | null; position: number;
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
      const [{ data: profile }, { data: links }, { data: products }, { data: purchases }, { count: subs }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase.from("links").select("*").eq("user_id", uid)
            .order("position", { ascending: true }).order("created_at", { ascending: true }),
          supabase.from("products").select("*").eq("user_id", uid)
            .order("position", { ascending: true }).order("created_at", { ascending: true }),
          supabase.from("purchases").select("amount_cents").eq("seller_id", uid),
          supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("user_id", uid),
        ]);
      return {
        profile: profile as Profile | null,
        links: (links ?? []) as LinkRow[],
        products: (products ?? []) as ProductRow[],
        earningsCents: (purchases ?? []).reduce((s, p: { amount_cents: number }) => s + p.amount_cents, 0),
        salesCount: (purchases ?? []).length,
        subscribersCount: subs ?? 0,
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

  const { profile, links, products, earningsCents, salesCount, subscribersCount } = data;
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Profil introuvable.
      </div>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["dashboard", user.id] });

  const togglePro = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_pro: !profile.is_pro })
      .eq("id", profile.id);
    if (error) return toast.error(error.message);
    toast.success(profile.is_pro ? "Mode Gratuit activé" : "Mode Pro activé (démo)");
    refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border glass">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
          <Link to="/"><ZenoLogo size="sm" /></Link>
          <div className="flex items-center gap-2">
            {profile.is_pro ? (
              <span className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 text-xs font-medium text-primary">
                <Crown className="h-3.5 w-3.5" /> Pro actif
              </span>
            ) : (
              <Link
                to="/pricing"
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-button px-3 text-xs font-medium text-primary-foreground shadow-glow"
              >
                <Crown className="h-3.5 w-3.5" /> Passer à Pro
              </Link>
            )}
            <Link
              to="/$username" params={{ username: profile.username }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium transition hover:bg-surface-elevated"
            >
              <Eye className="h-3.5 w-3.5" /> Ma page
            </Link>
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Gains" value={formatPrice(earningsCents)} icon={<Wallet className="h-4 w-4" />} />
          <Stat label="Ventes" value={salesCount.toString()} />
          <Stat label="Abonnés" value={subscribersCount.toString()} icon={<Users className="h-4 w-4" />} />
          <Stat label="Lien public" value={`zeno/${profile.username}`} mono />
        </div>

        <ProfileSection profile={profile} onSaved={refresh} />
        <LinksSection
          userId={user.id}
          links={links}
          isPro={profile.is_pro}
          onChanged={refresh}
          onLocked={setLockedFeature}
        />
        <WebsitesSection
          userId={user.id}
          links={links}
          onChanged={refresh}
        />
        <ProductsSection userId={user.id} products={products} onChanged={refresh} />

        <BillingSection
          isPro={profile.is_pro}
          hasSubscription={!!profile.stripe_customer_id}
          onToggleDemo={togglePro}
        />

      </main>

      <ProLockModal
        open={lockedFeature !== null}
        onClose={() => setLockedFeature(null)}
        feature={lockedFeature ?? undefined}
      />
    </div>
  );
}

function Stat({ label, value, icon, mono }: { label: string; value: string; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-2xl glass p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <div className={`mt-2 text-lg font-semibold tracking-tight ${mono ? "font-mono text-sm" : ""}`}>{value}</div>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl glass p-5 shadow-soft">
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
  const [username, setUsername] = useState(profile.username);
  const [usernameError, setUsernameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const navigate = useNavigate();

  const validateUsername = (val: string) => {
    if (!val) return "Nom d'utilisateur requis";
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return "Lettres, chiffres et underscores uniquement";
    if (val.length < 2 || val.length > 30) return "Entre 2 et 30 caractères";
    return "";
  };

  const save = async () => {
    const uErr = validateUsername(username);
    if (uErr) { setUsernameError(uErr); return; }
    setUsernameError("");
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: displayName, bio, username: username.toLowerCase(), updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      if (error.code === "23505") return toast.error("Ce nom d'utilisateur est déjà pris.");
      return toast.error(error.message);
    }
    toast.success("Profil mis à jour");
    if (username.toLowerCase() !== profile.username) {
      navigate({ to: "/dashboard" });
    }
    onSaved();
  };

  const uploadImage = async (
    file: File,
    kind: "avatar" | "cover",
  ) => {
    if (!file.type.startsWith("image/")) {
      return toast.error("Choisissez un fichier image (JPG, PNG, WebP…)");
    }
    if (file.size > 8 * 1024 * 1024) {
      return toast.error("Image trop lourde (max 8 Mo). Compressez-la et réessayez.");
    }
    setUploading(kind);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
    if (error) { setUploading(null); return toast.error(`Upload : ${error.message}`); }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const patch = kind === "avatar"
      ? { avatar_url: pub.publicUrl }
      : { cover_url: pub.publicUrl };
    const { error: e2 } = await supabase.from("profiles")
      .update(patch).eq("id", profile.id);
    setUploading(null);
    if (e2) return toast.error(e2.message);
    toast.success(kind === "avatar" ? "Photo mise à jour" : "Couverture mise à jour");
    onSaved();
  };

  const removeCover = async () => {
    const { error } = await supabase.from("profiles").update({ cover_url: null }).eq("id", profile.id);
    if (error) return toast.error(error.message);
    toast.success("Couverture retirée");
    onSaved();
  };

  return (
    <Card title="Profil">
      {/* Cover */}
      <div className="relative mb-4 h-32 overflow-hidden rounded-xl border border-border bg-surface-elevated">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            {profile.is_pro ? "Aucune photo de couverture" : "Photo de couverture réservée aux abonnés Pro"}
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-2">
          {profile.cover_url && profile.is_pro && (
            <button
              onClick={removeCover}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-background/80 px-2 text-[11px] backdrop-blur hover:bg-background"
            >
              <Trash2 className="h-3 w-3" /> Retirer
            </button>
          )}
          {profile.is_pro ? (
            <label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md bg-background/80 px-2 text-[11px] backdrop-blur hover:bg-background">
              <Upload className="h-3 w-3" />
              {uploading === "cover" ? "Envoi…" : profile.cover_url ? "Changer" : "Ajouter une couverture"}
              <input type="file" accept="image/*" hidden disabled={uploading !== null}
                onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
            </label>
          ) : (
            <Link to="/pricing"
              className="inline-flex h-8 items-center gap-1 rounded-md bg-gradient-button px-2 text-[11px] font-medium text-primary-foreground shadow-glow">
              <Crown className="h-3 w-3" /> Pro
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="relative">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="h-16 w-16 rounded-full border border-border object-cover" alt="" />
          ) : (
            <div className="grid h-16 w-16 place-items-center rounded-full border border-border bg-surface text-sm text-muted-foreground">
              {profile.username.slice(0, 2).toUpperCase()}
            </div>
          )}
          <label className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-gradient-button shadow-glow"
            title="Uploader une photo">
            {uploading === "avatar"
              ? <span className="text-[9px] text-primary-foreground">…</span>
              : <Upload className="h-3.5 w-3.5 text-primary-foreground" />}
            <input type="file" accept="image/*" hidden disabled={uploading !== null}
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
          </label>
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setPickerOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-elevated">
              <ImageIcon className="h-3.5 w-3.5" /> Choisir un avatar
            </button>
            <span className="self-center text-[11px] text-muted-foreground">
              2 gratuits · 20 premium à 1 $
            </span>
          </div>
          <div>
            <div className="flex h-10 w-full items-center overflow-hidden rounded-lg border border-border bg-surface focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
              <span className="pl-3 pr-1 text-sm text-muted-foreground">@</span>
              <input value={username} onChange={(e) => { setUsername(e.target.value); setUsernameError(validateUsername(e.target.value)); }} placeholder="nomutilisateur"
                className="h-full flex-1 bg-transparent pr-3 text-sm outline-none" />
            </div>
            {usernameError && <p className="mt-1 text-xs text-destructive">{usernameError}</p>}
          </div>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nom affiché"
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Votre bio (1-2 phrases)" rows={2}
            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
          <button onClick={save} disabled={saving}
            className="inline-flex h-9 items-center rounded-lg bg-gradient-button px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60">
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <AvatarPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        userId={profile.id}
        currentUrl={profile.avatar_url}
        ownedAvatarIds={profile.purchased_avatars ?? []}
        onSaved={onSaved}
      />
    </Card>
  );
}

function LinksSection({
  userId, links, isPro, onChanged, onLocked,
}: {
  userId: string; links: LinkRow[]; isPro: boolean;
  onChanged: () => void; onLocked: (feature: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  // Only social + video belong to this section
  const sectionLinks = links.filter((l) => l.kind === "social" || l.kind === "video");
  const socialCount = links.filter((l) => l.kind === "social").length;
  const videoCount = links.filter((l) => l.kind === "video").length;

  const detectedKind = url ? inferLinkKind(url) : "standard";
  const isWebsite = !!url && detectedKind === "standard";
  const wouldExceedSocial = !isPro && detectedKind === "social" && socialCount >= FREE_SOCIAL_LIMIT;
  const wouldExceedVideo = !isPro && detectedKind === "video" && videoCount >= FREE_VIDEO_LIMIT;
  const blocked = wouldExceedSocial || wouldExceedVideo;

  const add = async () => {
    if (!title || !url) return;
    const kind = inferLinkKind(url);
    if (kind === "standard")
      return toast.error("Cette URL n'est pas un réseau social ni une vidéo. Ajoutez-la dans « Sites internet ».");
    if (wouldExceedSocial) return onLocked("Liens réseaux sociaux illimités");
    if (wouldExceedVideo) return onLocked("Liens vidéo illimités");
    const { error } = await supabase.from("links").insert({
      user_id: userId, title, url, kind, position: links.length,
    });
    if (error) return toast.error(error.message);
    setTitle(""); setUrl("");
    onChanged();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <Card title="Réseaux sociaux & vidéos" action={
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Social {socialCount}{!isPro && `/${FREE_SOCIAL_LIMIT}`}</span>
        <span>•</span>
        <span>Vidéo {videoCount}{!isPro && `/${FREE_VIDEO_LIMIT}`}</span>
        {!isPro && <Lock className="h-3 w-3" />}
      </div>
    }>
      <div className="space-y-2">
        {sectionLinks.map((l) => (
          <div key={l.id} className="rounded-lg border border-border bg-surface p-2">
            <div className="flex items-center gap-2">
              <KindBadge kind={l.kind} url={l.url} />
              <div className="flex-1 px-1 text-sm">
                <div className="font-medium">{l.title}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{l.url}</span>
                </div>
              </div>
              <button onClick={() => remove(l.id)}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {l.kind === "video" && isVideoUrl(l.url) && (
              <div className="mt-2">
                <VideoEmbed url={l.url} />
              </div>
            )}
          </div>
        ))}
        {sectionLinks.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Ajoutez votre Instagram, Facebook, YouTube, TikTok, Twitch, X, LinkedIn…
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (YouTube, TikTok, Instagram, X…)"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
        <button onClick={add}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-button px-3 text-xs font-medium text-primary-foreground shadow-glow">
          {blocked ? <Lock className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {blocked ? "Pro requis" : "Ajouter"}
        </button>
      </div>

      {isWebsite && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          C'est un site internet — ajoutez-le dans la section « Sites internet » ci-dessous.
        </p>
      )}

      {url && isVideoUrl(url) && isPro && (
        <div className="mt-3">
          <p className="mb-1 text-[11px] text-muted-foreground">Aperçu vidéo :</p>
          <VideoEmbed url={url} />
        </div>
      )}

      {!isPro && (
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Plan Gratuit : {FREE_SOCIAL_LIMIT} réseaux sociaux + {FREE_VIDEO_LIMIT} vidéo. Passez à{" "}
          <Link to="/pricing" className="font-medium text-primary hover:underline">Zeno Pro</Link>{" "}
          pour des liens illimités.
        </p>
      )}
    </Card>
  );
}

function WebsitesSection({
  userId, links, onChanged,
}: { userId: string; links: LinkRow[]; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const websites = links.filter((l) => l.kind === "standard");

  const add = async () => {
    if (!title || !url) return;
    try { new URL(url); } catch { return toast.error("URL invalide (commencez par https://)"); }
    const { error } = await supabase.from("links").insert({
      user_id: userId, title, url, kind: "standard", position: links.length,
    });
    if (error) return toast.error(error.message);
    setTitle(""); setUrl("");
    onChanged();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <Card title="Sites internet" action={
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Globe className="h-3 w-3" /> {websites.length} site{websites.length > 1 ? "s" : ""}
      </span>
    }>
      <div className="space-y-2">
        {websites.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-elevated text-primary">
              <Globe className="h-4 w-4" />
            </span>
            <div className="flex-1 px-1 text-sm">
              <div className="font-medium">{l.title}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{l.url}</span>
              </div>
            </div>
            <button onClick={() => remove(l.id)}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {websites.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Ajoutez l'URL de votre site web, blog ou portfolio.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nom du site"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://mon-site.com"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
        <button onClick={add}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-button px-3 text-xs font-medium text-primary-foreground shadow-glow">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>
    </Card>
  );
}

function KindBadge({ kind, url }: { kind: LinkRow["kind"]; url?: string }) {
  if (kind === "video")
    return <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary"><PlayCircle className="h-4 w-4" /></span>;
  if (kind === "social") {
    const brand = url ? detectSocialBrand(url) : null;
    if (brand) {
      const Icon = brand.Icon;
      return (
        <span
          className="grid h-9 w-9 place-items-center rounded-md"
          style={{ backgroundColor: `${brand.color}1a`, color: brand.color }}
          title={brand.label}
        >
          <Icon className="h-4 w-4" />
        </span>
      );
    }
    return <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-foreground"><Sparkles className="h-4 w-4" /></span>;
  }
  return <span className="grid h-9 w-9 place-items-center rounded-md bg-surface-elevated text-muted-foreground"><Globe className="h-4 w-4" /></span>;
}

function ProductsSection({
  userId, products, onChanged,
}: { userId: string; products: ProductRow[]; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const imagePreview = image ? URL.createObjectURL(image) : null;

  const add = async () => {
    const priceNum = parseFloat(price);
    if (!title || isNaN(priceNum) || priceNum < 0) return toast.error("Titre et prix valides requis");
    setLoading(true);
    let filePath: string | null = null;
    if (file) {
      if (file.size > MAX_PRODUCT_FILE_BYTES) {
        setLoading(false); return toast.error(PRODUCT_FILE_TOO_LARGE_MSG);
      }
      const path = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from("products").upload(path, file);
      if (error) { setLoading(false); return toast.error(error.message); }
      filePath = path;
    }
    let imageUrl: string | null = null;
    if (image) {
      const ext = (image.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10) || "jpg";
      const path = `${userId}/${Date.now()}-cover.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, image, { cacheControl: "3600" });
      if (error) { setLoading(false); return toast.error(error.message); }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }
    const { error } = await supabase.from("products").insert({
      user_id: userId, title, description, price_cents: Math.round(priceNum * 100),
      file_path: filePath, image_url: imageUrl, position: products.length,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setTitle(""); setDescription(""); setPrice(""); setFile(null); setImage(null);
    onChanged();
    toast.success("Produit ajouté");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    onChanged();
  };

  return (
    <Card title="Produits digitaux" action={<span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="h-3 w-3" />Newsletter incluse en Pro</span>}>
      <div className="space-y-2">
        {products.map((p) => (
          <ProductRowItem key={p.id} product={p} userId={userId} onChanged={onChanged} onRemove={remove} />
        ))}
        {products.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Aucun produit. Uploadez un e-book, un PDF, un preset…
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du produit"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
          <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Prix $ (ex. 9.90)"
            className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
        </div>
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description courte (optionnel)"
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative inline-flex h-10 cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-border bg-surface px-3 text-xs text-muted-foreground transition hover:bg-surface-elevated">
            {imagePreview ? <img src={imagePreview} alt="" className="h-6 w-6 rounded object-cover" /> : <ImageIcon className="h-3.5 w-3.5" />}
            {image ? image.name : "Visuel (image)"}
            <input type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </label>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs text-muted-foreground transition hover:bg-surface-elevated">
            <Upload className="h-3.5 w-3.5" />
            {file ? file.name : "Fichier (PDF, ZIP…)"}
            <input type="file" hidden
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f && f.size > MAX_PRODUCT_FILE_BYTES) {
                  e.target.value = ""; toast.error(PRODUCT_FILE_TOO_LARGE_MSG); return;
                }
                setFile(f);
              }} />
          </label>
          <button onClick={add} disabled={loading}
            className="ml-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gradient-button px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60">
            <Plus className="h-3.5 w-3.5" /> {loading ? "Ajout…" : "Ajouter"}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Format PDF ou E-pub recommandé (max. 25 Mo).
        </p>
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
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 80) || "fichier";
  const ext = (dot > 0 ? name.slice(dot + 1) : "")
    .toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  return ext ? `${base}.${ext}` : base;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD" }).format(cents / 100);

function ProductRowItem({
  product, userId, onChanged, onRemove,
}: { product: ProductRow; userId: string; onChanged: () => void; onRemove: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((product.price_cents / 100).toString());
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const imagePreview = image ? URL.createObjectURL(image) : product.image_url;

  const cancel = () => {
    setEditing(false);
    setTitle(product.title); setDescription(product.description);
    setPrice((product.price_cents / 100).toString()); setImage(null);
  };

  const save = async () => {
    const priceNum = parseFloat(price);
    if (!title || isNaN(priceNum) || priceNum < 0) return toast.error("Titre et prix valides requis");
    setSaving(true);
    let imageUrl = product.image_url;
    if (image) {
      const ext = image.name.split(".").pop();
      const path = `${userId}/${Date.now()}-cover.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, image, { cacheControl: "3600" });
      if (upErr) { setSaving(false); return toast.error(upErr.message); }
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }
    const { error } = await supabase.from("products").update({
      title, description, price_cents: Math.round(priceNum * 100), image_url: imageUrl,
    }).eq("id", product.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Produit mis à jour");
    setEditing(false); setImage(null); onChanged();
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
        {product.image_url ? (
          <img src={product.image_url} alt="" className="h-12 w-12 rounded-md border border-border object-cover" />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-md border border-dashed border-border text-muted-foreground">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 px-2">
          <div className="text-sm font-medium">{product.title}</div>
          {product.description && <div className="text-xs text-muted-foreground line-clamp-1">{product.description}</div>}
        </div>
        <span className="rounded-md bg-accent px-2 py-1 text-xs font-semibold tabular-nums">{formatPrice(product.price_cents)}</span>
        <button onClick={() => setEditing(true)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => onRemove(product.id)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        <label className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-background">
          {imagePreview ? <img src={imagePreview} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>}
          <input type="file" accept="image/*" hidden onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </label>
        <div className="flex-1 space-y-2">
          <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
            <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Prix $"
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
          </div>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40" />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button onClick={cancel} disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground">
          <X className="h-3.5 w-3.5" /> Annuler
        </button>
        <button onClick={save} disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-button px-4 text-xs font-medium text-primary-foreground shadow-glow disabled:opacity-60">
          <Check className="h-3.5 w-3.5" /> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

function BillingSection({
  isPro, hasSubscription, onToggleDemo,
}: { isPro: boolean; hasSubscription: boolean; onToggleDemo: () => void }) {
  const startCheckout = useServerFn(createProCheckout);
  const openPortal = useServerFn(createPortalSession);
  const [loading, setLoading] = useState<"upgrade" | "portal" | null>(null);

  const upgrade = async () => {
    setLoading("upgrade");
    const checkoutWindow = window.open("", "_blank");
    try {
      const { url } = await startCheckout();
      if (url) {
        if (checkoutWindow) checkoutWindow.location.href = url;
        else window.location.href = url;
      } else {
        checkoutWindow?.close();
      }
    } catch (e: any) {
      checkoutWindow?.close();
      toast.error(e?.message || "Erreur");
    } finally {
      setLoading(null);
    }
  };

  const portal = async () => {
    setLoading("portal");
    try {
      const { url } = await openPortal();
      if (url) window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="rounded-2xl glass p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            {isPro ? "Abonnement Pro actif" : "Plan Gratuit"}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isPro
              ? "Gérer ou annuler votre abonnement à tout moment."
              : "Débloquez liens & vidéos illimités, 0% de commission."}
          </p>
        </div>
        {isPro && hasSubscription ? (
          <button
            onClick={portal}
            disabled={loading === "portal"}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-surface px-4 text-xs font-medium hover:bg-surface-elevated disabled:opacity-60"
          >
            {loading === "portal" ? "Chargement…" : "Gérer l'abonnement"}
          </button>
        ) : (
          <button
            onClick={upgrade}
            disabled={loading === "upgrade"}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gradient-button px-4 text-xs font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            <Crown className="h-3.5 w-3.5" />
            {loading === "upgrade" ? "Redirection…" : isPro ? "Activer le paiement Pro" : "Passer à Pro — 9$/mois"}
          </button>
        )}
      </div>
      <button
        onClick={onToggleDemo}
        className="mt-3 text-[11px] text-muted-foreground/70 hover:text-muted-foreground underline"
      >
        Démo : basculer Pro/Gratuit (sans paiement)
      </button>
    </section>
  );
}
