import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, Globe, LayoutDashboard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { NewsletterBlock } from "@/components/NewsletterBlock";
import { detectVideo } from "@/lib/video";
import { detectSocialBrand } from "@/lib/social";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  cover_url: string | null;
  is_pro: boolean;
};

async function fetchProfile(username: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, cover_url, is_pro")
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
      .select("id, title, description, price_cents, image_url, position")
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
  component: PublicProfile,
});

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

  return (
    <div className="min-h-screen pb-16">
      {profile.cover_url && (
        <div className="relative h-40 w-full overflow-hidden sm:h-56">
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}
      <div className={`mx-auto max-w-md px-5 ${profile.cover_url ? "-mt-12" : "pt-12"}`}>
        <div className="flex flex-col items-center text-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-28 w-28 rounded-full border-[3px] border-primary/30 object-cover shadow-glow ring-4 ring-primary/10"
            />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-full border-[3px] border-primary/30 bg-surface text-2xl font-semibold text-muted-foreground shadow-glow ring-4 ring-primary/10">
              {initials}
            </div>
          )}
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            {profile.display_name || `@${profile.username}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-3 text-balance text-sm text-foreground/80">{profile.bio}</p>
          )}
          {isOwner && (
            <Link
              to="/dashboard"
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-medium transition hover:bg-surface-elevated"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          )}
        </div>

        <div className="mt-8 space-y-6">
          {products.length > 0 && (
            <div className="space-y-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} sellerId={profile.id} />
              ))}
            </div>
          )}

          {(() => {
            const socials = links.filter((l) => l.kind === "social");
            const videos = links.filter((l) => l.kind === "video");
            const websites = links.filter((l) => l.kind === "standard");

            return (
              <>
                {socials.length > 0 && (
                  <div>
                    <h2 className="mb-2 text-[11px] font-normal uppercase tracking-wider text-muted-foreground">Réseaux sociaux</h2>
                    <div className="flex flex-wrap justify-center gap-3">
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
                            className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface shadow-soft transition hover:scale-105 hover:bg-surface-elevated"
                            style={brand ? { color: brand.color } : undefined}
                          >
                            {Icon ? <Icon className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {videos.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">Vidéos</h2>
                    {videos.map((l) => {
                      const video = detectVideo(l.url);
                      if (video) return <VideoEmbed key={l.id} url={l.url} title={l.title} />;
                      return null;
                    })}
                  </div>
                )}

                {websites.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">Sites internet</h2>
                    {websites.map((l) =>
                      profile.is_pro ? (
                        <div
                          key={l.id}
                          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft"
                        >
                          <div className="flex items-center gap-2 border-b border-border bg-surface-elevated px-3 py-2 text-xs">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                            <span className="flex-1 truncate font-medium">{l.title}</span>
                            <a
                              href={l.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-muted-foreground transition hover:text-foreground"
                            >
                              Ouvrir <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <iframe
                            src={l.url}
                            title={l.title}
                            loading="lazy"
                            sandbox="allow-scripts allow-popups-to-escape-sandbox allow-forms"
                            referrerPolicy="no-referrer"
                            className="h-[420px] w-full bg-background"
                          />
                        </div>
                      ) : (
                        <a
                          key={l.id}
                          href={l.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="group flex items-center gap-3 rounded-2xl glass px-4 py-4 text-sm font-medium shadow-soft transition hover:bg-surface-elevated"
                        >
                          <span className="grid h-8 w-8 place-items-center rounded-md bg-surface-elevated text-primary">
                            <Globe className="h-4 w-4" />
                          </span>
                          <span className="flex-1">{l.title}</span>
                          <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
                        </a>
                      ),
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {profile.is_pro && <NewsletterBlock userId={profile.id} />}

          {links.length === 0 && products.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Aucun lien pour l'instant.
            </div>
          )}
        </div>

        {!profile.is_pro && (
          <Link
            to="/"
            className="mt-12 flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <Sparkles className="h-3 w-3" /> Propulsé par Zeno
          </Link>
        )}
      </div>
    </div>
  );
}
