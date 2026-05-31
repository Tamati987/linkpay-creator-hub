import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink, Globe, LayoutDashboard, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { VideoEmbed } from "@/components/VideoEmbed";
import { NewsletterBlock } from "@/components/NewsletterBlock";
import { detectVideo } from "@/lib/video";
import { detectSocialBrand } from "@/lib/social";

export const Route = createFileRoute("/$username")({
  component: PublicProfile,
});

type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  is_pro: boolean;
};

async function fetchProfile(username: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url, is_pro")
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

function PublicProfile() {
  const { username } = Route.useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile(username),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Profil introuvable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            @{username} n'a pas (encore) de page Zeno.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-gradient-button px-4 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Créer la mienne
          </Link>
        </div>
      </div>
    );
  }

  const { profile, links, products } = data;
  const initials = (profile.display_name || profile.username)
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const isOwner = currentUserId === profile.id;

  return (
    <div className="min-h-screen px-5 pb-16 pt-12">
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center text-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-24 w-24 rounded-full border border-border object-cover shadow-soft"
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full border border-border bg-surface text-2xl font-semibold text-muted-foreground shadow-soft">
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
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Réseaux sociaux</p>
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

                {videos.length > 0 && profile.is_pro && (
                  <div className="space-y-3">
                    {videos.map((l) => {
                      const video = detectVideo(l.url);
                      if (video) return <VideoEmbed key={l.id} url={l.url} title={l.title} />;
                      return null;
                    })}
                  </div>
                )}

                {websites.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Sites internet</p>
                    {websites.map((l) => (
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
                    ))}
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
