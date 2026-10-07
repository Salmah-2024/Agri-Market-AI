/** Crops the public site shows (keep in sync with ACTIVE_CROPS in backend/.env).
 *  All 7 crops in the Ministry of Agriculture weekly market bulletin. */
export const ACTIVE_CROPS = [
  'Maize', 'Rice', 'Beans', 'Sorghum', 'Bulrush Millet', 'Finger Millet', 'Round Potato',
] as const

export const CROP_SW: Record<string, string> = {
  Maize: 'Mahindi',
  Rice: 'Mchele',
  Beans: 'Maharage',
  Sorghum: 'Mtama',
  'Bulrush Millet': 'Uwele',
  'Finger Millet': 'Ulezi',
  'Round Potato': 'Viazi mviringo',
}

export const sw = (crop: string) => CROP_SW[crop] ?? crop
