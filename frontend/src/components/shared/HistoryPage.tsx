import { useState } from 'react'
import { History, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/DashboardLayout'
import { ChartLegend, ForecastChart } from '@/components/shared/ForecastChart'
import { EmptyState, ErrorBox, LoadingRows, SimpleSelect, TrendBadge } from '@/components/shared/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { dateTime, longDate, num, tzs } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { sw } from '@/lib/crops'
import type { PredictionRecord } from '@/lib/types'
import { useApi } from '@/lib/useApi'

export default function HistoryPage() {
  const t = useT()
  const { meta } = useAuth()
  const [crop, setCrop] = useState('all')
  const q = crop === 'all' ? '' : `?crop=${encodeURIComponent(crop)}`
  const { data, loading, error, reload } = useApi<{ history: PredictionRecord[] }>(`/predictions/history${q}`)
  const [view, setView] = useState<PredictionRecord | null>(null)

  const remove = async (id: string) => {
    await api(`/predictions/${id}`, { method: 'DELETE' })
    toast.success(t('Utabiri umefutwa', 'Prediction deleted'))
    reload()
  }

  return (
    <>
      <PageHeader
        title={t('Historia ya utabiri', 'Prediction history')}
        description={t('Kila utabiri uliouendesha, na jinsi ulivyokaribia bei halisi zilipofika.', 'Every prediction you ran, and how close it was once the real prices came in.')}
        action={
          <SimpleSelect
            value={crop}
            onChange={setCrop}
            options={[{ value: 'all', label: t('Mazao yote', 'All crops') }, ...meta.crops.map((c) => ({ value: c, label: sw(c) }))]}
            className="w-44"
          />
        }
      />
      {error && <ErrorBox message={error} />}
      <Card className="py-2">
        <CardContent className="px-2 sm:px-4">
          {loading ? (
            <div className="p-4">
              <LoadingRows />
            </div>
          ) : !data?.history.length ? (
            <div className="p-4">
              <EmptyState
                icon={History}
                title={t('Bado hakuna utabiri', 'No predictions yet')}
                text={t('Nenda Utabiri na ubofye “Utabiri mpya” — kila unaouendesha huhifadhiwa hapa.', 'Go to Predictions and press “New prediction” — each one you run is saved here.')}
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('Lini', 'When')}</TableHead>
                  <TableHead>{t('Zao', 'Crop')}</TableHead>
                  <TableHead>{t('Mkoa', 'Region')}</TableHead>
                  <TableHead className="text-right">{t('Bei wakati huo', 'Price then')}</TableHead>
                  <TableHead className="text-right">{t('Ilivyotabiriwa (siku ya mwisho)', 'Predicted (last day)')}</TableHead>
                  <TableHead>{t('Mwelekeo', 'Trend')}</TableHead>
                  <TableHead>{t('Usahihi', 'Accuracy')}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.map((h) => {
                  const last = h.result.forecast[h.result.forecast.length - 1]
                  return (
                    <TableRow key={h.id} className="cursor-pointer" onClick={() => setView(h)}>
                      <TableCell>{dateTime(h.created_at)}</TableCell>
                      <TableCell className="font-medium">{sw(h.crop)}</TableCell>
                      <TableCell>{h.region}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(h.result.current_price)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {num(last.price)} <span className="text-xs text-muted-foreground">({h.days}d)</span>
                      </TableCell>
                      <TableCell>
                        <TrendBadge trend={h.result.trend} pct={h.result.change_pct} />
                      </TableCell>
                      <TableCell>
                        {h.mean_error_pct == null ? (
                          <Badge variant="muted">{t('Inasubiri bei halisi', 'Waiting for real prices')}</Badge>
                        ) : (
                          <Badge variant={h.mean_error_pct < 5 ? 'success' : 'warning'}>
                            {t(`±${h.mean_error_pct}% kwa siku ${h.accuracy_checked_days}`, `±${h.mean_error_pct}% over ${h.accuracy_checked_days}d`)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('Futa', 'Delete')}
                          onClick={(e) => {
                            e.stopPropagation()
                            remove(h.id)
                          }}
                        >
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="sm:max-w-2xl">
          {view && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {sw(view.crop)} · {view.region}
                </DialogTitle>
                <DialogDescription>
                  {t('Ilitabiriwa tarehe', 'Predicted on')} {dateTime(view.created_at)} · {t('bei wakati huo', 'price then')} {tzs(view.result.current_price)}/kg
                </DialogDescription>
              </DialogHeader>
              <ForecastChart forecast={view.result} height={240} />
              <ChartLegend />
              {view.result.quantity_kg && (
                <p className="text-sm">
                  {num(view.result.quantity_kg)} kg: {tzs(view.result.expected_revenue_today)} {t('siku hiyo, bora', 'that day, best')}{' '}
                  {tzs(view.result.expected_revenue_best_day)} {t('tarehe', 'on')} {longDate(view.result.best_day_to_sell.date)}.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
