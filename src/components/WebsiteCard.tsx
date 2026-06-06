import { useState } from "react";
import { ChevronRight, ExternalLink, Globe, ImageOff } from "lucide-react";
import { detectSocialBrand } from "@/lib/social";
import type { Theme } from "@/lib/themes";

type Props = {
  url: string;
  title: string;
  theme: Theme;
};

function screenshotUrl(url: string) {
  // Service public Microlink — pas de clé requise, redirige vers l'image
  return `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
}

export function WebsiteCard({ url, title, theme }: Props) {
  const [imgError, setImgError] = useState(false);
  const brand = detectSocialBrand(url);
  const Icon = brand?.Icon;
  let host = url;
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}

  return (
    <div className={`group overflow-hidden rounded-2xl ${theme.card} transition`}>
      {/* Aperçu plein largeur */}
      <a href={url} target="_blank" rel="noreferrer noopener" className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/20">
          {!imgError ? (
            <img
              src={screenshotUrl(url)}
              alt={`Aperçu de ${host}`}
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className={`grid h-full w-full place-items-center ${theme.muted}`}>
              <ImageOff className="h-8 w-8 opacity-50" />
            </div>
          )}
        </div>
      </a>

      <div className="flex items-center gap-3 p-3">
        <span
          className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-current/10"
          style={brand ? { color: brand.color } : { color: "currentColor" }}
        >
          {Icon ? <Icon className="h-5 w-5" /> : <Globe className="h-5 w-5 opacity-70" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{title}</div>
          <div className={`truncate text-xs ${theme.muted}`}>{host}</div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 rounded-full bg-current/10 px-3 py-1.5 text-xs font-medium transition hover:bg-current/20"
          aria-label={`Ouvrir ${host}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir
        </a>
        <ChevronRight className={`h-4 w-4 flex-none ${theme.muted}`} />
      </div>
    </div>
  );
}
