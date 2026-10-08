import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CalendarCheck, ExternalLink, Info, Landmark, MapPin, Minus, Sparkles } from 'lucide-react'

import { BRAND } from '@/components/brand/Brand'
import { PageHero, Reveal, SmartImg } from '@/components/site/SiteLayout'
import { sw } from '@/lib/crops'
import { longDate, shortDate, tzs } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { CROP_PHOTOS, PHOTOS } from '@/lib/siteImages'
import type { Forecast, GovPrice } from '@/lib/types'
import { useApi } from '@/lib/useApi'
import { cn } from '@/lib/utils'

interface PriceRow {
  crop: string
  official: GovPrice | null
  forecast: Forecast | null
}

function Chart({ f, gov }: { f: Forecast; gov?: number | null }) {
  const t = useT()
  const rows: { date: string; actual?: number; predicted?: number; band?: [number, number] }[] = f.recent.map((r) => ({
    date: r.date,
    actual: r.price,
  }))
  if (rows.length) rows[rows.length - 1].predicted = rows[rows.length - 1].actual
  f.forecast.forEach((p) => rows.push({ date: p.date, predicted: p.price, band: [p.low, p.high] }))
  // only draw the official-price line when it is close enough not to squash the chart
  const showGov = !!gov && Math.abs(gov - f.current_price) / f.current_price < 0.2

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#EEF0EC" />
          <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={28} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <YAxis width={56} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v: number) => v.toLocaleString('en-US')} tick={{ fill: '#6B7280', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
            labelFormatter={(l) => shortDate(String(l))}
            formatter={(v, name) => {
              if (Array.isArray(v)) return [`${tzs(v[0])} – ${tzs(v[1])}`, t('Wigo unaowezekana', 'Possible range')]
              return [tzs(Number(v)) + '/kg', name === 'actual' ? t('Makadirio ya soko', 'Market estimate') : t('Utabiri wa AI', 'AI forecast')]
            }}
          />
          <Area dataKey="band" stroke="none" fill="#8DC63F" fillOpacity={0.18} isAnimationActive={false} />
          <Line dataKey="actual" stroke={BRAND.green} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line dataKey="predicted" stroke="#8DC63F" strokeWidth={2.5} strokeDasharray="6 5" dot={false} isAnimationActive={false} />
          {showGov ? (
            <ReferenceLine y={gov} stroke="#B7791F" strokeDasharray="2 3" label={{ value: t('Bei elekezi', 'Indicative price'), position: 'insideTopLeft', fill: '#B7791F', fontSize: 11 }} />
          ) : null}
          <ReferenceLine x={f.as_of} stroke="#9CA3AF" strokeOpacity={0.5} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function Trend({ pct }: { pct: number }) {
  const t = useT()
  const up = pct > 1
  const down = pct < -1
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
        up ? 'bg-[#EEF5EA] text-[#1E5631]' : down ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600',
      )}
    >
      <Icon className="size-3.5" /> {pct > 0 ? '+' : ''}
      {pct.toFixed(1)}% {t('wiki 4', 'week 4')}
    </span>
  )
}

export default function BeiPage() {
  const t = useT()
  const [region, setRegion] = useState('National')
  const { data: meta } = useApi<{ regions: string[] }>('/public/meta')
  const { data, loading, error } = useApi<{ region: string; crops: PriceRow[] }>(`/public/prices?region=${encodeURIComponent(region)}`)

  const SOURCES = [
    {
      name: t('Wizara ya Kilimo — Taarifa ya Masoko ya Wiki', 'Ministry of Agriculture — Weekly Market Bulletin'),
      note: t('Bei elekezi rasmi za jumla kwa kila mkoa', 'Official wholesale indicative prices per region'),
      url: 'https://www.kilimo.go.tz',
    },
    {
      name: 'WFP VAM DataBridges',
      note: t('Takwimu za bei za masoko zilizopangwa', 'Curated market price data'),
      url: 'https://dataviz.vam.wfp.org',
    },
  ]

  return (
    <>
      <PageHero
        image={PHOTOS.riceGolden}
        crumbs={t('Bei na utabiri', 'Prices & forecasts')}
        eyebrow={t('Bei na utabiri', 'Prices & forecasts')}
        title={
          <>
            {t('Bei na utabiri wa', 'Prices and forecasts for the')} <span className="text-[#B8E07A]">{t('wiki', 'week')}</span>
          </>
        }
        text={t(
          'Kila bei rasmi ina chanzo na tarehe; kila utabiri umeandikwa wazi kuwa ni makadirio.',
          'Every official price has a source and date; every forecast is clearly marked as an estimate.',
        )}
      >
        <label className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 p-2 pl-4 ring-1 ring-white/20 backdrop-blur">
          <MapPin className="size-4 text-[#B8E07A]" />
          <span className="text-sm font-medium">{t('Mkoa', 'Region')}</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="h-10 rounded-xl bg-white px-3 text-sm font-semibold text-[#0B2414] outline-none"
          >
            <option value="National">{t('Wastani wa kitaifa', 'National average')}</option>
            {(meta?.regions ?? []).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </PageHero>

      <section className="py-14 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:px-8">
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{t('Imeshindikana kupakia bei.', 'Failed to load prices.')} {error}</div>}
          {loading && [0, 1].map((i) => <div key={i} className="h-[30rem] animate-pulse rounded-3xl bg-gray-100" />)}

          {!loading &&
            data?.crops.map((row, idx) => {
              const f = row.forecast
              const o = row.official
              const tomorrow = f?.forecast[0]
              return (
                <Reveal key={row.crop} delay={idx * 100}>
                  <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                    {/* header */}
                    <div className="relative isolate flex flex-col gap-4 p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
                      <SmartImg src={CROP_PHOTOS[row.crop]} alt="" className="absolute inset-0 -z-20 h-full w-full" />
                      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0B2414]/95 via-[#0B2414]/80 to-[#0B2414]/40" />
                      <div>
                        <p className="text-xs font-semibold tracking-wider text-[#B8E07A] uppercase">{row.crop}</p>
                        <h2 className="text-3xl font-extrabold sm:text-4xl">{sw(row.crop)}</h2>
                        <p className="mt-1 text-sm text-white/70">{data.region === 'National' ? t('Wastani wa kitaifa', 'National average') : t(`Mkoa wa ${data.region}`, `${data.region} region`)}</p>
                      </div>
                      {f && <Trend pct={f.change_pct} />}
                    </div>

                    <div className="grid lg:grid-cols-[1fr_1.6fr]">
                      {/* numbers */}
                      <div className="grid content-start gap-4 border-b border-gray-100 p-6 sm:p-8 lg:border-r lg:border-b-0">
                        {/* official */}
                        <div className="rounded-2xl border border-[#E8CBA8] bg-[#FBF5EC] p-5">
                          <p className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8A5A2B] uppercase">
                            <Landmark className="size-4" /> {t('Bei rasmi (elekezi)', 'Official (indicative) price')}
                          </p>
                          {o ? (
                            <>
                              <p className="mt-2 text-3xl font-extrabold">
                                {tzs(o.price)}
                                <span className="text-sm font-medium text-gray-500">/kg</span>
                              </p>
                              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                                <span className="font-semibold">{t('Chanzo:', 'Source:')}</span> {o.source}
                                <br />
                                <span className="font-semibold">{t('Tarehe:', 'Date:')}</span> {longDate(o.date)}
                                {o.region !== data.region && <> · {t('wastani wa kitaifa', 'national average')}</>}
                              </p>
                              {o.days_old > 30 && (
                                <p className="mt-3 flex items-start gap-1.5 text-xs text-amber-800">
                                  <AlertTriangle className="mt-px size-3.5 shrink-0" /> {t('Bei hii ina siku', 'This price is')} {o.days_old}{t('. Inasubiri taarifa mpya.', ' days old. Awaiting a new bulletin.')}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-gray-600">{t('Bei bado hazijaingizwa kwa zao hili.', 'Prices have not been entered for this crop yet.')}</p>
                          )}
                        </div>

                        {f ? (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-2xl bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">{t('Makadirio ya soko leo', 'Market estimate today')}</p>
                                <p className="mt-1 text-xl font-bold">{tzs(f.current_price)}</p>
                              </div>
                              <div className="rounded-2xl bg-[#F4F9F1] p-4">
                                <p className="flex items-center gap-1 text-xs text-gray-500">
                                  <Sparkles className="size-3 text-[#8DC63F]" /> {t('AI wiki ijayo', 'AI next week')}
                                </p>
                                <p className="mt-1 text-xl font-bold text-[#1E5631]">{tomorrow ? tzs(tomorrow.price) : '—'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-2xl border border-gray-100 p-4">
                                <p className="flex items-center gap-1 text-xs text-gray-500">
                                  <CalendarCheck className="size-3.5" /> {t('Wiki bora kuuza', 'Best week to sell')}
                                </p>
                                <p className="mt-1 font-bold">{shortDate(f.best_day_to_sell.date)}</p>
                                <p className="text-xs text-gray-500">{tzs(f.best_day_to_sell.price)}/kg</p>
                              </div>
                              <div className="rounded-2xl border border-gray-100 p-4">
                                <p className="flex items-center gap-1 text-xs text-gray-500">
                                  <CalendarCheck className="size-3.5" /> {t('Wiki bora kununua', 'Best week to buy')}
                                </p>
                                <p className="mt-1 font-bold">{shortDate(f.best_day_to_buy.date)}</p>
                                <p className="text-xs text-gray-500">{tzs(f.best_day_to_buy.price)}/kg</p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">{t('Data haitoshi kutengeneza utabiri wa zao hili.', 'Not enough data to produce a forecast for this crop.')}</p>
                        )}
                      </div>

                      {/* chart */}
                      <div className="p-6 sm:p-8">
                        {f ? (
                          <>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <p className="font-semibold">{t('Bei za hivi karibuni na utabiri wa wiki zijazo', "Recent prices and the coming weeks' forecast")}</p>
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800">{t('Utabiri ni makadirio', 'Forecast is an estimate')}</span>
                            </div>
                            <Chart f={f} gov={o?.price} />
                            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <span className="h-0.5 w-4" style={{ background: BRAND.green }} /> {t('Makadirio ya soko', 'Market estimate')}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="h-0.5 w-4 border-t-2 border-dashed border-[#8DC63F]" /> {t('Utabiri wa AI', 'AI forecast')}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-4 rounded-sm bg-[#8DC63F]/20" /> {t('Wigo unaowezekana', 'Possible range')}
                              </span>
                              {o && Math.abs(o.price - f.current_price) / f.current_price < 0.2 && (
                                <span className="flex items-center gap-1.5">
                                  <span className="h-0.5 w-4 border-t-2 border-dotted border-[#B7791F]" /> {t('Bei elekezi', 'Indicative price')}
                                </span>
                              )}
                            </div>
                            <p className="mt-4 text-[11px] text-gray-400">
                              {t('Imetengenezwa', 'Generated')} {longDate(f.as_of)} · {f.model}
                              {f.model_metrics?.mape_day14_pct != null && <> · {t('kosa la wastani siku ya 14', 'mean error on day 14')}: {f.model_metrics.mape_day14_pct}%</>}
                            </p>
                          </>
                        ) : (
                          <div className="grid h-full place-items-center rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
                            {t('Data haitoshi kutengeneza utabiri', 'Not enough data to produce a forecast')}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                </Reveal>
              )
            })}

          {/* transparency */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
                <p className="flex items-center gap-2 font-bold text-amber-900">
                  <Info className="size-5" /> {t('Kuhusu takwimu hizi', 'About this data')}
                </p>
                <ul className="mt-4 grid gap-2.5 text-sm leading-relaxed text-amber-900/90">
                  <li>• {t('Bei rasmi zinaonyeshwa pamoja na chanzo na tarehe yake. Hatuonyeshi bei rasmi isiyo na chanzo.', 'Official prices are shown with their source and date. We do not show official prices without a source.')}</li>
                  <li>• {t('“Makadirio ya soko” na “Utabiri wa AI” ni makadirio ya kompyuta, si bei rasmi.', '“Market estimate” and “AI forecast” are computed estimates, not official prices.')}</li>
                  <li>• {t('Model imefunzwa kwa data ya mfano iliyopimwa kwa taarifa ya Wizara (4–8 Mei 2026). Usahihi kwa bei halisi unaweza kutofautiana.', 'The model was trained on sample data benchmarked against the Ministry bulletin (4–8 May 2026). Accuracy against real prices may vary.')}</li>
                </ul>
                {data?.crops[0]?.forecast?.data_source && <p className="mt-4 text-xs text-amber-800/80">{t('Data ya mafunzo:', 'Training data:')} {data.crops[0].forecast.data_source}</p>}
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-full rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
                <p className="font-bold">{t('Vyanzo vinavyopendekezwa', 'Recommended sources')}</p>
                <ul className="mt-4 grid gap-3">
                  {SOURCES.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-100 p-4 transition hover:border-[#1E5631]/30 hover:bg-[#F6FAF4]"
                      >
                        <span>
                          <span className="block text-sm font-semibold">{s.name}</span>
                          <span className="block text-xs text-gray-500">{s.note}</span>
                        </span>
                        <ExternalLink className="size-4 shrink-0 text-gray-400 group-hover:text-[#1E5631]" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-gray-600">{t('Unataka utabiri wa mkoa wako na historia ya utabiri wako?', 'Want forecasts for your region and your own forecast history?')}</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{ background: BRAND.green }}
            >
              {t('Fungua akaunti', 'Open an account')} <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
