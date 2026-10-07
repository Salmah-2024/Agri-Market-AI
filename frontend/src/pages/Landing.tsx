import { Link, Navigate } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarRange,
  Check,
  ClipboardList,
  Handshake,
  MapPin,
  Minus,
  Search,
  ShoppingBasket,
  Sprout,
  Tractor,
} from 'lucide-react'

import { BRAND } from '@/components/brand/Brand'
import { DARK, Eyebrow, Reveal, SectionTitle, SmartImg } from '@/components/site/SiteLayout'
import { useAuth } from '@/context/AuthContext'
import { sw } from '@/lib/crops'
import { num, shortDate, tzs } from '@/lib/format'
import { CROP_PHOTOS, LOCAL, PHOTOS } from '@/lib/siteImages'
import type { Forecast, GovPrice } from '@/lib/types'
import { useApi } from '@/lib/useApi'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    icon: BadgeCheck,
    title: 'Bei zilizothibitishwa',
    text: 'Kila bei rasmi inaonyeshwa pamoja na chanzo chake na tarehe — hakuna bei isiyo na chanzo.',
    image: PHOTOS.sacks,
  },
  {
    icon: Handshake,
    title: 'Moja kwa moja, bila dalali',
    text: 'Mkulima anatangaza, mnunuzi anaagiza. Mnawasiliana moja kwa moja.',
    image: LOCAL.deal,
  },
  {
    icon: CalendarRange,
    title: 'Utabiri wa wiki',
    text: 'AI inakadiria bei za wiki zijazo ili upange lini kuuza au kununua.',
    image: PHOTOS.manPhoneField,
  },
]

const STEPS = [
  { icon: Sprout, who: 'Mkulima', title: 'Tangaza mazao', text: 'Weka zao, kiasi, bei na mahali yalipo.' },
  { icon: Search, who: 'Mnunuzi', title: 'Tafuta na uagize', text: 'Tafuta kwa zao na mkoa, kisha tuma oda moja kwa moja.' },
  { icon: ClipboardList, who: 'Wote wawili', title: 'Fuatilia hadi mwisho', text: 'Oda inathibitishwa, inafikishwa — wote mnaona hatua kwa hatua.' },
]

interface PriceRow {
  crop: string
  official: GovPrice | null
  forecast: Forecast | null
}

interface MiniListing {
  id: string
  crop: string
  variety?: string
  price_per_kg: number
  quantity_available_kg: number
  region: string
  farmer_name: string
}

function TrendPill({ pct }: { pct: number }) {
  const Icon = pct > 1 ? ArrowUpRight : pct < -1 ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold',
        pct > 1 ? 'bg-[#EEF5EA] text-[#1E5631]' : pct < -1 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600',
      )}
    >
      <Icon className="size-3" /> {pct > 0 ? '+' : ''}
      {pct.toFixed(1)}%
    </span>
  )
}

export default function Landing() {
  const { user } = useAuth()
  const { data: prices } = useApi<{ crops: PriceRow[] }>(user ? null : '/public/prices')
  const { data: market } = useApi<{ listings: MiniListing[] }>(user ? null : '/public/listings')

  if (user) return <Navigate to={`/${user.role}`} replace />

  return (
    <>
      {/* ---------------- HERO ---------------- */}
      <section className="relative isolate overflow-hidden text-white">
        <SmartImg src={LOCAL.farm} alt="" className="absolute inset-0 -z-20 h-full w-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B2414] via-[#0B2414]/85 to-[#0B2414]/30" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-16 pb-24 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-24 lg:pb-32">
          <div>
            <Reveal>
              <Eyebrow light>Mahindi · Mchele · Tanzania</Eyebrow>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-6 text-5xl leading-[1.03] font-extrabold tracking-tight sm:text-6xl xl:text-7xl">
                Uza kwa wakati sahihi.
                <br />
                <span className="text-[#B8E07A]">Nunua kwa bei yenye taarifa.</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
                Agri-Market AI inawaunganisha wakulima na wanunuzi wa mazao yote 7, ikionyesha bei za soko na utabiri wa wiki.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/soko"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-semibold text-[#1E5631] shadow-xl transition hover:-translate-y-0.5"
                >
                  <ShoppingBasket className="size-4" /> Nenda sokoni
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/bei"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <CalendarRange className="size-4" /> Angalia bei na utabiri
                </Link>
              </div>
            </Reveal>
            <Reveal delay={400}>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
                {['Bei zenye chanzo na tarehe', 'Bila dalali', 'Kwa Kiswahili'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="size-4 text-[#8DC63F]" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* live price cards */}
          <Reveal delay={250}>
            <div className="rounded-[2rem] bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur-md sm:p-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Bei za leo · wastani wa kitaifa</p>
                <span className="flex items-center gap-1.5 text-xs text-white/70">
                  <span className="size-2 animate-pulse rounded-full bg-[#8DC63F]" /> Inasasishwa kila siku
                </span>
              </div>
              <div className="mt-5 grid gap-4">
                {(prices?.crops ?? [{ crop: 'Maize' }, { crop: 'Rice' }] as PriceRow[]).map((r) => (
                  <Link key={r.crop} to="/bei" className="group flex items-center gap-4 rounded-2xl bg-white p-3 pr-5 text-[#111827] shadow-lg transition hover:-translate-y-0.5">
                    <SmartImg src={CROP_PHOTOS[r.crop]} alt="" className="size-16 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{sw(r.crop)}</p>
                      <p className="truncate text-xs text-gray-500">
                        {r.official ? `Bei elekezi ${tzs(r.official.price)}/kg · ${shortDate(r.official.date)}` : 'Inapakia…'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">AI wiki 4</p>
                      {r.forecast ? (
                        <>
                          <p className="font-bold text-[#1E5631]">{tzs(r.forecast.forecast[r.forecast.forecast.length - 1].price)}</p>
                          <TrendPill pct={r.forecast.change_pct} />
                        </>
                      ) : (
                        <p className="font-bold text-gray-300">—</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-white/60">Utabiri ni makadirio. Bei rasmi zinaonyeshwa pamoja na chanzo na tarehe.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle center eyebrow="Kwa nini Agri-Market AI" title="Maamuzi ya soko yanayoongozwa na taarifa" />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text, image }, i) => (
              <Reveal key={title} delay={i * 110}>
                <article className="group h-full overflow-hidden rounded-3xl border border-gray-100 bg-white transition hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#1E5631]/10">
                  <div className="relative h-52 overflow-hidden">
                    <SmartImg src={image} alt="" className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
                    <span className="absolute bottom-4 left-4 grid size-12 place-items-center rounded-2xl bg-white shadow-lg">
                      <Icon className="size-6" style={{ color: BRAND.green }} />
                    </span>
                  </div>
                  <div className="p-7">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="mt-2 leading-relaxed text-gray-600">{text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="relative isolate overflow-hidden py-24 text-white" style={{ background: DARK }}>
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background:radial-gradient(circle_at_15%_20%,#8DC63F_0,transparent_40%),radial-gradient(circle_at_85%_80%,#E8CBA8_0,transparent_35%)]" />
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow light>Inavyofanya kazi</Eyebrow>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">Hatua tatu tu</h2>
          </Reveal>
          <div className="relative mt-16 grid gap-6 md:grid-cols-3">
            <div className="absolute top-10 right-[16%] left-[16%] hidden h-0.5 bg-gradient-to-r from-[#8DC63F]/0 via-[#8DC63F] to-[#8DC63F]/0 md:block" />
            {STEPS.map(({ icon: Icon, who, title, text }, i) => (
              <Reveal key={title} delay={i * 130} className="relative text-center">
                <span className="relative mx-auto grid size-20 place-items-center rounded-3xl bg-white text-[#1E5631] shadow-xl">
                  <Icon className="size-8" />
                  <span className="absolute -top-2 -right-2 grid size-8 place-items-center rounded-full bg-[#8DC63F] text-sm font-bold text-[#0B2414] ring-4 ring-[#0B2414]">
                    {i + 1}
                  </span>
                </span>
                <p className="mt-6 text-xs font-semibold tracking-wider text-[#B8E07A] uppercase">{who}</p>
                <h3 className="mt-1 text-xl font-bold">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/70">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- LATEST LISTINGS ---------------- */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <SectionTitle eyebrow="Sokoni sasa hivi" title="Mazao mapya kutoka kwa wakulima" />
            <Reveal>
              <Link to="/soko" className="group inline-flex items-center gap-2 font-semibold text-[#1E5631]">
                Ona soko lote <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(market?.listings ?? []).slice(0, 3).map((l, i) => (
              <Reveal key={l.id} delay={i * 90}>
                <Link to="/soko" className="group block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-2xl">
                  <div className="relative h-40 overflow-hidden">
                    <SmartImg src={CROP_PHOTOS[l.crop]} alt="" className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
                    <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1E5631]">{sw(l.crop)}</span>
                  </div>
                  <div className="p-5">
                    <p className="font-bold">{l.variety || sw(l.crop)}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-lg font-extrabold">
                        {tzs(l.price_per_kg)}
                        <span className="text-xs font-medium text-gray-400">/kg</span>
                      </span>
                      <span className="text-gray-500">{num(l.quantity_available_kg)} kg</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="size-3.5" /> {l.region} · {l.farmer_name}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
            {!market && [0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-gray-100" />)}
          </div>
        </div>
      </section>

      {/* ---------------- WHO ---------------- */}
      <section className="bg-[#FAFAF7] py-24">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 md:px-8 lg:grid-cols-2">
          {[
            {
              img: PHOTOS.farmerField,
              art: LOCAL.tractor,
              who: 'Kwa wakulima',
              title: 'Jua bei kabla hujavuna',
              points: ['Utabiri wa wiki wa mazao yako', 'Tangaza mazao na simamia oda', 'Wafikie wanunuzi kwa mkoa'],
              to: '/register?role=farmer',
              cta: 'Jisajili kama mkulima',
            },
            {
              img: PHOTOS.vendorPhone,
              art: LOCAL.money,
              who: 'Kwa wanunuzi',
              title: 'Nunua kwa bei ya haki',
              points: ['Kila tangazo dhidi ya bei elekezi', 'Mtazamo wa AI kwa kila zao', 'Lipa kwa taslimu, simu au benki'],
              to: '/register?role=buyer',
              cta: 'Jisajili kama mnunuzi',
            },
          ].map((c, i) => (
            <Reveal key={c.who} delay={i * 150}>
              <article className="group relative isolate h-full min-h-[28rem] overflow-hidden rounded-3xl shadow-xl">
                <SmartImg src={c.img} alt="" className="absolute inset-0 -z-20 h-full w-full transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0B2414] via-[#0B2414]/70 to-[#0B2414]/10" />
                <div className="flex h-full flex-col justify-end p-8 text-white sm:p-10">
                  <span className="mb-auto grid size-16 place-items-center rounded-2xl bg-white p-2 shadow-lg">
                    <img src={c.art} alt="" className="size-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </span>
                  <span className="text-sm font-semibold tracking-wider text-[#B8E07A] uppercase">{c.who}</span>
                  <h3 className="mt-2 text-3xl font-bold">{c.title}</h3>
                  <ul className="mt-5 grid gap-2.5">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-center gap-2.5 text-white/90">
                        <Check className="size-4 text-[#8DC63F]" strokeWidth={3} /> {p}
                      </li>
                    ))}
                  </ul>
                  <Link to={c.to} className="mt-7 inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1E5631] transition hover:bg-[#EEF5EA]">
                    {c.cta} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="px-5 py-20 md:px-8">
        <Reveal>
          <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-8 py-16 text-center text-white shadow-2xl sm:px-16 sm:py-20">
            <SmartImg src={PHOTOS.womanHarvestingRice} alt="" className="absolute inset-0 -z-20 h-full w-full" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B2414]/95 via-[#1E5631]/85 to-[#8A5A2B]/80" />
            <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">Anza kuuza au kununua leo</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">Fungua akaunti kwa chini ya dakika mbili.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/register?role=farmer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-semibold text-[#1E5631] shadow-xl transition hover:-translate-y-0.5"
              >
                <Tractor className="size-4" /> Mimi ni mkulima
              </Link>
              <Link
                to="/register?role=buyer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                <ShoppingBasket className="size-4" /> Mimi ni mnunuzi
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
