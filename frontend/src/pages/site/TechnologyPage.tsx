import { CalendarClock, Database, LayoutDashboard, LineChart, Network, Server, Sigma, TreePine } from 'lucide-react'

import { BRAND } from '@/components/brand/Brand'
import { CountUp, CtaBand, PageHero, Reveal, SectionTitle, SmartImg } from '@/components/site/SiteLayout'
import { ACTIVE_CROPS, sw } from '@/lib/crops'
import { PHOTOS } from '@/lib/siteImages'
import { useT } from '@/lib/i18n'

// From ml/models/metrics.json — mean absolute % error on the held-out test period.
// Real next-week forecast error (MAPE %) on the held-out test period, model vs.
// the naive "next week = this week" baseline.
const ALL_METRICS = [
  { crop: 'Maize', mape: 5.62, naive: 5.4 },
  { crop: 'Rice', mape: 4.67, naive: 4.61 },
  { crop: 'Beans', mape: 5.27, naive: 5.27 },
  { crop: 'Sorghum', mape: 4.5, naive: 4.36 },
  { crop: 'Bulrush Millet', mape: 4.06, naive: 3.78 },
  { crop: 'Finger Millet', mape: 4.86, naive: 4.74 },
  { crop: 'Round Potato', mape: 7.34, naive: 7.08 },
]

const METRICS = ALL_METRICS.filter((m) => (ACTIVE_CROPS as readonly string[]).includes(m.crop))

const avg = (k: 'mape' | 'naive') => METRICS.reduce((s, m) => s + m[k], 0) / METRICS.length

export default function TechnologyPage() {
  const t = useT()
  const maxNaive = Math.max(...METRICS.map((m) => m.naive))

  const PIPELINE = [
    { icon: Database, title: t('Bei za kila wiki', 'Weekly prices'), text: t('Bei halisi za soko za kila wiki kwa kila zao na mkoa (2024–2026), pamoja na wastani wa kitaifa.', 'Real weekly market prices per crop and region (2024–2026), plus a national average.') },
    { icon: Sigma, title: t('Vigezo', 'Features'), text: t('Mwenendo wa bei dhidi ya wiki 1–4 zilizopita, wastani wa wiki 4, kubadilikabadilika, na msimu (mwezi na wiki ya mwaka).', 'Price momentum vs the last 1–4 weeks, a 4-week average, volatility, and season (month & week of year).') },
    { icon: TreePine, title: t('Random Forest', 'Random Forest'), text: t('Modeli moja ya scikit-learn hutabiri mabadiliko ya bei ya wiki ijayo kwa kila zao na mkoa.', 'One scikit-learn model predicts next week’s price change for every crop and region.') },
    { icon: CalendarClock, title: t('Uendeshaji wa usiku', 'Nightly run'), text: t('Kipangaji husasisha kila utabiri mara moja kwa siku, muda mfupi baada ya usiku wa manane.', 'A scheduler refreshes every forecast once a day, just after midnight.') },
    { icon: LayoutDashboard, title: t('Dashibodi yako', 'Your dashboard'), text: t('Wiki bora ya kuuza au kununua, thamani ya hifadhi na historia ya usahihi.', 'Best week to sell or buy, stock value and accuracy history.') },
  ]

  const STACK = [
    { icon: LayoutDashboard, name: 'React + TypeScript', role: t('Programu ya wavuti, pamoja na Tailwind CSS na shadcn/ui', 'Web app, with Tailwind CSS and shadcn/ui') },
    { icon: Server, name: 'Flask', role: t('REST API kwa akaunti, matangazo, oda na utabiri', 'REST API for accounts, listings, orders and forecasts') },
    { icon: Database, name: 'MongoDB', role: t('Huhifadhi watumiaji, matangazo, oda na bei', 'Stores users, listings, orders and prices') },
    { icon: TreePine, name: 'scikit-learn', role: t('Modeli za bei za Random Forest', 'Random Forest price models') },
    { icon: CalendarClock, name: 'APScheduler', role: t('Huendesha kazi ya utabiri ya kila siku', 'Runs the daily forecast job') },
    { icon: LineChart, name: 'Recharts', role: t('Chati za utabiri na bei', 'Forecast and price charts') },
  ]

  return (
    <>
      <PageHero
        image={PHOTOS.analyticsLaptop}
        crumbs={t('Teknolojia', 'Technology')}
        eyebrow={t('Teknolojia', 'Technology')}
        title={
          <>
            {t('AI iliyopo nyuma ya', 'The AI behind')} <span className="text-[#B8E07A]">{t('kila bei', 'every price')}</span>
          </>
        }
        text={t('Mnyororo wa ujifunzaji wa mashine hubadilisha bei halisi za soko za kila wiki kuwa utabiri wa wiki kadhaa kwa kila zao na mkoa — na tunachapisha usahihi wake hasa.', 'A machine-learning pipeline turns real weekly market prices into a multi-week forecast for every crop and region — and we publish exactly how accurate it is.')}
      />

      {/* headline numbers */}
      <section className="border-b border-gray-100 py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 md:px-8 lg:grid-cols-4">
          {[
            { v: METRICS.length, s: '', d: 0, l: t('Mazao yanayotabiriwa', 'Crops forecast') },
            { v: 4, s: t(' wiki', ' weeks'), d: 0, l: t('Upeo wa utabiri', 'Forecast horizon') },
            { v: avg('mape'), s: '%', d: 1, l: t('Wastani wa hitilafu, wiki ijayo', 'Avg. error, next week') },
            { v: avg('naive'), s: '%', d: 1, l: t('Kigezo rahisi', 'Naive baseline') },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-4xl font-extrabold tracking-tight sm:text-5xl" style={{ color: BRAND.green }}>
                <CountUp to={s.v} suffix={s.s} decimals={s.d} />
              </p>
              <p className="mt-1 text-sm text-gray-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* pipeline */}
      <section id="pipeline" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle center eyebrow={t('Jinsi AI inavyofanya kazi', 'How the AI works')} title={t('Kutoka bei za soko hadi wiki yako bora ya kuuza', 'From market prices to your best week to sell')} />
          <div className="relative mt-16 grid gap-6 md:grid-cols-5">
            <div className="absolute top-8 right-[10%] left-[10%] hidden h-0.5 bg-gradient-to-r from-[#8DC63F]/0 via-[#8DC63F] to-[#8DC63F]/0 md:block" />
            {PIPELINE.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 110} className="relative text-center">
                <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-white text-[#1E5631] shadow-xl ring-1 ring-black/5">
                  <Icon className="size-7" />
                </span>
                <h3 className="mt-5 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{text}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <SmartImg src={PHOTOS.tabletData} alt="" className="aspect-[4/3] w-full rounded-3xl shadow-2xl" />
            </Reveal>
            <Reveal delay={120}>
              <h3 className="text-2xl font-bold sm:text-3xl">{t('Kwa nini Random Forest?', 'Why a Random Forest?')}</h3>
              <ul className="mt-5 grid gap-4 text-gray-700">
                {[
                  [t('Hufanya kazi katika kiwango chochote cha bei', 'Works at any price level'), t('Modeli hujifunza mabadiliko ya bei (uwiano wa logi), si shilingi halisi, hivyo hushughulikia mahindi ya bei nafuu na mchele wa bei ghali vilevile.', 'The model learns price changes (log-ratios), not raw shillings, so it handles cheap maize and expensive rice alike.')],
                  [t('Hujifunza misimu', 'Learns the seasons'), t('Misimu ya mavuno na ya uhaba hunaswa kwa vigezo vya mwezi na wiki ya mwaka.', 'Harvest and lean seasons are captured by month and week-of-year features.')],
                  [t('Hutambua mkoa', 'Region-aware'), t('Kila mkoa ni pembejeo ya modeli, hivyo Mbeya na Dar es Salaam zinaweza kubadilika tofauti.', 'Each region is a model input, so Mbeya and Dar es Salaam can move differently.')],
                  [t('Kigezo cha uaminifu', 'Honest baseline'), t('Kila zao hupimwa dhidi ya “bei inabaki vilevile” kuthibitisha modeli inaongeza thamani.', 'Every crop is tested against “the price stays the same” to prove the model adds value.')],
                ].map(([title, d]) => (
                  <li key={title} className="flex gap-3">
                    <Network className="mt-1 size-5 shrink-0 text-[#8DC63F]" />
                    <span>
                      <span className="font-semibold">{title}.</span> {d}
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* accuracy */}
      <section id="accuracy" className="bg-[#FAFAF7] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle
            eyebrow={t('Usahihi wa modeli', 'Model accuracy')}
            title={t('Umepimwa, kwa kila zao', 'Measured, per crop')}
            text={t('Wastani wa hitilafu ya asilimia kamili ya wiki ijayo katika kipindi cha majaribio kilichotengwa. Chini ni bora zaidi. “Kigezo” hudhani bei ya wiki ijayo ni sawa na ya wiki hii.', 'Next-week mean absolute percentage error on the held-out test period. Lower is better. “Baseline” assumes next week’s price equals this week’s.')}
          />

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <Reveal>
              <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs tracking-wider text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-4">{t('Zao', 'Crop')}</th>
                      <th className="px-5 py-4 text-right">{t('Hitilafu ya wiki ijayo', 'Next-week error')}</th>
                      <th className="px-5 py-4 text-right">{t('Kigezo rahisi', 'Naive baseline')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {METRICS.map((m) => (
                      <tr key={m.crop} className="hover:bg-[#F6FAF4]">
                        <td className="px-5 py-3.5 font-semibold">{sw(m.crop)}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-[#1E5631] tabular-nums">{m.mape.toFixed(2)}%</td>
                        <td className="px-5 py-3.5 text-right text-gray-400 tabular-nums">{m.naive.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="h-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                <p className="font-semibold">{t('Hitilafu ya wiki ijayo: modeli dhidi ya kigezo', 'Next-week error: model vs. baseline')}</p>
                <div className="mt-2 flex gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm" style={{ background: BRAND.green }} /> {t('Modeli ya AI', 'AI model')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-gray-300" /> {t('Kigezo', 'Baseline')}
                  </span>
                </div>
                <div className="mt-5 grid gap-3.5">
                  {METRICS.map((m) => (
                    <div key={m.crop}>
                      <p className="mb-1 text-xs font-medium text-gray-600">{sw(m.crop)}</p>
                      <div className="grid gap-1">
                        <div className="h-2.5 rounded-full" style={{ width: `${(m.mape / maxNaive) * 100}%`, background: BRAND.green }} />
                        <div className="h-2.5 rounded-full bg-gray-300" style={{ width: `${(m.naive / maxNaive) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {t('Data ya mafunzo: bei halisi za soko za kila wiki kutoka taarifa za Wizara ya Kilimo (2024–2026). Katika upeo wa wiki moja modeli inakaribia kulingana na kigezo rahisi kwa wastani wa hitilafu, na kuizidi kwenye mabadiliko makubwa ya bei (RMSE / R²).', 'Training data: real weekly market prices from the Ministry of Agriculture bulletins (2024–2026). At the one-week horizon the model roughly matches the naive baseline on average error, and beats it on the larger price swings (RMSE / R²).')}
          </p>
        </div>
      </section>

      {/* stack */}
      <section id="stack" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <SectionTitle center eyebrow={t('Mkusanyiko wa teknolojia', 'Tech stack')} title={t('Imejengwa kwa zana huria zilizothibitishwa', 'Built with open, proven tools')} />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STACK.map(({ icon: Icon, name, role }, i) => (
              <Reveal key={name} delay={i * 70}>
                <div className="group flex h-full items-start gap-4 rounded-3xl border border-gray-100 bg-white p-6 transition hover:-translate-y-1 hover:border-transparent hover:shadow-xl">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#EEF5EA] transition group-hover:bg-[#1E5631]">
                    <Icon className="size-6 text-[#1E5631] transition group-hover:text-white" />
                  </span>
                  <span>
                    <span className="block font-bold">{name}</span>
                    <span className="block text-sm text-gray-600">{role}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand image={PHOTOS.riceAerial} title={t('Ona utabiri wa zao lako', 'See the forecast for your crop')} text={t('Ingia kwa akaunti ya majaribio au tengeneza yako mwenyewe kwa dakika mbili.', 'Log in with a demo account or create your own in two minutes.')} />
    </>
  )
}
