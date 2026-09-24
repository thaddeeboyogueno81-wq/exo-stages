// Limites du mode gratuit (alignées sur supabase/schema.sql — consume_quota)
export const QUOTAS = {
  mediaPerDay: 20, // lectures/écoutes par jour
  booksPerMonth: 3, // nouveaux livres par mois
} as const;

// Règles sur les contenus
export const RULES = {
  storyDurationHours: 24,
  maxUploadMb: 50,
  maxCaptionLength: 2200,
  minAge: 13,
} as const;

export const INTERESTS = [
  'Musique',
  'Vidéo',
  'Lecture',
  'Sport',
  'Technologie',
  'Art',
  'Cinéma',
  'Jeux',
  'Cuisine',
  'Voyage',
] as const;

export const APP_NAME = 'Lify';
export const APP_TAGLINE = 'Discuter, regarder, écouter, lire — au même endroit.';
