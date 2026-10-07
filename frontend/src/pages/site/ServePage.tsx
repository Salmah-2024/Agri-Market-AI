import { BrainCircuit, History, Landmark, LayoutDashboard, MapPin, Receipt, ShoppingBasket, ShoppingCart, Sprout, Tractor, Users } from 'lucide-react'

import { BRAND } from '@/components/brand/Brand'
import { CtaBand, PageHero, PrimaryLink, Reveal, SectionTitle, SmartImg, SplitSection } from '@/components/site/SiteLayout'
import { ACTIVE_CROPS } from '@/lib/crops'
import { CROP_PHOTOS, LOCAL, PHOTOS } from '@/lib/siteImages'

// National average wholesale prices (TZS/kg) — Ministry of Agriculture
// Weekly Market Bulletin, 04–08 May 2026 (same numbers as ml/common.py).
const ALL_CROPS = [
  { name: 'Maize', sw: 'Mahindi', price: 800 },
  { name: 'Rice', sw: 'Mchele', price: 2300 },
  { name: 'Beans', sw: 'Maharage', price: 2000 },
  { name: 'Sorghum', sw: 'Mtama', price: 1700 },
  { name: 'Bulrush Millet', sw: 'Uwele', price: 1600 },
  { name: 'Finger Millet', sw: 'Ulezi', price: 2200 },
  { name: 'Round Potato', sw: 'Viazi mviringo', price: 900 },
]

const CROPS = ALL_CROPS.filter((c) => (ACTIVE_CROPS as readonly string[]).includes(c.name))

const REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Iringa', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Mbeya', 'Morogoro',
  'Mwanza', 'Njombe', 'Rukwa', 'Ruvuma', 'Shinyanga', 'Singida', 'Songwe', 'Tabora', 'Tanga',
]

const FARMER_PAGES = [
  { icon: LayoutDashboard, t: 'Overview', d: 'Stock, sales, pending orders and today’s forecast' },
  { icon: Sprout, t: 'My crops', d: 'List crops and manage orders' },
  { icon: Users, t: 'Buyers', d: 'Every buyer, filtered by region and crop' },
  { icon: BrainCircuit, t: 'Sales predictions', d: 'Best week to sell your stock' },
  { icon: History, t: 'Prediction history', d: 'How accurate each forecast was' },
  { icon: Landmark, t: 'Government prices', d: 'Official price per crop' },
]

const BUYER_PAGES = [
  { icon: ShoppingBasket, t: 'Available crops', d: 'Listings with government price and AI outlook' },
  { icon: ShoppingCart, t: 'Cart', d: 'Quantities, payment method, delivery note' },
  { icon: Receipt, t: 'My orders', d: 'Pending, confirmed, delivered or cancelled' },
  { icon: BrainCircuit, t: 'AI predictions', d: 'Best week to buy' },
  { icon: History, t: 'Prediction history', d: 'Track forecast accuracy' },
  { icon: Landmark, t: 'Government prices', d: 'Know the fair price' },
]

function PageGrid({ items }: { items: typeof FARMER_PAGES }) {
  return (
    <div className="mt-7 grid gap-3 sm:grid-cols-2">
      {items.map(({ icon: Icon, t, d }) => (
        <div key={t} className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-[#1E5631]/30 hover:shadow-md">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EEF5EA]">
            <Icon className="size-4.5" style={{ color: BRAND.green }} />
          </span>
          <span>
            <span className="block text-sm font-semibold">{t}</span>
            <span className="block text-xs text-gray-500">{d}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export default function ServePage() {
  return (
    <>
      <PageHero
        image={PHOTOS.marketTomatoes}
        crumbs="Who we serve"
        eyebrow="Who we serve"
        title={
          <>
            Built for <span className="text-[#B8E07A]">both sides</span> of the market
          </>
        }
        text="Whether you grow the crops or buy them, Agri-Market AI gives you your own dashboard, your own tools and the same fair prices."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#farmers" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1E5631] shadow-lg">
            <Tractor className="size-4" /> I’m a farmer
          </a>
          <a href="#buyers" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
            <ShoppingBasket className="size-4" /> I’m a buyer
          </a>
        </div>
      </PageHero>

      {/* farmers */}
      <SplitSection
        id="farmers"
        image={PHOTOS.farmerField}
        eyebrow="For farmers · Wakulima"
        title="Know the price before you harvest"
        text="Register as a Mkulima, list what you have and let the AI tell you when prices are likely to peak. Buyers come to you."
        badge={
          <div className="flex items-center gap-3">
            <img src={LOCAL.tractor} alt="" className="size-12 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span>
              <span className="block text-xs text-gray-500">Farmer dashboard</span>
              <span className="block text-sm font-bold">6 tools included</span>
            </span>
          </div>
        }
      >
        <PageGrid items={FARMER_PAGES} />
        <div className="mt-8">
          <PrimaryLink to="/register?role=farmer">Register as farmer</PrimaryLink>
        </div>
      </SplitSection>

      {/* buyers */}
      <SplitSection
        id="buyers"
        tinted
        reverse
        image={PHOTOS.vendorPhone}
        eyebrow="For buyers · Wanunuzi"
        title="Buy at a fair, transparent price"
        text="Register as a Mnunuzi, browse crops listed by farmers across Tanzania and see the government price and AI outlook on every listing before you order."
        badge={
          <div className="flex items-center gap-3">
            <img src={LOCAL.money} alt="" className="h-12 w-10 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <span>
              <span className="block text-xs text-gray-500">Buyer dashboard</span>
              <span className="block text-sm font-bold">Cart + order tracking</span>
            </span>
          </div>
        }
      >
        <PageGrid items={BUYER_PAGES} />
        <div className="mt-8">
          <PrimaryLink to="/register?role=buyer">Register as buyer</PrimaryLink>
        </div>
      </SplitSection>

      {/* crops */}
      <section id="crops" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle
            center
            eyebrow="Crops we cover"
            title="All 7 crops, forecast every week"
            text="Every staple in the Ministry of Agriculture weekly bulletin — maize, rice, beans, sorghum, bulrush millet, finger millet and round potato."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {CROPS.map((c, i) => (
              <Reveal key={c.name} delay={i * 70} className="min-h-80">
                <article className="group relative isolate h-full min-h-60 overflow-hidden rounded-3xl text-white shadow-lg">
                  <SmartImg src={CROP_PHOTOS[c.name]} alt={c.name} className="absolute inset-0 -z-20 h-full w-full transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B2414]/95 via-[#0B2414]/30 to-transparent" />
                  <div className="flex h-full flex-col justify-end p-6">
                    <p className="text-xs font-medium tracking-wider text-[#B8E07A] uppercase">{c.sw}</p>
                    <h3 className="text-3xl font-extrabold">{c.name}</h3>
                    <p className="mt-2 text-sm text-white/80">
                      <span className="font-semibold text-white">TZS {c.price.toLocaleString()}</span>/kg national avg.
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            Prices: national average wholesale, Ministry of Agriculture Weekly Market Bulletin, 4–8 May 2026.
          </p>
        </div>
      </section>

      {/* regions */}
      <section id="regions" className="relative isolate overflow-hidden py-20 text-white lg:py-28">
        <SmartImg src={PHOTOS.cornRoad} alt="" className="absolute inset-0 -z-20 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-[#0B2414]/85" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-[#B8E07A] uppercase ring-1 ring-white/20">
              <MapPin className="size-3.5" /> Regions
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">18 market regions across mainland Tanzania</h2>
            <p className="mt-4 text-lg text-white/75">
              Forecasts are made for each region plus a national average. If your region has no data yet, the national forecast is used.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="flex flex-wrap gap-2.5">
              {REGIONS.map((r) => (
                <span key={r} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium ring-1 ring-white/15 backdrop-blur transition hover:bg-[#8DC63F] hover:text-[#0B2414]">
                  {r}
                </span>
              ))}
              <span className="rounded-full bg-[#8DC63F] px-4 py-2 text-sm font-bold text-[#0B2414]">+ National</span>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBand image={PHOTOS.womanHarvestingRice} />
    </>
  )
}
