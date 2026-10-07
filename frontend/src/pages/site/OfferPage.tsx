import { Bell, Brain, Coins, Handshake, History, Landmark, MapPin, Moon, Scale, TrendingUp } from 'lucide-react'

import { CtaBand, PageHero, PrimaryLink, Reveal, SectionTitle, SmartImg, SplitSection } from '@/components/site/SiteLayout'
import { BRAND } from '@/components/brand/Brand'
import { LOCAL, PHOTOS } from '@/lib/siteImages'

const JUMP = [
  { icon: Brain, label: 'AI price prediction', href: '#prediction' },
  { icon: Handshake, label: 'Direct marketplace', href: '#marketplace' },
  { icon: Landmark, label: 'Government prices', href: '#gov-prices' },
  { icon: History, label: 'Prediction history', href: '#history' },
]

const EXTRAS = [
  { icon: MapPin, title: 'Default market region', text: 'Forecasts and prices open on your own region every time.' },
  { icon: Scale, title: 'Per kg or per 100 kg bag', text: 'Show every price the way you trade — by kilo or by bag.' },
  { icon: Bell, title: 'SMS & email alerts', text: 'Choose how you want to hear about orders and price changes.' },
  { icon: Moon, title: 'Dark mode', text: 'Easy on the eyes when you check prices late at night.' },
]

export default function OfferPage() {
  return (
    <>
      <PageHero
        image={PHOTOS.manPhoneField}
        crumbs="What we offer"
        eyebrow="What we offer"
        title={
          <>
            One platform. <span className="text-[#B8E07A]">Four powerful tools.</span>
          </>
        }
        text="Agri-Market AI puts AI price forecasts, a direct marketplace and the government’s indicative prices side by side — so every decision is based on real numbers."
      >
        <div className="mt-8 flex flex-wrap gap-3">
          {JUMP.map(({ icon: Icon, label, href }) => (
            <a
              key={href}
              href={href}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
            >
              <Icon className="size-4 text-[#B8E07A]" /> {label}
            </a>
          ))}
        </div>
      </PageHero>

      {/* 1. prediction */}
      <SplitSection
        id="prediction"
        image={PHOTOS.phoneInField}
        eyebrow="AI price prediction"
        title="Know next week’s price — and the weeks ahead"
        text="Every night the system runs the Random Forest model and produces a fresh multi-week forecast for each crop and region. You see when prices are likely to peak, before you decide."
        points={[
          'Multi-week forecast for every crop and region, refreshed daily',
          'Best week to sell (farmers) or best week to buy (buyers)',
          'Value of your stock today vs. on the best week to sell',
          'Run new predictions and save them to your history',
        ]}
        badge={
          <div className="w-52">
            <p className="text-xs text-gray-500">Best week to sell</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-lg font-extrabold">
              <TrendingUp className="size-4" style={{ color: BRAND.green }} /> In 2 weeks
            </p>
            <p className="text-[10px] text-gray-400">Sample forecast</p>
          </div>
        }
      />

      {/* 2. marketplace */}
      <SplitSection
        id="marketplace"
        tinted
        reverse
        image={PHOTOS.busyMarket}
        eyebrow="Direct marketplace"
        title="Farmers list. Buyers order. Nobody in between."
        text="Farmers publish what they have in stock; buyers browse, add to cart and order directly. Both sides follow every order from placed to delivered."
        points={[
          'List crop, variety, kg, price, region, quality, harvest date and minimum order',
          'Live listing status: Available, Partly bought, Bought or Withdrawn',
          'Cart with cash, mobile money or bank payment and a delivery note',
          'Farmers confirm, deliver or cancel orders from their dashboard',
        ]}
      />

      {/* 3. government prices */}
      <SplitSection
        id="gov-prices"
        image={PHOTOS.sacks}
        eyebrow="Government prices"
        title="Every price checked against bei elekezi"
        text="The official indicative price for each crop sits right next to the farmer’s price, today’s market estimate and next week’s AI price — so both sides can see what is fair."
        points={[
          'Official indicative price per crop',
          'Percentage difference shown on every listing',
          'Today’s market estimate and next week’s AI price side by side',
        ]}
        badge={
          <div className="w-52">
            <p className="text-xs text-gray-500">Farmer’s price vs. government</p>
            <p className="mt-0.5 text-lg font-extrabold text-[#1E5631]">−4% below</p>
            <p className="text-[10px] text-gray-400">Sample listing</p>
          </div>
        }
      />

      {/* 4. history */}
      <SplitSection
        id="history"
        tinted
        reverse
        image={PHOTOS.chartLaptop}
        eyebrow="Prediction history"
        title="See how right the AI was"
        text="Every prediction you run is saved. When the real prices arrive, Agri-Market AI shows how close each forecast came — so you learn how far to trust it."
        points={['A full log of every prediction you ran', 'Accuracy for each one once real prices come in', 'Available to both farmers and buyers']}
      />

      {/* photo strip */}
      <section className="py-4">
        <div className="grid grid-cols-2 gap-2 px-2 md:grid-cols-4">
          {[LOCAL.farm, PHOTOS.marketProduce, PHOTOS.grainHandsWoman, PHOTOS.cornRoad].map((src, i) => (
            <Reveal key={src} delay={i * 80}>
              <SmartImg src={src} alt="" className="aspect-[4/3] w-full rounded-2xl" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* extras */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle center eyebrow="And more" title="Settings that fit the way you trade" />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {EXTRAS.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="h-full rounded-3xl border border-gray-100 bg-white p-7 transition hover:-translate-y-1.5 hover:shadow-xl">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#EEF5EA]">
                    <Icon className="size-6" style={{ color: BRAND.green }} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <PrimaryLink to="/how-it-works">
              <Coins className="size-4" /> See how it works
            </PrimaryLink>
          </div>
        </div>
      </section>

      <CtaBand image={PHOTOS.womanCornField} />
    </>
  )
}
