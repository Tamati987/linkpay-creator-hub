export const PLANS = {
  free: {
    maxLinks: 2,
    maxVideos: 1,
    maxProducts: 1,
    commissionPct: 5,
    branding: true,
  },
  pro: {
    maxLinks: Infinity,
    maxVideos: Infinity,
    maxProducts: Infinity,
    commissionPct: 0,
    branding: false,
  },
} as const;

export const MIN_PRODUCT_PRICE_CENTS = 500; // 5 €/$
