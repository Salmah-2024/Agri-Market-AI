import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  BellRing,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  ClipboardList,
  PackageCheck,
  Search,
  ShoppingBasket,
  ShoppingCart,
  Sprout,
  Tractor,
  Truck,
  UserPlus,
  XCircle,
} from 'lucide-react'

import { BRAND } from '@/components/brand/Brand'
import { CtaBand, PageHero, Reveal, SectionTitle, SmartImg } from '@/components/site/SiteLayout'
import { LOCAL, PHOTOS } from '@/lib/siteImages'
import { cn } from '@/lib/utils'

const FARMER_STEPS = [
  { icon: UserPlus, title: 'Register as a Mkulima', text: 'Pick “Farmer”, add your region, district and the crops you grow.', image: PHOTOS.womanPlanting },
  { icon: BrainCircuit, title: 'Check the forecast', text: 'See today’s price and the multi-week AI forecast for your crops, next to the government price.', image: PHOTOS.manPhoneField },
  { icon: Sprout, title: 'List your crops', text: 'Add crop, variety, kg available, your price, quality, harvest date and minimum order.', image: LOCAL.farm },
  { icon: BellRing, title: 'Receive orders', text: 'Buyers order from your listing. Confirm the order from your dashboard.', image: PHOTOS.vendorPhone },
  { icon: Truck, title: 'Deliver the order', text: 'Mark the order delivered. Your stock and sales totals update automatically.', image: PHOTOS.sacksPile },
]

const BUYER_STEPS = [
  { icon: UserPlus, title: 'Register as a Mnunuzi', text: 'Pick “Buyer”, add your region and the crops you usually buy.', image: PHOTOS.fruitStand },
  { icon: Search, title: 'Browse available crops', text: 'Filter listings by crop and region. Each one shows the government price difference and a weekly AI outlook.', image: PHOTOS.marketProduce },
  { icon: ShoppingCart, title: 'Add to cart & order', text: 'Choose quantities, pick cash, mobile money or bank, and add a delivery note.', image: LOCAL.deal },
  { icon: ClipboardList, title: 'Track your orders', text: 'Follow each order from pending to confirmed to delivered.', image: PHOTOS.tabletData },
  { icon: BrainCircuit, title: 'Time your next purchase', text: 'Use AI predictions to spot the best week to buy.', image: PHOTOS.riceGolden },
]

const ORDER_FLOW = [
  { icon: CircleDashed, label: 'Pending', text: 'Buyer places the order' },
  { icon: CheckCircle2, label: 'Confirmed', text: 'Farmer accepts it' },
  { icon: PackageCheck, label: 'Delivered', text: 'Crops handed over' },
]

const FAQ = [
  { q: 'Which crops are covered?', a: 'For now, maize (mahindi) and rice (mchele). More crops from the Ministry of Agriculture weekly market bulletin will be added later.' },
  { q: 'Which regions?', a: '18 market regions of mainland Tanzania plus a national average. If a region has no price data, the national forecast is used.' },
  { q: 'How often are forecasts updated?', a: 'Once a day, shortly after midnight, the system makes a fresh multi-week forecast for every crop and region.' },
  { q: 'How accurate is the AI?', a: 'On real weekly market data, the average next-week error is about 5% across crops. The model matches the naive “price stays the same” baseline on average and beats it on the larger price swings. See the Technology page.' },
  { q: 'What are government prices (bei elekezi)?', a: 'The official indicative price for each crop. Every listing shows how far the farmer’s price is above or below it.' },
  { q: 'Can an order be cancelled?', a: 'Yes. If an order is cancelled, the quantity goes back to the farmer’s listing so other buyers can order it.' },
  { q: 'Can I try it before registering?', a: 'Yes — demo farmer and buyer accounts are available. Ask the administrator for the login details.' },
]

function Steps({ steps }: { steps: typeof FARMER_STEPS }) {
  return (
    <ol className="relative mt-14 grid gap-16">
      <div className="absolute top-0 bottom-0 left-6 hidden w-0.5 bg-gradient-to-b from-[#8DC63F] via-[#8DC63F]/50 to-transparent lg:left-1/2 lg:block" />
      {steps.map(({ icon: Icon, title, text, image }, i) => (
        <li key={title} className="relative grid items-center gap-8 lg:grid-cols-2 lg:gap-24">
          <Reveal className={cn(i % 2 === 1 && 'lg:order-2')}>
            <SmartImg src={image} alt="" className="aspect-[16/10] w-full rounded-3xl shadow-xl" />
          </Reveal>
          <Reveal delay={100}>
            <span className="relative inline-grid size-14 place-items-center rounded-2xl text-white shadow-lg shadow-[#1E5631]/30" style={{ background: BRAND.green }}>
              <Icon className="size-6" />
              <span className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-[#E8CBA8] text-xs font-bold text-[#0B2414] ring-4 ring-white">
                {i + 1}
              </span>
            </span>
            <h3 className="mt-5 text-2xl font-bold sm:text-3xl">{title}</h3>
            <p className="mt-3 max-w-md text-lg leading-relaxed text-gray-600">{text}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  )
}

export default function HowItWorksPage() {
  const [tab, setTab] = useState<'farmers' | 'buyers'>('farmers')
  const [open, setOpen] = useState<number | null>(0)
  const { hash } = useLocation()

  // links like /how-it-works#buyers open the buyer tab
  useEffect(() => {
    if (hash === '#buyers' || hash === '#farmers') setTab(hash === '#buyers' ? 'buyers' : 'farmers')
  }, [hash])

  return (
    <>
      <PageHero
        image={PHOTOS.walkingField}
        crumbs="How it works"
        eyebrow="How it works"
        title={
          <>
            From field to <span className="text-[#B8E07A]">fair price</span>, step by step
          </>
        }
        text="Getting started takes less than two minutes. Here is exactly what happens after you sign up — for farmers and for buyers."
      />

      {/* steps with tabs */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col items-center text-center">
            <SectionTitle center eyebrow="Your journey" title="Pick your side" />
            <div id="farmers" className="mt-8 inline-flex rounded-2xl bg-gray-100 p-1.5" role="tablist">
              {(
                [
                  { k: 'farmers', label: 'For farmers', icon: Tractor },
                  { k: 'buyers', label: 'For buyers', icon: ShoppingBasket },
                ] as const
              ).map(({ k, label, icon: Icon }) => (
                <button
                  key={k}
                  role="tab"
                  aria-selected={tab === k}
                  onClick={() => setTab(k)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all',
                    tab === k ? 'bg-white text-[#1E5631] shadow-md' : 'text-gray-500 hover:text-gray-800',
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
            <span id="buyers" aria-hidden="true" />
          </div>
          <Steps key={tab} steps={tab === 'farmers' ? FARMER_STEPS : BUYER_STEPS} />
        </div>
      </section>

      {/* order journey */}
      <section id="orders" className="relative isolate overflow-hidden py-20 text-white lg:py-28">
        <SmartImg src={PHOTOS.busyMarket} alt="" className="absolute inset-0 -z-20 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-[#0B2414]/90" />
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">The life of an order</h2>
            <p className="mt-4 text-lg text-white/75">Both farmer and buyer see the same status at every step.</p>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            {ORDER_FLOW.map(({ icon: Icon, label, text }, i) => (
              <Reveal key={label} delay={i * 120}>
                <div className="h-full rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur">
                  <Icon className="size-8 text-[#8DC63F]" />
                  <p className="mt-4 text-xs font-semibold tracking-wider text-white/50 uppercase">Step {i + 1}</p>
                  <h3 className="text-xl font-bold">{label}</h3>
                  <p className="mt-1 text-sm text-white/70">{text}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={360}>
              <div className="h-full rounded-3xl border-2 border-dashed border-white/20 p-6">
                <XCircle className="size-8 text-[#E8CBA8]" />
                <p className="mt-4 text-xs font-semibold tracking-wider text-white/50 uppercase">Any time before delivery</p>
                <h3 className="text-xl font-bold">Cancelled</h3>
                <p className="mt-1 text-sm text-white/70">The quantity returns to the listing.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionTitle eyebrow="FAQ" title="Questions, answered" text="Can’t find what you need? Try the demo accounts and explore." />
            <Reveal delay={150}>
              <SmartImg src={PHOTOS.grainHands} alt="" className="mt-8 hidden aspect-[4/3] w-full rounded-3xl shadow-xl lg:block" />
            </Reveal>
          </div>
          <div className="grid content-start gap-3">
            {FAQ.map((f, i) => {
              const isOpen = open === i
              return (
                <Reveal key={f.q} delay={i * 50}>
                  <div className={cn('rounded-2xl border transition-colors', isOpen ? 'border-[#1E5631]/30 bg-[#F6FAF4]' : 'border-gray-100 bg-white')}>
                    <button className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                      <span className="font-semibold">{f.q}</span>
                      <ChevronDown className={cn('size-5 shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180 text-[#1E5631]')} />
                    </button>
                    {isOpen && <p className="px-6 pb-5 leading-relaxed text-gray-600">{f.a}</p>}
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      <CtaBand image={LOCAL.farm} />
    </>
  )
}
