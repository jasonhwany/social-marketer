export const PLATFORMS = ['twitter', 'threads', 'facebook', 'reddit'] as const;
export type Platform = (typeof PLATFORMS)[number];
