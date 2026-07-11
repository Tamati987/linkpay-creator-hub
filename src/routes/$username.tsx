import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BadgeCheck, Check, LayoutDashboard, MoreHorizontal, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { NewsletterBlock } from "@/components/NewsletterBlock";
import { WebsiteCard } from "@/components/WebsiteCard";
import { FollowSection } from "@/components/FollowSection";
import { FriendButton } from "@/components/FriendButton";
import { FriendsPanel } from "@/components/FriendsPanel";
import { UserSearchBar } from "@/components/UserSearchBar";
import { detectVideo } from "@/lib/video";
import { detectSocialBrand } from "@/lib/social";
import { getTheme } from "@/lib/themes";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  cover_url: string | null;
  is_pro: boolean;
  theme: string | null;
};

async function fetchProfile(username: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, cover_url, is_pro, theme")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw notFound();

  const [{ data: links }, { data: products }] = await Promise.all([
    supabase
      .from("links")
      .select("id, title, url, position, kind")
      .eq("user_id", profile.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("products")
      .select("id, title, description, price_cents, image_url, position, payout_url, shipping_cents, shipping_discount_cents")
      .eq("user_id", profile.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  return {
    profile: profile as Profile,
    links: links ?? [],
    products: products ?? [],
  };
}

const profileQueryOptions = (username: string) =>
  queryOptions({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile(username),
  });

export const Route = createFileRoute("/$username")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(profileQueryOptions(params.username)),
  head: ({ params, loaderData }) => {
    const url = `https://zenolinkkitapp.com/${params.username}`;
    if (!loaderData) {
      return {
        meta: [
          { title: `@${params.username} — Zeno` },
          { name: "robots", content: "noindex" },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const { profile, products } = loaderData;
    const name = profile.display_name || `@${profile.username}`;
    const title = `${name} (@${profile.username}) — Zeno`;
    const description =
      profile.bio?.trim() ||
      `Découvrez la page Zeno de ${name} : liens, vidéos et créations.`;
    const image = profile.avatar_url || profile.cover_url || undefined;

    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: "profile" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }

    const ld: Record<string, unknown>[] = [
      {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url,
        mainEntity: {
          "@type": "Person",
          name,
          alternateName: `@${profile.username}`,
          description: profile.bio || undefined,
          image: image || undefined,
          url,
        },
      },
      ...products.map((p) => ({
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.title,
        description: p.description || undefined,
        image: p.image_url || undefined,
        offers: {
          "@type": "Offer",
          price: (p.price_cents / 100).toFixed(2),
          priceCurrency: "USD",
        },
      })),
    ];

    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: ld.map((data) => ({
        type: "application/ld+json",
        children: JSON.stringify(data).replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\!--"),
      })),
    };
  },
  component: PublicProfileRoute,
});

function PublicProfileRoute() {
  const { username } = Route.useParams();
  return <PublicProfile key={username} />;
}

function PublicProfile() {
  const { username } = Route.useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const { data } = useSuspenseQuery(profileQueryOptions(username));



  const { profile, links, products } = data;
  const initials = (profile.display_name || profile.username)
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const isOwner = currentUserId === profile.id;
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined"
      ? window.location.href
      : `https://zenolinkkitapp.com/${profile.username}`;
    const title = `${profile.display_name || `@${profile.username}`} — Zeno`;
    const text = profile.bio || `Découvrez la page de @${profile.username}`;
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, text, url });
        return;
      }
    } catch {
      // user cancelled or share failed — fall back to copy
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const socials = links.filter((l) => l.kind === "social");
  const videos = links.filter((l) => l.kind === "video");
  const websites = links.filter((l) => l.kind === "standard");
  const theme = getTheme(profile.theme);

  return (
    <div className={`relative min-h-screen overflow-hidden ${theme.page} pb-20`}>
      {/* Photo de couverture en arrière-plan */}
      {profile.cover_url && (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 overflow-hidden">
          <img
            src={profile.cover_url}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-[var(--zeno-bg-dark,#000)]" />
        </div>
      )}

      {/* Halos décoratifs du thème */}
      {theme.halos.length > 0 && (
        <div className="pointer-events-none absolute inset-0 -z-0">
          {theme.halos.map((h, i) => <div key={i} className={h.className} />)}
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 mx-auto flex max-w-md items-center justify-between px-5 pt-5">
        <button
          type="button"
          onClick={handleShare}
          aria-label="Partager"
          className={`grid h-9 w-9 place-items-center rounded-full ${theme.card} transition`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </button>
        {isOwner ? (
          <Link
            to="/dashboard"
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${theme.card} transition`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Plus"
            className={`grid h-9 w-9 place-items-center rounded-full ${theme.card} transition`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="relative z-10 mx-auto mt-4 max-w-md px-5">
        <UserSearchBar placeholder="Rechercher d'autres utilisateurs…" />
      </div>


      <div className="relative z-10 mx-auto max-w-md px-5 pt-6">
        {/* Profil */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className={`absolute -inset-1 rounded-full ${theme.avatarRing} blur-md opacity-80`} />
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="relative h-24 w-24 rounded-full border-2 border-white/20 object-cover"
              />
            ) : (
              <div className="relative grid h-24 w-24 place-items-center rounded-full border-2 border-white/20 bg-black text-2xl font-semibold text-white">
                {initials}
              </div>
            )}
          </div>

          <h1 className="mt-4 flex items-center gap-1.5 text-xl font-bold tracking-tight">
            {profile.display_name || `@${profile.username}`}
            {profile.is_pro && (
              <BadgeCheck className={`h-5 w-5 ${theme.accent}`} />
            )}
          </h1>
          {profile.bio && (
            <p className={`mt-2 max-w-[18rem] text-balance text-sm ${theme.muted}`}>
              {profile.bio}
            </p>
          )}

          <FollowSection profileId={profile.id} isOwner={isOwner} theme={theme} />

          {!isOwner && currentUserId && (
            <div className="mt-3">
              <FriendButton profileId={profile.id} theme={theme} />
            </div>
          )}

          {/* Icônes sociales en ligne, sans cercle */}
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-5">
              {socials.map((l) => {
                const brand = detectSocialBrand(l.url);
                const Icon = brand?.Icon;
                return (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={brand?.label ?? l.title}
                    title={l.title}
                    className="opacity-85 transition hover:scale-110 hover:opacity-100"
                  >
                    {Icon ? <Icon className="h-[22px] w-[22px]" /> : <Sparkles className="h-[22px] w-[22px]" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {isOwner && <FriendsPanel theme={theme} />}

        {/* Contenu */}
        <div className="mt-8 space-y-6">
          {/* Sites — aperçu plein avec screenshot */}
          {websites.length > 0 && (
            <div className="space-y-3">
              {websites.map((l) => (
                <WebsiteCard key={l.id} url={l.url} title={l.title} theme={theme} />
              ))}
            </div>
          )}

          {/* Section À la une (vidéos) */}
          {videos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold opacity-90">À la une</h2>
              {videos.map((l) => {
                const video = detectVideo(l.url);
                if (video) return <VideoEmbed key={l.id} url={l.url} title={l.title} />;
                return null;
              })}
            </div>
          )}

          {/* Produits digitaux (Pro uniquement) */}
          {profile.is_pro && products.length > 0 && (
            <div className="space-y-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} sellerId={profile.id} />
              ))}
            </div>
          )}

          {profile.is_pro && <NewsletterBlock userId={profile.id} />}

          {links.length === 0 && products.length === 0 && (
            <div className={`rounded-2xl border border-dashed border-current/15 p-8 text-center text-sm ${theme.muted}`}>
              Aucun lien pour l'instant.
            </div>
          )}
        </div>

        {/* Footer logo Zeno */}
        {!profile.is_pro && (
          <Link
            to="/"
            className="mt-12 flex items-center justify-center gap-2 opacity-70 transition hover:opacity-100"
          >
            <Sparkles className={`h-4 w-4 ${theme.footerAccent}`} />
            <span className="text-lg font-bold tracking-tight">zeno</span>
          </Link>
        )}
      </div>
    </div>
  );
}
