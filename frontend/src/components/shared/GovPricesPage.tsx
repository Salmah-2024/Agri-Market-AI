import { useState } from 'react'
import { Info, Landmark } from 'lucide-react'

import { PageHeader } from '@/components/layout/DashboardLayout'
import { ErrorBox, LoadingRows, SimpleSelect, TrendBadge } from '@/components/shared/common'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'
import { longDate, shortDate, unitPrice } from '@/lib/format'
import { useT } from '@/lib/i18n'
import type { GovPrice } from '@/lib/types'
import { useApi } from '@/lib/useApi'

interface Row {
  crop: string
  official: GovPrice | null
  market_today: number
  ai_tomorrow: number
  trend: 'up' | 'down' | 'stable'
}

export default function GovPricesPage() {
  const t = useT()
  const { user, meta } = useAuth()
  const [region, setRegion] = useState(user?.settings.market_region ?? 'National')
  const { data, loading, error } = useApi<{ region: string; prices: Row[] }>(`/gov-prices?region=${encodeURIComponent(region)}`)
  const sources = [...new Set((data?.prices ?? []).map((p) => p.official?.source).filter(Boolean))]
  const latest = (data?.prices ?? []).map((p) => p.official?.date).filter(Boolean).sort().pop()

  return (
    <>
      <PageHeader
        title={t('Bei elekezi za serikali', 'Government indicative prices')}
        description={t('Bei elekezi — bei rasmi za jumla kutoka Wizara ya Kilimo, sambamba na makadirio ya soko ya leo.', 'Bei elekezi — official wholesale prices from the Ministry of Agriculture, next to today’s market estimate.')}
        action={<SimpleSelect value={region} onChange={setRegion} options={meta.market_regions} className="w-44" />}
      />
      {error && <ErrorBox message={error} />}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="size-5 text-primary" /> {region} · {longDate(new Date().toISOString().slice(0, 10))}
          </CardTitle>
          <CardDescription>
            {t('Pale Wizara haina bei kwa mkoa huu, wastani wa kitaifa unaoneshwa.', 'Where the Ministry has no price for this region, the national average is shown.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingRows rows={6} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Zao', 'Crop')}</TableHead>
                  <TableHead className="text-right">{t('Bei rasmi', 'Official price')}</TableHead>
                  <TableHead>{t('Inahusu', 'Applies to')}</TableHead>
                  <TableHead>{t('Ilichapishwa', 'Published')}</TableHead>
                  <TableHead className="text-right">{t('Soko leo (makadirio)', 'Market today (est.)')}</TableHead>
                  <TableHead className="text-right">{t('AI wiki ijayo', 'AI next week')}</TableHead>
                  <TableHead>{t('Mwelekeo', 'Trend')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.prices.map((p) => (
                  <TableRow key={p.crop}>
                    <TableCell className="font-medium">{p.crop}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {p.official ? unitPrice(p.official.price, user?.settings) : '—'}
                    </TableCell>
                    <TableCell>
                      {p.official && (
                        <Badge variant={p.official.region === region ? 'success' : 'outline'}>{p.official.region}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.official && (
                        <span className={p.official.days_old > 14 ? 'text-amber-600' : ''}>
                          {shortDate(p.official.date)}
                          {p.official.days_old > 0 && (
                            <span className="text-xs text-muted-foreground"> {t(`(siku ${p.official.days_old} zilizopita)`, `(${p.official.days_old}d ago)`)}</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{unitPrice(p.market_today, user?.settings)}</TableCell>
                    <TableCell className="text-right tabular-nums">{unitPrice(p.ai_tomorrow, user?.settings)}</TableCell>
                    <TableCell>
                      <TrendBadge trend={p.trend} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 flex gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <div>
              <p>{t('Chanzo', 'Source')}: {sources.join('; ') || '—'}.</p>
              <p className="mt-1">
                {t('Bei rasmi husasishwa kila Wizara inapochapisha taarifa mpya (msimamizi anaziongeza, au zinaingizwa kiotomatiki kila siku saa 6:05 usiku EAT pale mlisho wa bei umewekwa).', 'Official prices are updated whenever the Ministry publishes a new bulletin (the admin adds them, or they are imported automatically every day at 00:05 EAT when a price feed is configured).')}
                {latest && <> {t(`Iliyochapishwa karibuni: ${longDate(latest)}.`, `Latest published: ${longDate(latest)}.`)}</>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
