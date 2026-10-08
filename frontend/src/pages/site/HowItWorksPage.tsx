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
  type LucideIcon,
} from 'lucide-react'

import { BRAND } from '@/components/brand/Brand'
import { CtaBand, PageHero, Reveal, SectionTitle, SmartImg } from '@/components/site/SiteLayout'
import { LOCAL, PHOTOS } from '@/lib/siteImages'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'

type Step = { icon: LucideIcon; title: string; text: string; image: string }

function Steps({ steps }: { steps: Step[] }) {
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
  const t = useT()
  const [tab, setTab] = useState<'farmers' | 'buyers'>('farmers')
  const [open, setOpen] = useState<number | null>(0)
  const { hash } = useLocation()

  const FARMER_STEPS: Step[] = [
    { icon: UserPlus, title: t('Jisajili kama Mkulima', 'Register as a Mkulima'), text: t('Chagua “Mkulima”, ongeza mkoa wako, wilaya na mazao unayolima.', 'Pick “Farmer”, add your region, district and the crops you grow.'), image: PHOTOS.womanPlanting },
    { icon: BrainCircuit, title: t('Angalia utabiri', 'Check the forecast'), text: t('Ona bei ya leo na utabiri wa AI wa wiki kadhaa kwa mazao yako, karibu na bei ya serikali.', 'See today’s price and the multi-week AI forecast for your crops, next to the government price.'), image: PHOTOS.manPhoneField },
    { icon: Sprout, title: t('Orodhesha mazao yako', 'List your crops'), text: t('Ongeza zao, aina, kilo zilizopo, bei yako, ubora, tarehe ya mavuno na oda ya chini zaidi.', 'Add crop, variety, kg available, your price, quality, harvest date and minimum order.'), image: LOCAL.farm },
    { icon: BellRing, title: t('Pokea oda', 'Receive orders'), text: t('Wanunuzi huagiza kutoka tangazo lako. Thibitisha oda kutoka dashibodi yako.', 'Buyers order from your listing. Confirm the order from your dashboard.'), image: PHOTOS.vendorPhone },
    { icon: Truck, title: t('Fikisha oda', 'Deliver the order'), text: t('Weka alama oda imefikishwa. Hifadhi yako na jumla ya mauzo husasishwa kiotomatiki.', 'Mark the order delivered. Your stock and sales totals update automatically.'), image: PHOTOS.sacksPile },
  ]

  const BUYER_STEPS: Step[] = [
    { icon: UserPlus, title: t('Jisajili kama Mnunuzi', 'Register as a Mnunuzi'), text: t('Chagua “Mnunuzi”, ongeza mkoa wako na mazao unayonunua mara kwa mara.', 'Pick “Buyer”, add your region and the crops you usually buy.'), image: PHOTOS.fruitStand },
    { icon: Search, title: t('Vinjari mazao yanayopatikana', 'Browse available crops'), text: t('Chuja matangazo kwa zao na mkoa. Kila moja huonyesha tofauti ya bei ya serikali na mtazamo wa AI wa kila wiki.', 'Filter listings by crop and region. Each one shows the government price difference and a weekly AI outlook.'), image: PHOTOS.marketProduce },
    { icon: ShoppingCart, title: t('Ongeza kwenye kikapu na uagize', 'Add to cart & order'), text: t('Chagua kiasi, chagua pesa taslimu, pesa za simu au benki, na ongeza ujumbe wa ufikishaji.', 'Choose quantities, pick cash, mobile money or bank, and add a delivery note.'), image: LOCAL.deal },
    { icon: ClipboardList, title: t('Fuatilia oda zako', 'Track your orders'), text: t('Fuatilia kila oda kutoka inayosubiri hadi iliyothibitishwa hadi iliyofikishwa.', 'Follow each order from pending to confirmed to delivered.'), image: PHOTOS.tabletData },
    { icon: BrainCircuit, title: t('Panga wakati wa ununuzi wako ujao', 'Time your next purchase'), text: t('Tumia utabiri wa AI kubaini wiki bora ya kununua.', 'Use AI predictions to spot the best week to buy.'), image: PHOTOS.riceGolden },
  ]

  const ORDER_FLOW = [
    { icon: CircleDashed, label: t('Inasubiri', 'Pending'), text: t('Mnunuzi anaweka oda', 'Buyer places the order') },
    { icon: CheckCircle2, label: t('Imethibitishwa', 'Confirmed'), text: t('Mkulima anaikubali', 'Farmer accepts it') },
    { icon: PackageCheck, label: t('Imefikishwa', 'Delivered'), text: t('Mazao yamekabidhiwa', 'Crops handed over') },
  ]

  const FAQ = [
    { q: t('Ni mazao gani yanayoshughulikiwa?', 'Which crops are covered?'), a: t('Mazao yote 7 ya taarifa ya wiki ya soko ya Wizara ya Kilimo: mahindi, mchele, maharage, mtama, uwele, ulezi na viazi mviringo.', 'All 7 crops from the Ministry of Agriculture weekly market bulletin: maize, rice, beans, sorghum, bulrush millet, finger millet and round potato.') },
    { q: t('Ni mikoa gani?', 'Which regions?'), a: t('Mikoa 18 ya soko ya Tanzania Bara pamoja na wastani wa kitaifa. Ikiwa mkoa hauna data ya bei, utabiri wa kitaifa hutumika.', '18 market regions of mainland Tanzania plus a national average. If a region has no price data, the national forecast is used.') },
    { q: t('Utabiri husasishwa mara ngapi?', 'How often are forecasts updated?'), a: t('Mara moja kwa siku, muda mfupi baada ya usiku wa manane, mfumo hutengeneza utabiri mpya wa wiki kadhaa kwa kila zao na mkoa.', 'Once a day, shortly after midnight, the system makes a fresh multi-week forecast for every crop and region.') },
    { q: t('AI ina usahihi kiasi gani?', 'How accurate is the AI?'), a: t('Kwenye data halisi ya soko la wiki, wastani wa hitilafu ya wiki ijayo ni takriban 5% kwa mazao yote. Modeli inalingana na kigezo rahisi cha “bei inabaki vilevile” kwa wastani na kuizidi kwenye mabadiliko makubwa ya bei. Ona ukurasa wa Teknolojia.', 'On real weekly market data, the average next-week error is about 5% across crops. The model matches the naive “price stays the same” baseline on average and beats it on the larger price swings. See the Technology page.') },
    { q: t('Bei za serikali (bei elekezi) ni nini?', 'What are government prices (bei elekezi)?'), a: t('Bei elekezi rasmi ya kila zao. Kila tangazo huonyesha jinsi bei ya mkulima ilivyo juu au chini yake.', 'The official indicative price for each crop. Every listing shows how far the farmer’s price is above or below it.') },
    { q: t('Je, oda inaweza kughairiwa?', 'Can an order be cancelled?'), a: t('Ndiyo. Ikiwa oda itaghairiwa, kiasi hurudi kwenye tangazo la mkulima ili wanunuzi wengine waweze kuiagiza.', 'Yes. If an order is cancelled, the quantity goes back to the farmer’s listing so other buyers can order it.') },
    { q: t('Je, naweza kuijaribu kabla ya kujisajili?', 'Can I try it before registering?'), a: t('Ndiyo — akaunti za majaribio za mkulima na mnunuzi zinapatikana. Muulize msimamizi kwa taarifa za kuingia.', 'Yes — demo farmer and buyer accounts are available. Ask the administrator for the login details.') },
  ]

  // links like /how-it-works#buyers open the buyer tab
  useEffect(() => {
    if (hash === '#buyers' || hash === '#farmers') setTab(hash === '#buyers' ? 'buyers' : 'farmers')
  }, [hash])

  return (
    <>
      <PageHero
        image={PHOTOS.walkingField}
        crumbs={t('Jinsi inavyofanya kazi', 'How it works')}
        eyebrow={t('Jinsi inavyofanya kazi', 'How it works')}
        title={
          <>
            {t('Kutoka shambani hadi', 'From field to')} <span className="text-[#B8E07A]">{t('bei ya haki', 'fair price')}</span>{t(', hatua kwa hatua', ', step by step')}
          </>
        }
        text={t('Kuanza huchukua chini ya dakika mbili. Hapa ndipo hasa kinachotokea baada ya kujisajili — kwa wakulima na kwa wanunuzi.', 'Getting started takes less than two minutes. Here is exactly what happens after you sign up — for farmers and for buyers.')}
      />

      {/* steps with tabs */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-col items-center text-center">
            <SectionTitle center eyebrow={t('Safari yako', 'Your journey')} title={t('Chagua upande wako', 'Pick your side')} />
            <div id="farmers" className="mt-8 inline-flex rounded-2xl bg-gray-100 p-1.5" role="tablist">
              {(
                [
                  { k: 'farmers', label: t('Kwa wakulima', 'For farmers'), icon: Tractor },
                  { k: 'buyers', label: t('Kwa wanunuzi', 'For buyers'), icon: ShoppingBasket },
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
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t('Maisha ya oda', 'The life of an order')}</h2>
            <p className="mt-4 text-lg text-white/75">{t('Mkulima na mnunuzi wote huona hali ile ile katika kila hatua.', 'Both farmer and buyer see the same status at every step.')}</p>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            {ORDER_FLOW.map(({ icon: Icon, label, text }, i) => (
              <Reveal key={label} delay={i * 120}>
                <div className="h-full rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur">
                  <Icon className="size-8 text-[#8DC63F]" />
                  <p className="mt-4 text-xs font-semibold tracking-wider text-white/50 uppercase">{t('Hatua', 'Step')} {i + 1}</p>
                  <h3 className="text-xl font-bold">{label}</h3>
                  <p className="mt-1 text-sm text-white/70">{text}</p>
                </div>
              </Reveal>
            ))}
            <Reveal delay={360}>
              <div className="h-full rounded-3xl border-2 border-dashed border-white/20 p-6">
                <XCircle className="size-8 text-[#E8CBA8]" />
                <p className="mt-4 text-xs font-semibold tracking-wider text-white/50 uppercase">{t('Wakati wowote kabla ya ufikishaji', 'Any time before delivery')}</p>
                <h3 className="text-xl font-bold">{t('Imeghairiwa', 'Cancelled')}</h3>
                <p className="mt-1 text-sm text-white/70">{t('Kiasi hurudi kwenye tangazo.', 'The quantity returns to the listing.')}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 md:px-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionTitle eyebrow={t('Maswali', 'FAQ')} title={t('Maswali, yamejibiwa', 'Questions, answered')} text={t('Hukupata unachohitaji? Jaribu akaunti za majaribio na uchunguze.', 'Can’t find what you need? Try the demo accounts and explore.')} />
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
