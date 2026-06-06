// Système de thèmes visuels pour la page publique
export type ThemeId =
  | "neon" | "mono" | "paper" | "ocean" | "sand"
  | "aurora" | "sunset" | "midnight" | "emerald" | "holographic";

export type Theme = {
  id: ThemeId;
  name: string;
  pro: boolean;
  // Aperçu (gradient pour la vignette du sélecteur)
  preview: string;
  // Classes appliquées au wrapper de la page
  page: string;
  // Halos décoratifs (JSX rendu par la page)
  halos: Array<{ className: string }>;
  // Carte de lien
  card: string;
  // Texte secondaire / muted
  muted: string;
  // Anneau autour de l'avatar (gradient)
  avatarRing: string;
  // Accent (utilisé pour badges, glow CTA produit)
  accent: string;
  // Couleur de l'icône footer
  footerAccent: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  // ── Gratuits ──────────────────────────────────────────────
  neon: {
    id: "neon", name: "Néon violet", pro: false,
    preview: "linear-gradient(135deg,#07020d,#5b0a6b,#ff3ea5)",
    page: "bg-[#07020d] text-white",
    halos: [
      { className: "absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-fuchsia-600/30 blur-[140px]" },
      { className: "absolute left-1/4 top-2/3 h-[500px] w-[500px] rounded-full bg-violet-700/30 blur-[120px]" },
      { className: "absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-pink-500/20 blur-[120px]" },
    ],
    card: "border border-white/10 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08]",
    muted: "text-white/60",
    avatarRing: "bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-violet-500",
    accent: "fill-fuchsia-500 text-white",
    footerAccent: "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]",
  },
  mono: {
    id: "mono", name: "Mono sombre", pro: false,
    preview: "linear-gradient(135deg,#0a0a0a,#2a2a2a)",
    page: "bg-[#0a0a0a] text-white",
    halos: [],
    card: "border border-white/10 bg-white/[0.03] hover:bg-white/[0.07]",
    muted: "text-white/55",
    avatarRing: "bg-gradient-to-tr from-white/40 to-white/10",
    accent: "fill-white text-black",
    footerAccent: "text-white",
  },
  paper: {
    id: "paper", name: "Papier clair", pro: false,
    preview: "linear-gradient(135deg,#f5f3ee,#e8e4dd)",
    page: "bg-[#f5f3ee] text-zinc-900",
    halos: [],
    card: "border border-zinc-900/10 bg-white hover:bg-zinc-50 shadow-sm",
    muted: "text-zinc-500",
    avatarRing: "bg-gradient-to-tr from-zinc-300 to-zinc-100",
    accent: "fill-zinc-900 text-white",
    footerAccent: "text-zinc-900",
  },
  ocean: {
    id: "ocean", name: "Océan", pro: false,
    preview: "linear-gradient(135deg,#0c2340,#2d8a9e)",
    page: "bg-[#0c2340] text-white",
    halos: [
      { className: "absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/25 blur-[140px]" },
      { className: "absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-sky-600/30 blur-[120px]" },
    ],
    card: "border border-cyan-300/15 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08]",
    muted: "text-cyan-100/65",
    avatarRing: "bg-gradient-to-tr from-cyan-400 via-sky-400 to-blue-500",
    accent: "fill-cyan-400 text-white",
    footerAccent: "text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]",
  },
  sand: {
    id: "sand", name: "Sable chaud", pro: false,
    preview: "linear-gradient(135deg,#faf8f5,#c9b99a)",
    page: "bg-[#faf8f5] text-stone-900",
    halos: [
      { className: "absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-200/40 blur-[120px]" },
    ],
    card: "border border-stone-900/10 bg-white/70 backdrop-blur hover:bg-white",
    muted: "text-stone-500",
    avatarRing: "bg-gradient-to-tr from-amber-400 via-orange-300 to-yellow-200",
    accent: "fill-amber-500 text-white",
    footerAccent: "text-stone-800",
  },

  // ── Pro ───────────────────────────────────────────────────
  aurora: {
    id: "aurora", name: "Aurora", pro: true,
    preview: "linear-gradient(135deg,#0d1b2a,#2dd4a8,#73ffb8)",
    page: "bg-[#0d1b2a] text-white",
    halos: [
      { className: "absolute left-0 top-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/30 blur-[140px]" },
      { className: "absolute right-0 top-1/2 h-[500px] w-[500px] rounded-full bg-teal-400/25 blur-[120px]" },
      { className: "absolute left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[120px]" },
    ],
    card: "border border-emerald-300/15 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08]",
    muted: "text-emerald-50/65",
    avatarRing: "bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-300",
    accent: "fill-emerald-400 text-[#0d1b2a]",
    footerAccent: "text-emerald-300 drop-shadow-[0_0_8px_rgba(45,212,168,0.7)]",
  },
  sunset: {
    id: "sunset", name: "Sunset", pro: true,
    preview: "linear-gradient(135deg,#ff6b35,#e84393,#6c5ce7)",
    page: "bg-[#1a0a14] text-white",
    halos: [
      { className: "absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-orange-500/30 blur-[140px]" },
      { className: "absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-pink-500/30 blur-[120px]" },
      { className: "absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-600/25 blur-[120px]" },
    ],
    card: "border border-orange-300/15 bg-white/[0.04] backdrop-blur-md hover:bg-white/[0.08]",
    muted: "text-orange-50/70",
    avatarRing: "bg-gradient-to-tr from-orange-400 via-pink-500 to-violet-500",
    accent: "fill-orange-400 text-white",
    footerAccent: "text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.7)]",
  },
  midnight: {
    id: "midnight", name: "Minuit", pro: true,
    preview: "linear-gradient(135deg,#0a0a1a,#4f46e5)",
    page: "bg-[#0a0a1a] text-white",
    halos: [
      { className: "absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/30 blur-[140px]" },
      { className: "absolute right-1/4 bottom-1/4 h-[500px] w-[500px] rounded-full bg-blue-700/25 blur-[120px]" },
    ],
    card: "border border-indigo-300/15 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.07]",
    muted: "text-indigo-100/60",
    avatarRing: "bg-gradient-to-tr from-indigo-400 via-blue-500 to-indigo-700",
    accent: "fill-indigo-400 text-white",
    footerAccent: "text-indigo-300 drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]",
  },
  emerald: {
    id: "emerald", name: "Émeraude prestige", pro: true,
    preview: "linear-gradient(135deg,#064e3b,#c9a84c)",
    page: "bg-[#04231b] text-white",
    halos: [
      { className: "absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-700/40 blur-[140px]" },
      { className: "absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-amber-500/20 blur-[120px]" },
    ],
    card: "border border-amber-300/15 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.07]",
    muted: "text-amber-50/65",
    avatarRing: "bg-gradient-to-tr from-amber-400 via-yellow-300 to-emerald-400",
    accent: "fill-amber-400 text-emerald-950",
    footerAccent: "text-amber-300 drop-shadow-[0_0_8px_rgba(217,168,76,0.7)]",
  },
  holographic: {
    id: "holographic", name: "Holographique", pro: true,
    preview: "linear-gradient(135deg,#c4b5fd,#67e8f9,#fecaca)",
    page: "bg-[#0a0518] text-white",
    halos: [
      { className: "absolute left-0 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-400/30 blur-[120px]" },
      { className: "absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-cyan-300/25 blur-[120px]" },
      { className: "absolute left-1/2 bottom-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-pink-300/25 blur-[120px]" },
    ],
    card: "border border-white/15 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-md hover:from-white/[0.10] hover:to-white/[0.04]",
    muted: "text-white/65",
    avatarRing: "bg-[conic-gradient(from_0deg,#c4b5fd,#67e8f9,#fecaca,#c4b5fd)]",
    accent: "fill-cyan-300 text-violet-950",
    footerAccent: "text-cyan-200 drop-shadow-[0_0_10px_rgba(196,181,253,0.8)]",
  },
};

export const FREE_THEMES = Object.values(THEMES).filter((t) => !t.pro);
export const PRO_THEMES = Object.values(THEMES).filter((t) => t.pro);

export function getTheme(id: string | null | undefined): Theme {
  if (id && id in THEMES) return THEMES[id as ThemeId];
  return THEMES.neon;
}
