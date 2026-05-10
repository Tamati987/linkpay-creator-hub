import { detectVideo } from "@/lib/video";

export function VideoEmbed({ url, title }: { url: string; title?: string }) {
  const v = detectVideo(url);
  if (!v) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {title && (
        <div className="px-4 pb-2 pt-3 text-xs font-medium text-muted-foreground">
          {title}
        </div>
      )}
      <div
        className="relative w-full bg-black"
        style={{ aspectRatio: v.aspect.replace("/", " / ") }}
      >
        <iframe
          src={v.src}
          title={title ?? "video"}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
