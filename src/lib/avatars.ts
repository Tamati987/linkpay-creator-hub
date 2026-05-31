// Catalogue d'avatars proposés sur Zeno.
// Les URLs sont générées par DiceBear (SVG gratuit, sans clé API).
// Voir https://www.dicebear.com pour les styles.

export type AvatarPreset = {
  id: string;
  url: string;
  premium: boolean;
};

const dice = (style: string, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;

export const FREE_AVATARS: AvatarPreset[] = [
  { id: "free-1", url: dice("fun-emoji", "Zeno"), premium: false },
  { id: "free-2", url: dice("bottts", "Zeno"), premium: false },
];

export const PREMIUM_AVATARS: AvatarPreset[] = [
  { id: "pro-1", url: dice("adventurer", "Aria"), premium: true },
  { id: "pro-2", url: dice("avataaars", "Milo"), premium: true },
  { id: "pro-3", url: dice("big-smile", "Luna"), premium: true },
  { id: "pro-4", url: dice("croodles", "Nova"), premium: true },
  { id: "pro-5", url: dice("lorelei", "Iris"), premium: true },
  { id: "pro-6", url: dice("micah", "Leo"), premium: true },
  { id: "pro-7", url: dice("miniavs", "Sky"), premium: true },
  { id: "pro-8", url: dice("notionists", "Aki"), premium: true },
  { id: "pro-9", url: dice("open-peeps", "Zoe"), premium: true },
  { id: "pro-10", url: dice("personas", "Kai"), premium: true },
  { id: "pro-11", url: dice("pixel-art", "Rex"), premium: true },
  { id: "pro-12", url: dice("thumbs", "Sun"), premium: true },
  { id: "pro-13", url: dice("big-ears", "Pip"), premium: true },
  { id: "pro-14", url: dice("adventurer-neutral", "Max"), premium: true },
  { id: "pro-15", url: dice("avataaars-neutral", "Eve"), premium: true },
  { id: "pro-16", url: dice("bottts-neutral", "Volt"), premium: true },
  { id: "pro-17", url: dice("fun-emoji", "Joy"), premium: true },
  { id: "pro-18", url: dice("lorelei-neutral", "Mei"), premium: true },
  { id: "pro-19", url: dice("notionists-neutral", "Ren"), premium: true },
  { id: "pro-20", url: dice("personas", "Tao"), premium: true },
];

export const ALL_AVATARS: AvatarPreset[] = [...FREE_AVATARS, ...PREMIUM_AVATARS];

export const AVATAR_PRICE_CENTS = 100; // 1 $

export function getAvatar(id: string): AvatarPreset | undefined {
  return ALL_AVATARS.find((a) => a.id === id);
}
