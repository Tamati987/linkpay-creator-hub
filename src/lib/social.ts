import type { ComponentType, SVGProps } from "react";
import {
  SiInstagram, SiFacebook, SiX, SiTiktok, SiYoutube,
  SiPinterest, SiSnapchat, SiThreads, SiTwitch, SiVimeo,
  SiGithub, SiDiscord, SiTelegram, SiWhatsapp, SiReddit, SiSpotify,
  SiSoundcloud,
} from "react-icons/si";
import { Linkedin as LuLinkedin, Twitter as LuTwitter } from "lucide-react";

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

export type SocialBrand = {
  key: string;
  label: string;
  Icon: IconType;
  color: string; // brand color
};

const BRANDS: { test: (host: string, url: string) => boolean; brand: SocialBrand }[] = [
  { test: (h) => h.endsWith("instagram.com"), brand: { key: "instagram", label: "Instagram", Icon: SiInstagram, color: "#E4405F" } },
  { test: (h) => h.endsWith("facebook.com") || h.endsWith("fb.com"), brand: { key: "facebook", label: "Facebook", Icon: SiFacebook, color: "#1877F2" } },
  { test: (h) => h === "x.com" || h.endsWith(".x.com"), brand: { key: "x", label: "X", Icon: SiX, color: "#000000" } },
  { test: (h) => h.endsWith("twitter.com"), brand: { key: "twitter", label: "Twitter", Icon: LuTwitter as IconType, color: "#1DA1F2" } },
  { test: (h) => h.endsWith("tiktok.com"), brand: { key: "tiktok", label: "TikTok", Icon: SiTiktok, color: "#000000" } },
  { test: (h) => h.endsWith("youtube.com") || h === "youtu.be", brand: { key: "youtube", label: "YouTube", Icon: SiYoutube, color: "#FF0000" } },
  { test: (h) => h.endsWith("linkedin.com"), brand: { key: "linkedin", label: "LinkedIn", Icon: LuLinkedin as IconType, color: "#0A66C2" } },
  { test: (h) => h.endsWith("pinterest.com") || h.endsWith("pinterest.fr"), brand: { key: "pinterest", label: "Pinterest", Icon: SiPinterest, color: "#BD081C" } },
  { test: (h) => h.endsWith("snapchat.com"), brand: { key: "snapchat", label: "Snapchat", Icon: SiSnapchat, color: "#FFFC00" } },
  { test: (h) => h.endsWith("threads.net") || h.endsWith("threads.com"), brand: { key: "threads", label: "Threads", Icon: SiThreads, color: "#000000" } },
  { test: (h) => h.endsWith("twitch.tv"), brand: { key: "twitch", label: "Twitch", Icon: SiTwitch, color: "#9146FF" } },
  { test: (h) => h.endsWith("vimeo.com"), brand: { key: "vimeo", label: "Vimeo", Icon: SiVimeo, color: "#1AB7EA" } },
  { test: (h) => h.endsWith("github.com"), brand: { key: "github", label: "GitHub", Icon: SiGithub, color: "#181717" } },
  { test: (h) => h.endsWith("discord.com") || h.endsWith("discord.gg"), brand: { key: "discord", label: "Discord", Icon: SiDiscord, color: "#5865F2" } },
  { test: (h) => h.endsWith("t.me") || h.endsWith("telegram.org"), brand: { key: "telegram", label: "Telegram", Icon: SiTelegram, color: "#26A5E4" } },
  { test: (h) => h.endsWith("whatsapp.com") || h.endsWith("wa.me"), brand: { key: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp, color: "#25D366" } },
  { test: (h) => h.endsWith("reddit.com"), brand: { key: "reddit", label: "Reddit", Icon: SiReddit, color: "#FF4500" } },
  { test: (h) => h.endsWith("spotify.com"), brand: { key: "spotify", label: "Spotify", Icon: SiSpotify, color: "#1DB954" } },
  { test: (h) => h.endsWith("soundcloud.com"), brand: { key: "soundcloud", label: "SoundCloud", Icon: SiSoundcloud, color: "#FF5500" } },
];

export function detectSocialBrand(url: string): SocialBrand | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    for (const b of BRANDS) if (b.test(host, url)) return b.brand;
    return null;
  } catch {
    return null;
  }
}
