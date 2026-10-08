import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Landmark, MapPin, Package, Search, ShoppingCart, SlidersHorizontal, TrendingDown, TrendingUp, UserRound } from 'lucide-react'

import { BRAND } from '@/components/brand/Brand'
import { PageHero, Reveal, SmartImg } from '@/components/site/SiteLayout'
import { useAuth } from '@/context/AuthContext'
import { ACTIVE_CROPS, sw } from '@/lib/crops'
import { num, shortDate, tzs } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { CROP_PHOTOS, PHOTOS } from '@/lib/siteImages'
import type { GovPrice } from '@/lib/types'
import { useApi } from '@/lib/useApi'
import { cn } from '@/lib/utils'

interface PublicListing {
  id: string
  crop: string
  variety?: string
  quantity_kg: number
  quantity_available_kg: number
  price_per_kg: number
  region: string
  district?: string
  quality_grade?: string
  min_order_kg?: number
  harvest_date?: string
  description?: string
  status: string
  farmer_name: string
  gov_price: GovPrice | null
  vs_gov_pct: number | null
}

export default function SokoPage() {
  const t = useT()
  const { user } = useAuth()
  const [crop, setCrop] = useState<string>('')
  const [region, setRegion] = useState<string>('')
  const [text, setText] = useState('')
  const [sort, setSort] = useState<'new' | 'cheap' | 'qty'>('new')

  const { data: meta } = useApi<{ regions: string[] }>('/public/meta')
  const params = new URLSearchParams()
  if (crop) params.set('crop', crop)
  if (region) params.set('region', region)
  const { data, loading, error } = useApi<{ listings: PublicListing[] }>(`/public/listings?${params.toString()}`)

  const rows = useMemo(() => {
    const q = text.trim().toLowerCase()
    let list = (data?.listings ?? []).filter(
      (l) => !q || [l.crop, sw(l.crop), l.variety, l.region, l.district].join(' ').toLowerCase().includes(q),
    )
    if (sort === 'cheap') list = [...list].sort((a, b) => a.price_per_kg - b.price_per_kg)
    if (sort === 'qty') list = [...list].sort((a, b) => b.quantity_available_kg - a.quantity_available_kg)
    return list
  }, [data, text, sort])

  // where "Agiza" (order) sends the visitor
  const orderLink = user?.role === 'buyer' ? '/buyer' : user ? `/${user.role}` : '/register?role=buyer'

  return (
    <>
      <PageHero
        image={PHOTOS.marketProduce}
        crumbs={t('Soko', 'Market')}
        eyebrow={t('Soko la mazao', 'Crop marketplace')}
        title={
          <>
            {t('Nunua mazao', 'Buy crops')} <span className="text-[#B8E07A]">{t('kwa mkulima', 'from the farmer')}</span>
          </>
        }
        text={t(
          'Tafuta mazao yote 7 kwa eneo, kiasi na bei inayokufaa. Kila tangazo linaonyesha bei elekezi ya serikali ili ujue kama bei ni ya haki.',
          'Search all 7 crops by location, quantity and the price that suits you. Every listing shows the government indicative price so you know whether the price is fair.',
        )}
      />

      <section className="relative z-10 -mt-10 px-5 md:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-black/5 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* crop chips */}
            <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('Zao', 'Crop')}>
              {[{ v: '', label: t('Yote', 'All') }, ...ACTIVE_CROPS.map((c) => ({ v: c, label: sw(c) }))].map((c) => (
                <button
                  key={c.v || 'all'}
                  role="tab"
                  aria-selected={crop === c.v}
                  onClick={() => setCrop(c.v)}
                  className={cn(
                    'rounded-full px-5 py-2.5 text-sm font-semibold transition',
                    crop === c.v ? 'text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  )}
                  style={crop === c.v ? { background: BRAND.green } : undefined}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('Tafuta aina, mkoa au wilaya…', 'Search variety, region or district…')}
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pr-3 pl-10 text-sm outline-none focus:border-[#1E5631] focus:bg-white focus:ring-[3px] focus:ring-[#1E5631]/15"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 lg:flex">
              <label className="relative min-w-0">
                <span className="sr-only">{t('Mkoa', 'Region')}</span>
                <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-11 w-full appearance-none truncate rounded-xl border border-gray-200 bg-gray-50 pr-3 pl-9 text-sm outline-none focus:border-[#1E5631]"
                >
                  <option value="">{t('Mikoa yote', 'All regions')}</option>
                  {(meta?.regions ?? []).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative min-w-0">
                <span className="sr-only">{t('Panga', 'Sort')}</span>
                <SlidersHorizontal className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="h-11 w-full appearance-none truncate rounded-xl border border-gray-200 bg-gray-50 pr-3 pl-9 text-sm outline-none focus:border-[#1E5631]"
                >
                  <option value="new">{t('Mapya kwanza', 'Newest first')}</option>
                  <option value="cheap">{t('Bei ya chini kwanza', 'Lowest price first')}</option>
                  <option value="qty">{t('Kiasi kikubwa kwanza', 'Largest quantity first')}</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <p className="mb-6 text-sm text-gray-500">
            {loading
              ? t('Inatafuta mazao…', 'Searching crops…')
              : error
                ? ''
                : `${t('Matangazo', 'Listings')} ${rows.length}${crop ? ` ${t('ya', 'of')} ${sw(crop).toLowerCase()}` : ''}${region ? ` — ${region}` : ''}`}
          </p>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {t('Imeshindikana kupakia matangazo.', 'Failed to load listings.')} {error}
            </div>
          )}

          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl bg-gray-100" />
              ))}
            </div>
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-gray-200 px-6 py-16 text-center">
              <Package className="mx-auto size-10 text-gray-300" />
              <p className="mt-4 font-semibold">{t('Hakuna tangazo linalolingana', 'No matching listings')}</p>
              <p className="mt-1 text-sm text-gray-500">{t('Badilisha zao, mkoa au neno la kutafuta.', 'Change the crop, region or search term.')}</p>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((l, i) => {
              const cheaper = l.vs_gov_pct != null && l.vs_gov_pct <= 0
              const soldPct = Math.round((1 - l.quantity_available_kg / l.quantity_kg) * 100)
              return (
                <Reveal key={l.id} delay={(i % 3) * 80}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-2xl">
                    <div className="relative h-44 overflow-hidden">
                      <SmartImg src={CROP_PHOTOS[l.crop]} alt={sw(l.crop)} className="h-full w-full transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute top-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#1E5631]">{sw(l.crop)}</span>
                      {l.quality_grade && (
                        <span className="absolute top-3 right-3 rounded-full bg-[#E8CBA8] px-3 py-1 text-xs font-semibold text-[#3b2a17]">{l.quality_grade}</span>
                      )}
                      <p className="absolute bottom-3 left-4 text-lg font-bold text-white">{l.variety || sw(l.crop)}</p>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-col items-start gap-2">
                        <p className="text-2xl font-extrabold whitespace-nowrap">
                          {tzs(l.price_per_kg)}
                          <span className="text-sm font-medium text-gray-400">/kg</span>
                        </p>
                        {l.vs_gov_pct != null && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                              cheaper ? 'bg-[#EEF5EA] text-[#1E5631]' : 'bg-amber-50 text-amber-700',
                            )}
                            title={t('Ukilinganisha na bei elekezi ya serikali', 'Compared with the government indicative price')}
                          >
                            {cheaper ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
                            {Math.abs(l.vs_gov_pct)}% {cheaper ? t('chini', 'below') : t('juu', 'above')} {t('ya bei elekezi', 'the indicative price')}
                          </span>
                        )}
                      </div>

                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="size-4 text-gray-400" />
                          <span>
                            <span className="font-semibold text-gray-900">{num(l.quantity_available_kg)}</span> kg
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="size-4 text-gray-400" />
                          <span className="truncate">{[l.district, l.region].filter(Boolean).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <UserRound className="size-4 text-gray-400" /> {l.farmer_name}
                        </div>
                        {l.harvest_date && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <CalendarDays className="size-4 text-gray-400" /> {t('Mavuno', 'Harvest')} {shortDate(l.harvest_date)}
                          </div>
                        )}
                      </dl>

                      {soldPct > 0 && (
                        <div className="mt-4">
                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full rounded-full bg-[#8DC63F]" style={{ width: `${soldPct}%` }} />
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400">{soldPct}% {t('imeshanunuliwa', 'sold')}</p>
                        </div>
                      )}

                      {l.gov_price && (
                        <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-snug text-gray-400">
                          <Landmark className="mt-px size-3.5 shrink-0" />
                          {t('Bei elekezi', 'Indicative price')} {tzs(l.gov_price.price)}/kg · {l.gov_price.source}, {shortDate(l.gov_price.date)}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <span className="text-xs text-gray-500">{t('Oda ya chini', 'Min. order')}: {num(l.min_order_kg ?? 0)} kg</span>
                        <Link
                          to={orderLink}
                          className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                          style={{ background: BRAND.green }}
                        >
                          <ShoppingCart className="size-4" /> {t('Agiza', 'Order')}
                        </Link>
                      </div>
                    </div>
                  </article>
                </Reveal>
              )
            })}
          </div>

          {!user && rows.length > 0 && (
            <p className="mt-10 text-center text-sm text-gray-500">
              {t("Ili kuagiza na kuona namba ya simu ya mkulima,", "To order and see the farmer's phone number,")}{' '}
              <Link to="/register?role=buyer" className="font-semibold text-[#1E5631] hover:underline">
                {t('jisajili kama mnunuzi', 'sign up as a buyer')}
              </Link>{' '}
              {t('au', 'or')}{' '}
              <Link to="/login" className="font-semibold text-[#1E5631] hover:underline">
                {t('ingia', 'log in')}
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </>
  )
}
