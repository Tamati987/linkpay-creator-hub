import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/$username")({
  component: PublicProfile,
});

type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};

async function fetchProfile(username: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, avatar_url")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw notFound();

  const [{ data: links }, { data: products }] = await Promise.all([
    supabase
      .from("links")
      .select("id, title, url, position")
      .eq("user_id", profile.id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("products")
      .select("id, title, description, price_cents, position")
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
            @{username} n'a pas (encore) de page LinkPay.
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
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
            <p className="mt-3 text-balance text-sm text-foreground/80">
              {profile.bio}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} sellerId={profile.id} />
          ))}

          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-4 text-sm font-medium shadow-soft transition hover:bg-surface-elevated"
            >
              <span>{l.title}</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
            </a>
          ))}

          {links.length === 0 && products.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Aucun lien pour l'instant.
            </div>
          )}
        </div>

        <Link
          to="/"
          className="mt-12 flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <Sparkles className="h-3 w-3" /> Propulsé par LinkPay
        </Link>
      </div>
    </div>
  );
}
