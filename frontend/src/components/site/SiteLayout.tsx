import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ArrowRight, Check, ChevronDown, Menu, ShoppingBasket, Sparkles, Tractor, X } from 'lucide-react'

import { BRAND, LeafMark } from '@/components/brand/Brand'
import LanguageToggle from '@/components/shared/LanguageToggle'
import { useT } from '@/lib/i18n'
import { LOCAL, PHOTOS } from '@/lib/siteImages'
import { cn } from '@/lib/utils'

export const DARK = '#0B2414'

/** Translation function signature from useT(): t(swahili, english). */
type T = (sw: string, en: string) => string

/* ------------------------------------------------------------------
   Main navigation (like the reference site): Mwanzo · Soko · Bei na utabiri
------------------------------------------------------------------- */
export const buildPrimaryNav = (t: T) => [
  { label: t('Mwanzo', 'Home'), to: '/' },
  { label: t('Soko', 'Marketplace'), to: '/soko' },
  { label: t('Bei na utabiri', 'Prices & forecast'), to: '/bei' },
]

/* ------------------------------------------------------------------
   Information pages, shown under "Zaidi" (More)
------------------------------------------------------------------- */
export const buildSiteNav = (t: T) => [
  {
    label: t('Tunachotoa', 'What we offer'),
    to: '/offer',
    image: PHOTOS.manPhoneField,
    blurb: t('Utabiri wa AI, soko la moja kwa moja na bei rasmi mahali pamoja.', 'AI forecasts, a direct marketplace and official prices in one place.'),
    children: [
      { label: t('Utabiri wa bei wa AI', 'AI price prediction'), desc: t('Utabiri wa wiki kadhaa kwa kila zao na mkoa', 'Multi-week forecast per crop and region'), to: '/offer#prediction' },
      { label: t('Soko la moja kwa moja', 'Direct marketplace'), desc: t('Orodhesha, agiza na usafirishe mazao', 'List, order and deliver crops'), to: '/offer#marketplace' },
      { label: t('Bei za serikali', 'Government prices'), desc: t('Linganisha na bei elekezi', 'Compare with bei elekezi'), to: '/offer#gov-prices' },
      { label: t('Historia ya utabiri', 'Prediction history'), desc: t('Ona jinsi utabiri ulivyokuwa sahihi', 'See how accurate forecasts were'), to: '/offer#history' },
    ],
  },
  {
    label: t('Tunaowahudumia', 'Who we serve'),
    to: '/who-we-serve',
    image: PHOTOS.marketTomatoes,
    blurb: t('Imejengwa kwa ajili ya wakulima wanaolima na wanunuzi wanaonunua.', 'Built for the farmers who grow and the buyers who purchase.'),
    children: [
      { label: t('Wakulima', 'Farmers'), desc: t('Uza kwa wakati sahihi', 'Sell at the right time'), to: '/who-we-serve#farmers' },
      { label: t('Wanunuzi', 'Buyers'), desc: t('Nunua kwa bei sahihi', 'Buy at the right price'), to: '/who-we-serve#buyers' },
      { label: t('Mazao tunayoshughulikia', 'Crops we cover'), desc: t('Mazao yote 7 ya taarifa za Wizara', 'All 7 Ministry-bulletin crops'), to: '/who-we-serve#crops' },
      { label: t('Mikoa', 'Regions'), desc: t('Mikoa 18 ya masoko + kitaifa', '18 market regions + national'), to: '/who-we-serve#regions' },
    ],
  },
  {
    label: t('Jinsi inavyofanya kazi', 'How it works'),
    to: '/how-it-works',
    image: PHOTOS.womanPlanting,
    blurb: t('Kuanzia kujisajili hadi oda kufikishwa, hatua kwa hatua.', 'From sign-up to delivered order, step by step.'),
    children: [
      { label: t('Kwa wakulima', 'For farmers'), desc: t('Hatua tano hadi mauzo yako ya kwanza', 'Five steps to your first sale'), to: '/how-it-works#farmers' },
      { label: t('Kwa wanunuzi', 'For buyers'), desc: t('Vinjari, agiza, fuatilia', 'Browse, order, track'), to: '/how-it-works#buyers' },
      { label: t('Safari ya oda', 'Order journey'), desc: t('Inasubiri → imethibitishwa → imefikishwa', 'Pending → confirmed → delivered'), to: '/how-it-works#orders' },
      { label: t('Maswali yanayoulizwa mara kwa mara', 'FAQ'), desc: t('Majibu ya maswali ya kawaida', 'Common questions answered'), to: '/how-it-works#faq' },
    ],
  },
  {
    label: t('Teknolojia', 'Technology'),
    to: '/technology',
    image: PHOTOS.analyticsLaptop,
    blurb: t('Ujifunzaji wa mashine nyuma ya kila utabiri.', 'The machine learning behind every forecast.'),
    children: [
      { label: t('Jinsi AI inavyofanya kazi', 'How the AI works'), desc: t('Kuanzia bei hadi utabiri', 'From prices to predictions'), to: '/technology#pipeline' },
      { label: t('Usahihi wa modeli', 'Model accuracy'), desc: t('Hitilafu kwa kila zao dhidi ya msingi', 'Error per crop vs. a baseline'), to: '/technology#accuracy' },
      { label: t('Teknolojia zilizotumika', 'Tech stack'), desc: 'React, Flask, MongoDB, scikit-learn', to: '/technology#stack' },
    ],
  },
]

/* ------------------------------------------------------------------
   Reusable pieces
------------------------------------------------------------------- */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [seen, threshold])
  return { ref, seen }
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, seen } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn('transition-all duration-700 ease-out', seen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0', className)}
    >
      {children}
    </div>
  )
}

export function CountUp({ to, suffix = '', decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const { ref, seen } = useInView<HTMLSpanElement>(0.5)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!seen) return
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min((t - start) / 1400, 1)
      setN(to * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, to])
  return (
    <span ref={ref}>
      {n.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/** Image with a soft green gradient if the file can't load. */
export function SmartImg({ src, alt = '', className }: { src: string; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return <div role="img" aria-label={alt} className={cn('bg-gradient-to-br from-[#2F6B3A] via-[#3E7F45] to-[#6B4A2B]', className)} />
  return <img src={src} alt={alt} loading="lazy" className={cn('object-cover', className)} onError={() => setFailed(true)} />
}

export function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wider uppercase',
        light ? 'bg-white/10 text-[#B8E07A] ring-1 ring-white/20 backdrop-blur' : 'bg-[#EEF5EA] text-[#1E5631]',
      )}
    >
      <Sparkles className="size-3.5" /> {children}
    </span>
  )
}

export function BrandMark({ light = false }: { light?: boolean }) {
  const [failed, setFailed] = useState(false)
  const t = useT()
  return (
    <Link to="/" className="inline-flex items-center gap-2.5" aria-label={t('Agri-Market AI mwanzo', 'Agri-Market AI home')}>
      <span className="grid size-9 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {failed ? (
          <LeafMark className="size-6" />
        ) : (
          <img src={LOCAL.logo} alt="" className="size-9 scale-[1.6] object-contain" onError={() => setFailed(true)} />
        )}
      </span>
      <span className={cn('text-lg font-bold tracking-tight', light ? 'text-white' : 'text-[#111827]')}>
        Agri-Market <span style={{ color: BRAND.lime }}>AI</span>
      </span>
    </Link>
  )
}

/** Big photo hero used at the top of every inner page. */
export function PageHero({
  image,
  eyebrow,
  title,
  text,
  crumbs,
  children,
}: {
  image: string
  eyebrow: string
  title: ReactNode
  text: string
  crumbs: string
  children?: ReactNode
}) {
  const t = useT()
  return (
    <section className="relative isolate overflow-hidden text-white">
      <SmartImg src={image} alt="" className="absolute inset-0 -z-20 h-full w-full scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B2414] via-[#0B2414]/80 to-[#0B2414]/30" />
      <div className="mx-auto max-w-7xl px-5 pt-16 pb-20 md:px-8 lg:pt-24 lg:pb-28">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/60">
          <Link to="/" className="hover:text-white">
            {t('Mwanzo', 'Home')}
          </Link>{' '}
          / <span className="text-white/90">{crumbs}</span>
        </nav>
        <Reveal>
          <Eyebrow light>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/80">{text}</p>
        </Reveal>
        {children && <Reveal delay={300}>{children}</Reveal>}
      </div>
    </section>
  )
}

export function SectionTitle({ eyebrow, title, text, center = false }: { eyebrow: string; title: ReactNode; text?: string; center?: boolean }) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
      {text && <p className="mt-4 text-lg leading-relaxed text-gray-600">{text}</p>}
    </Reveal>
  )
}

export function PrimaryLink({ to, children, light = false }: { to: string; children: ReactNode; light?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5',
        light ? 'bg-white text-[#1E5631] hover:bg-[#EEF5EA]' : 'text-white shadow-[#1E5631]/25 hover:brightness-110',
      )}
      style={light ? undefined : { background: BRAND.green }}
    >
      {children}
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
    </Link>
  )
}

/** Photo-backed call-to-action band used at the bottom of every page. */
export function CtaBand({ image = LOCAL.soil, title, text }: { image?: string; title?: ReactNode; text?: string }) {
  const t = useT()
  return (
    <section className="px-5 py-20 md:px-8">
      <Reveal>
        <div className="relative isolate mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-8 py-16 text-center text-white shadow-2xl sm:px-16 sm:py-20">
          <SmartImg src={image} alt="" className="absolute inset-0 -z-20 h-full w-full" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0B2414]/95 via-[#1E5631]/85 to-[#8A5A2B]/80" />
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            {title ?? (
              <>
                {t('Uza kwa wakati sahihi.', 'Sell at the right time.')} <span className="text-[#B8E07A]">{t('Nunua kwa bei sahihi.', 'Buy at the right price.')}</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/80">{text ?? t('Fungua akaunti yako kwa chini ya dakika mbili.', 'Create your account in less than two minutes.')}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register?role=farmer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-semibold text-[#1E5631] shadow-xl transition hover:-translate-y-0.5"
            >
              <Tractor className="size-4" /> {t('Jisajili kama mkulima', 'Register as farmer')}
            </Link>
            <Link
              to="/register?role=buyer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/40 px-7 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <ShoppingBasket className="size-4" /> {t('Jisajili kama mnunuzi', 'Register as buyer')}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

/* ------------------------------------------------------------------
   Header with mega-menu
------------------------------------------------------------------- */
function Header() {
  const t = useT()
  const PRIMARY_NAV = buildPrimaryNav(t)
  const SITE_NAV = buildSiteNav(t)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close the mobile menu after navigating
  useEffect(() => {
    setOpen(false)
    setExpanded(null)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white/90 shadow-[0_1px_0_rgba(0,0,0,.06),0_8px_24px_-12px_rgba(0,0,0,.15)] backdrop-blur-xl' : 'bg-white',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-[#1E5631]',
                  isActive ? 'text-[#1E5631] after:absolute after:inset-x-3.5 after:-bottom-[13px] after:h-0.5 after:rounded-full after:bg-[#1E5631]' : 'text-gray-700',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          {/* "Zaidi" mega-menu with the information pages */}
          <div className="group relative">
            <button className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#1E5631]">
              {t('Zaidi', 'More')}
              <ChevronDown className="size-3.5 text-gray-400 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute top-full right-0 w-[640px] pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/5">
                {SITE_NAV.map((item) => (
                  <Link key={item.to} to={item.to} className="group/item flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-[#F4F9F1]">
                    <SmartImg src={item.image} alt="" className="size-16 shrink-0 rounded-lg" />
                    <span>
                      <span className="block text-sm font-semibold text-gray-900 group-hover/item:text-[#1E5631]">{item.label}</span>
                      <span className="block text-xs leading-snug text-gray-500">{item.blurb}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageToggle />
          <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-800 hover:text-[#1E5631]">
            {t('Ingia', 'Sign in')}
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1E5631]/25 transition hover:brightness-110"
            style={{ background: BRAND.green }}
          >
            {t('Jisajili', 'Get started')} <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle />
          <button
            className="grid size-10 place-items-center rounded-lg text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? t('Funga menyu', 'Close menu') : t('Fungua menyu', 'Open menu')}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* mobile menu */}
      {open && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-gray-100 bg-white px-5 pb-6 lg:hidden">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn('block border-b border-gray-100 py-3.5 text-sm font-semibold', isActive ? 'text-[#1E5631]' : 'text-gray-800')
              }
            >
              {item.label}
            </NavLink>
          ))}
          <p className="pt-5 pb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">{t('Zaidi', 'More')}</p>
          {SITE_NAV.map((item) => (
            <div key={item.to} className="border-b border-gray-100">
              <button
                className="flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold text-gray-800"
                onClick={() => setExpanded((e) => (e === item.to ? null : item.to))}
                aria-expanded={expanded === item.to}
              >
                {item.label}
                <ChevronDown className={cn('size-4 text-gray-400 transition-transform', expanded === item.to && 'rotate-180')} />
              </button>
              {expanded === item.to && (
                <ul className="grid gap-1 pb-3">
                  <li>
                    <Link to={item.to} className="block rounded-lg px-3 py-2 text-sm font-medium text-[#1E5631]">
                      {t('Muhtasari', 'Overview')}
                    </Link>
                  </li>
                  {item.children.map((c) => (
                    <li key={c.to}>
                      <Link to={c.to} className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/login" className="rounded-lg border border-gray-200 py-2.5 text-center text-sm font-semibold">
              {t('Ingia', 'Sign in')}
            </Link>
            <Link to="/register" className="rounded-lg py-2.5 text-center text-sm font-semibold text-white" style={{ background: BRAND.green }}>
              {t('Jisajili', 'Get started')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

/* ------------------------------------------------------------------
   Footer
------------------------------------------------------------------- */
function Footer() {
  const t = useT()
  const PRIMARY_NAV = buildPrimaryNav(t)
  const SITE_NAV = buildSiteNav(t)
  return (
    <footer className="text-white" style={{ background: DARK }}>
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pt-16 pb-10 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.1fr]">
        <div>
          <BrandMark light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/60">
            {t('Soko la mazao linaloongozwa na takwimu za bei. Mazao 7 ya Wizara · Tanzania.', 'A crop market driven by real price data. 7 Ministry crops · Tanzania.')}
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            {PRIMARY_NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-[#B8E07A]">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {SITE_NAV.slice(0, 3).map((item) => (
          <div key={item.to}>
            <Link to={item.to} className="text-sm font-semibold hover:text-[#B8E07A]">
              {item.label}
            </Link>
            <ul className="mt-4 grid gap-2.5 text-sm text-white/60">
              {item.children.map((c) => (
                <li key={c.to}>
                  <Link to={c.to} className="hover:text-white">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <Link to="/technology" className="text-sm font-semibold hover:text-[#B8E07A]">
            {t('Teknolojia', 'Technology')}
          </Link>
          <ul className="mt-4 grid gap-2.5 text-sm text-white/60">
            {SITE_NAV[3].children.map((c) => (
              <li key={c.to}>
                <Link to={c.to} className="hover:text-white">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between md:px-8">
          <p>© {new Date().getFullYear()} Agri-Market AI. {t('Haki zote zimehifadhiwa.', 'All rights reserved.')}</p>
          <p>
            {t('Picha za hifadhi kutoka', 'Stock photos from')}{' '}
            <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="underline hover:text-white">
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------
   Layout: announcement + header + page + footer
------------------------------------------------------------------- */
export default function SiteLayout() {
  const t = useT()
  const { pathname, hash } = useLocation()

  // go to the top on a new page, or to the section named in the #hash
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])

  return (
    <div className="min-h-screen bg-white font-sans text-[#111827] antialiased">
      <style>{`
        @keyframes am-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes am-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes am-draw { from { stroke-dashoffset: 600 } to { stroke-dashoffset: 0 } }
      `}</style>

      <div className="bg-[#0B2414] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-5 py-2 text-center text-xs sm:text-sm">
          <span className="rounded-full bg-[#8DC63F] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#0B2414] uppercase">{t('Mpya', 'New')}</span>
          <span className="text-white/85">{t('Utabiri wa bei wa wiki kadhaa kwa mazao yote 7 — unasasishwa kila siku.', 'Multi-week price forecasts for all 7 crops — updated every day.')}</span>
          <Link to="/bei" className="hidden items-center gap-1 font-semibold text-[#B8E07A] hover:underline sm:inline-flex">
            {t('Angalia bei', 'View prices')} <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <Header />
      <main className="[&_[id]]:scroll-mt-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------
   Photo + text section (image left or right), used on the inner pages
------------------------------------------------------------------- */
export function SplitSection({
  id,
  image,
  eyebrow,
  title,
  text,
  points,
  reverse = false,
  tinted = false,
  badge,
  children,
}: {
  id?: string
  image: string
  eyebrow: string
  title: ReactNode
  text: string
  points?: string[]
  reverse?: boolean
  tinted?: boolean
  badge?: ReactNode
  children?: ReactNode
}) {
  return (
    <section id={id} className={cn('py-20 lg:py-28', tinted && 'bg-[#FAFAF7]')}>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2 lg:gap-20">
        <Reveal className={cn('relative', reverse && 'lg:order-2')}>
          <div className={cn('absolute -inset-3 rounded-[2.25rem] bg-gradient-to-br from-[#8DC63F]/25 to-[#E8CBA8]/50', reverse ? 'rotate-2' : '-rotate-2')} />
          <SmartImg src={image} alt="" className="relative aspect-[4/3] w-full rounded-[2rem] shadow-2xl" />
          {badge && (
            <div
              className={cn('absolute -bottom-6 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/5', reverse ? '-left-2 sm:-left-8' : '-right-2 sm:-right-8')}
              style={{ animation: 'am-float 6s ease-in-out infinite' }}
            >
              {badge}
            </div>
          )}
        </Reveal>
        <Reveal delay={120}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">{text}</p>
          {points && (
            <ul className="mt-6 grid gap-3">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#EEF5EA]">
                    <Check className="size-3.5" strokeWidth={3} style={{ color: BRAND.green }} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          )}
          {children}
        </Reveal>
      </div>
    </section>
  )
}
