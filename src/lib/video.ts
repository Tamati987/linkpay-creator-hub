// Detect and convert media URLs to embeddable iframes for Zeno Pro
export type VideoProvider = "youtube" | "vimeo" | "tiktok" | "twitch";

export type VideoEmbed = {
  provider: VideoProvider;
  src: string;
  aspect: "16/9" | "9/16";
};

function twitchParents(): string {
  const hosts = new Set<string>(["localhost", "lovable.app", "lovable.dev"]);
  if (typeof window !== "undefined") {
    hosts.add(window.location.hostname);
    // Add parent registrable domain too (e.g. xxx.lovable.app -> lovable.app)
    const parts = window.location.hostname.split(".");
    if (parts.length >= 2) hosts.add(parts.slice(-2).join("."));
  }
  return Array.from(hosts).map((h) => `parent=${h}`).join("&");
}

const TWITCH_RESERVED = new Set([
  "videos", "directory", "p", "about", "subscriptions", "settings",
  "search", "wallet", "drops", "friends", "inventory", "messages",
  "following", "downloads", "jobs", "turbo", "prime", "store",
]);

export function detectVideo(url: string): VideoEmbed | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube — only specific videos / shorts, not channel/profile pages
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { provider: "youtube", src: `https://www.youtube.com/embed/${id}`, aspect: "16/9" };
      if (u.pathname.startsWith("/shorts/")) {
        const sid = u.pathname.split("/")[2];
        if (sid) return { provider: "youtube", src: `https://www.youtube.com/embed/${sid}`, aspect: "9/16" };
      }
      if (u.pathname.startsWith("/embed/")) {
        const eid = u.pathname.split("/")[2];
        if (eid) return { provider: "youtube", src: `https://www.youtube.com/embed/${eid}`, aspect: "16/9" };
      }
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { provider: "youtube", src: `https://www.youtube.com/embed/${id}`, aspect: "16/9" };
    }

    // Vimeo — only numeric video ids, not user profiles
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return { provider: "vimeo", src: `https://player.vimeo.com/video/${id}`, aspect: "16/9" };
    }

    // TikTok — only /video/<id>, not user profiles (/@user)
    if (host.endsWith("tiktok.com")) {
      const parts = u.pathname.split("/").filter(Boolean);
      const videoIdx = parts.indexOf("video");
      if (videoIdx >= 0) {
        const id = parts[videoIdx + 1];
        if (id && /^\d+$/.test(id))
          return { provider: "tiktok", src: `https://www.tiktok.com/embed/v2/${id}`, aspect: "9/16" };
      }
    }

    // Twitch — VODs, clips, and live channels
    if (host === "twitch.tv" || host === "m.twitch.tv") {
      const parents = twitchParents();
      const segs = u.pathname.split("/").filter(Boolean);
      if (segs[0] === "videos" && segs[1]) {
        return { provider: "twitch", src: `https://player.twitch.tv/?video=${segs[1]}&${parents}`, aspect: "16/9" };
      }
      // Live channel: twitch.tv/<channel>
      if (segs.length === 1 && !TWITCH_RESERVED.has(segs[0].toLowerCase())) {
        return { provider: "twitch", src: `https://player.twitch.tv/?channel=${encodeURIComponent(segs[0])}&${parents}`, aspect: "16/9" };
      }
      // Embedded clip: twitch.tv/<channel>/clip/<id>
      if (segs.length >= 3 && segs[1] === "clip" && segs[2]) {
        return { provider: "twitch", src: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(segs[2])}&${parents}`, aspect: "16/9" };
      }
    }
    if (host === "clips.twitch.tv") {
      const parents = twitchParents();
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return { provider: "twitch", src: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(id)}&${parents}`, aspect: "16/9" };
    }
    return null;
  } catch {
    return null;
  }
}


export const SOCIAL_HOSTS = [
  "facebook.com", "fb.com", "instagram.com", "x.com", "twitter.com",
  "linkedin.com", "pinterest.com", "pinterest.fr", "snapchat.com",
  "threads.net", "threads.com", "tiktok.com", "youtube.com", "youtu.be",
  "twitch.tv", "vimeo.com", "github.com", "discord.com", "discord.gg",
  "t.me", "telegram.org", "whatsapp.com", "wa.me", "reddit.com",
  "spotify.com", "soundcloud.com",
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
  // A specific video URL takes priority (players render in the videos section).
  if (isVideoUrl(url)) return "video";
  // Otherwise, profile/channel pages of known networks are social.
  if (isSocialUrl(url)) return "social";
  return "standard";
}
