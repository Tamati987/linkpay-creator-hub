// Detect and convert media URLs to embeddable iframes for Zeno Pro
export type VideoProvider = "youtube" | "vimeo" | "tiktok" | "twitch";

export type VideoEmbed = {
  provider: VideoProvider;
  src: string;
  aspect: "16/9" | "9/16";
};

export function detectVideo(url: string): VideoEmbed | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { provider: "youtube", src: `https://www.youtube.com/embed/${id}`, aspect: "16/9" };
      if (u.pathname.startsWith("/shorts/")) {
        const sid = u.pathname.split("/")[2];
        if (sid) return { provider: "youtube", src: `https://www.youtube.com/embed/${sid}`, aspect: "9/16" };
      }
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { provider: "youtube", src: `https://www.youtube.com/embed/${id}`, aspect: "16/9" };
    }

    // Vimeo
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { provider: "vimeo", src: `https://player.vimeo.com/video/${id}`, aspect: "16/9" };
    }

    // TikTok
    if (host.endsWith("tiktok.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const videoIdx = parts.indexOf("video");
      const id = videoIdx >= 0 ? parts[videoIdx + 1] : parts[parts.length - 1];
      if (id && /^\d+$/.test(id))
        return { provider: "tiktok", src: `https://www.tiktok.com/embed/v2/${id}`, aspect: "9/16" };
    }

    // Twitch
    if (host === "twitch.tv" || host === "www.twitch.tv") {
      const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
      const segs = u.pathname.split("/").filter(Boolean);
      if (segs[0] === "videos" && segs[1]) {
        return { provider: "twitch", src: `https://player.twitch.tv/?video=${segs[1]}&parent=${parent}`, aspect: "16/9" };
      }
      if (segs[0] && segs.length === 1) {
        return { provider: "twitch", src: `https://player.twitch.tv/?channel=${segs[0]}&parent=${parent}`, aspect: "16/9" };
      }
    }
    if (host === "clips.twitch.tv") {
      const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return { provider: "twitch", src: `https://clips.twitch.tv/embed?clip=${id}&parent=${parent}`, aspect: "16/9" };
    }
    return null;
  } catch {
    return null;
  }
}

export const SOCIAL_HOSTS = [
  "facebook.com", "fb.com", "instagram.com", "x.com", "twitter.com",
  "linkedin.com", "pinterest.com", "snapchat.com", "threads.net",
];

export function isSocialUrl(url: string) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return SOCIAL_HOSTS.some((s) => h === s || h.endsWith("." + s));
  } catch {
    return false;
  }
}

export function isVideoUrl(url: string) {
  return detectVideo(url) !== null;
}

export function inferLinkKind(url: string): "standard" | "social" | "video" {
  if (isVideoUrl(url)) return "video";
  if (isSocialUrl(url)) return "social";
  return "standard";
}
