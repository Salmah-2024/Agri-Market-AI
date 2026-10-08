import { Bell, Brain, Coins, Handshake, History, Landmark, MapPin, Moon, Scale, TrendingUp } from 'lucide-react'

import { CtaBand, PageHero, PrimaryLink, Reveal, SectionTitle, SmartImg, SplitSection } from '@/components/site/SiteLayout'
import { BRAND } from '@/components/brand/Brand'
import { LOCAL, PHOTOS } from '@/lib/siteImages'
import { useT } from '@/lib/i18n'

export default function OfferPage() {
  const t = useT()

  const JUMP = [
    { icon: Brain, label: t('Utabiri wa bei kwa AI', 'AI price prediction'), href: '#prediction' },
    { icon: Handshake, label: t('Soko la moja kwa moja', 'Direct marketplace'), href: '#marketplace' },
    { icon: Landmark, label: t('Bei za serikali', 'Government prices'), href: '#gov-prices' },
    { icon: History, label: t('Historia ya utabiri', 'Prediction history'), href: '#history' },
  ]

  const EXTRAS = [
    { icon: MapPin, title: t('Mkoa chaguo-msingi wa soko', 'Default market region'), text: t('Utabiri na bei hufunguka kwenye mkoa wako kila wakati.', 'Forecasts and prices open on your own region every time.') },
    { icon: Scale, title: t('Kwa kilo au kwa gunia la kilo 100', 'Per kg or per 100 kg bag'), text: t('Onyesha kila bei jinsi unavyofanya biashara — kwa kilo au kwa gunia.', 'Show every price the way you trade — by kilo or by bag.') },
    { icon: Bell, title: t('Taarifa za SMS na barua pepe', 'SMS & email alerts'), text: t('Chagua jinsi unavyotaka kupata taarifa kuhusu maagizo na mabadiliko ya bei.', 'Choose how you want to hear about orders and price changes.') },
    { icon: Moon, title: t('Hali ya giza', 'Dark mode'), text: t('Rahisi kwa macho unapoangalia bei usiku wa manane.', 'Easy on the eyes when you check prices late at night.') },
  ]

  return (
    <>
      <PageHero
        image={PHOTOS.manPhoneField}
        crumbs={t('Tunachotoa', 'What we offer')}
        eyebrow={t('Tunachotoa', 'What we offer')}
        title={
          <>
            {t('Jukwaa moja.', 'One platform.')} <span className="text-[#B8E07A]">{t('Zana nne zenye nguvu.', 'Four powerful tools.')}</span>
          </>
        }
        text={t('Agri-Market AI huweka utabiri wa bei kwa AI, soko la moja kwa moja na bei elekezi za serikali pamoja — ili kila uamuzi utegemee namba halisi.', 'Agri-Market AI puts AI price forecasts, a direct marketplace and the government’s indicative prices side by side — so every decision is based on real numbers.')}
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
        eyebrow={t('Utabiri wa bei kwa AI', 'AI price prediction')}
        title={t('Jua bei ya wiki ijayo — na wiki zinazofuata', 'Know next week’s price — and the weeks ahead')}
        text={t('Kila usiku mfumo huendesha modeli ya Random Forest na kutoa utabiri mpya wa wiki kadhaa kwa kila zao na mkoa. Unaona bei zinapotarajiwa kufikia kilele, kabla hujaamua.', 'Every night the system runs the Random Forest model and produces a fresh multi-week forecast for each crop and region. You see when prices are likely to peak, before you decide.')}
        points={[
          t('Utabiri wa wiki kadhaa kwa kila zao na mkoa, unaosasishwa kila siku', 'Multi-week forecast for every crop and region, refreshed daily'),
          t('Wiki bora ya kuuza (wakulima) au wiki bora ya kununua (wanunuzi)', 'Best week to sell (farmers) or best week to buy (buyers)'),
          t('Thamani ya hifadhi yako leo ikilinganishwa na wiki bora ya kuuza', 'Value of your stock today vs. on the best week to sell'),
          t('Endesha utabiri mpya na uhifadhi kwenye historia yako', 'Run new predictions and save them to your history'),
        ]}
        badge={
          <div className="w-52">
            <p className="text-xs text-gray-500">{t('Wiki bora ya kuuza', 'Best week to sell')}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-lg font-extrabold">
              <TrendingUp className="size-4" style={{ color: BRAND.green }} /> {t('Baada ya wiki 2', 'In 2 weeks')}
            </p>
            <p className="text-[10px] text-gray-400">{t('Mfano wa utabiri', 'Sample forecast')}</p>
          </div>
        }
      />

      {/* 2. marketplace */}
      <SplitSection
        id="marketplace"
        tinted
        reverse
        image={PHOTOS.busyMarket}
        eyebrow={t('Soko la moja kwa moja', 'Direct marketplace')}
        title={t('Wakulima huorodhesha. Wanunuzi huagiza. Hakuna wa katikati.', 'Farmers list. Buyers order. Nobody in between.')}
        text={t('Wakulima huchapisha walichonacho hifadhini; wanunuzi huvinjari, huongeza kwenye kikapu na kuagiza moja kwa moja. Pande zote mbili hufuatilia kila oda kutoka kuwekwa hadi kufikishwa.', 'Farmers publish what they have in stock; buyers browse, add to cart and order directly. Both sides follow every order from placed to delivered.')}
        points={[
          t('Orodhesha zao, aina, kilo, bei, mkoa, ubora, tarehe ya mavuno na oda ya chini zaidi', 'List crop, variety, kg, price, region, quality, harvest date and minimum order'),
          t('Hali ya tangazo wakati halisi: Inapatikana, Imenunuliwa kwa sehemu, Imenunuliwa au Imeondolewa', 'Live listing status: Available, Partly bought, Bought or Withdrawn'),
          t('Kikapu chenye malipo ya pesa taslimu, pesa za simu au benki na ujumbe wa ufikishaji', 'Cart with cash, mobile money or bank payment and a delivery note'),
          t('Wakulima huthibitisha, hufikisha au hughairi oda kutoka dashibodi yao', 'Farmers confirm, deliver or cancel orders from their dashboard'),
        ]}
      />

      {/* 3. government prices */}
      <SplitSection
        id="gov-prices"
        image={PHOTOS.sacks}
        eyebrow={t('Bei za serikali', 'Government prices')}
        title={t('Kila bei inakaguliwa dhidi ya bei elekezi', 'Every price checked against bei elekezi')}
        text={t('Bei elekezi rasmi ya kila zao hukaa karibu kabisa na bei ya mkulima, makadirio ya soko la leo na bei ya AI ya wiki ijayo — ili pande zote mbili zione kipi ni cha haki.', 'The official indicative price for each crop sits right next to the farmer’s price, today’s market estimate and next week’s AI price — so both sides can see what is fair.')}
        points={[
          t('Bei elekezi rasmi kwa kila zao', 'Official indicative price per crop'),
          t('Tofauti ya asilimia inayoonyeshwa kwenye kila tangazo', 'Percentage difference shown on every listing'),
          t('Makadirio ya soko la leo na bei ya AI ya wiki ijayo pamoja', 'Today’s market estimate and next week’s AI price side by side'),
        ]}
        badge={
          <div className="w-52">
            <p className="text-xs text-gray-500">{t('Bei ya mkulima dhidi ya serikali', 'Farmer’s price vs. government')}</p>
            <p className="mt-0.5 text-lg font-extrabold text-[#1E5631]">{t('−4% chini', '−4% below')}</p>
            <p className="text-[10px] text-gray-400">{t('Mfano wa tangazo', 'Sample listing')}</p>
          </div>
        }
      />

      {/* 4. history */}
      <SplitSection
        id="history"
        tinted
        reverse
        image={PHOTOS.chartLaptop}
        eyebrow={t('Historia ya utabiri', 'Prediction history')}
        title={t('Ona jinsi AI ilivyokuwa sahihi', 'See how right the AI was')}
        text={t('Kila utabiri unaouendesha huhifadhiwa. Bei halisi zinapofika, Agri-Market AI huonyesha jinsi kila utabiri ulivyokaribia — ili ujifunze kiwango cha kuuamini.', 'Every prediction you run is saved. When the real prices arrive, Agri-Market AI shows how close each forecast came — so you learn how far to trust it.')}
        points={[t('Kumbukumbu kamili ya kila utabiri uliouendesha', 'A full log of every prediction you ran'), t('Usahihi wa kila mmoja mara bei halisi zinapofika', 'Accuracy for each one once real prices come in'), t('Inapatikana kwa wakulima na wanunuzi', 'Available to both farmers and buyers')]}
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
          <SectionTitle center eyebrow={t('Na zaidi', 'And more')} title={t('Mipangilio inayolingana na jinsi unavyofanya biashara', 'Settings that fit the way you trade')} />
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
              <Coins className="size-4" /> {t('Ona jinsi inavyofanya kazi', 'See how it works')}
            </PrimaryLink>
          </div>
        </div>
      </section>

      <CtaBand image={PHOTOS.womanCornField} />
    </>
  )
}
