/**
 * Photos for the public website pages — all served locally from
 * frontend/public/images (self-contained, no external image calls).
 *
 * - LOCAL: your own brand/design pictures (already in public/images).
 * - Stock photos live in public/images/stock. They are free Unsplash photos
 *   (Unsplash License — https://unsplash.com/license). To (re)download them,
 *   run `bash download-images.sh` in the frontend folder once, with internet.
 *   Until then a green gradient placeholder shows in their place.
 */

const stock = (name: string) => `/images/stock/${name}.jpg`

export const LOCAL = {
  hero: '/images/image7.png',
  farm: '/images/Farm.jpeg',
  deal: '/images/image4.png',
  soil: '/images/login%20page.png', // file: "login page.png"
  tractor: '/images/farmer.png',
  money: '/images/buyer.png',
  logo: '/images/logo.png',
}

export const PHOTOS = {
  // people & farming
  farmerField: stock('farmer-field'),
  womanPlanting: stock('woman-planting'),
  womanHarvestingRice: stock('woman-harvesting-rice'),
  grainHands: stock('grain-hands'),
  grainHandsWoman: stock('grain-hands-woman'),
  womanCornField: stock('woman-corn-field'),
  walkingField: stock('walking-field'),
  wheelbarrow: stock('wheelbarrow'),

  // phones & data
  phoneInField: stock('phone-in-field'),
  manPhoneField: stock('man-phone-field'),
  vendorPhone: stock('vendor-phone'),
  analyticsLaptop: stock('analytics-laptop'),
  chartLaptop: stock('chart-laptop'),
  tabletData: stock('tablet-data'),

  // markets & produce
  marketTomatoes: stock('market-tomatoes'),
  busyMarket: stock('busy-market'),
  marketProduce: stock('market-produce'),
  marketBaskets: stock('market-baskets'),
  fruitStand: stock('fruit-stand'),
  sacks: stock('sacks'),
  sacksPile: stock('sacks-pile'),

  // landscapes
  cornField: stock('corn-field'),
  cornRoad: stock('corn-road'),
  riceGolden: stock('rice-golden'),
  riceAerial: stock('rice-aerial'),
}

/** One photo per crop the models forecast. */
export const CROP_PHOTOS: Record<string, string> = {
  Maize: stock('corn-field'),
  Rice: stock('rice-golden'),
  Beans: stock('beans'),
  Sorghum: stock('sorghum'),
  'Bulrush Millet': stock('grain-hands'),
  'Finger Millet': stock('grain-hands-woman'),
  'Round Potato': stock('round-potato'),
}
