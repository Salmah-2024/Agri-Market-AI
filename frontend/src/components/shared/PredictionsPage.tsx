import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrainCircuit, CalendarClock, Coins, History, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/DashboardLayout'
import { ChartLegend, ForecastChart } from '@/components/shared/ForecastChart'
import { EmptyState, ErrorBox, Field, LoadingRows, SimpleSelect, TrendBadge } from '@/components/shared/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { longDate, num, shortDate, tzs, unitPrice } from '@/lib/format'
import type { Forecast, GovPrice, Listing, PredictionRecord } from '@/lib/types'
import { useApi } from '@/lib/useApi'

interface DailyResp {
  region: string
  forecasts: Forecast[]
}

export default function PredictionsPage() {
  const { user, meta } = useAuth()
  const isFarmer = user?.role === 'farmer'
  const [region, setRegion] = useState(user?.settings.market_region ?? 'National')
  const [selected, setSelected] = useState<string>('Maize')
  const { data, loading, error } = useApi<DailyResp>(`/predictions/daily?region=${encodeURIComponent(region)}`)
  const gov = useApi<{ prices: { crop: string; official: GovPrice | null }[] }>(
    `/gov-prices?region=${encodeURIComponent(region)}`,
  )
  const [open, setOpen] = useState(false)

  const current = data?.forecasts.find((f) => f.crop === selected) ?? data?.forecasts[0]
  const govFor = (crop: string) => gov.data?.prices.find((p) => p.crop === crop)?.official ?? null

  return (
    <>
      <PageHeader
        title={isFarmer ? 'Sales predictions' : 'AI price predictions'}
        description={
          isFarmer
            ? 'Weekly AI price forecast for the weeks ahead, and what your crops could earn.'
            : 'Weekly AI price forecast so you know when to buy.'
        }
        action={
          <div className="flex gap-2">
            <SimpleSelect value={region} onChange={setRegion} options={meta.market_regions} className="w-44" />
            <Button onClick={() => setOpen(true)}>
              <Sparkles /> New prediction
            </Button>
          </div>
        }
      />
      {error && <ErrorBox message={error} />}
      {isFarmer && <SalesPrediction />}

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="size-5 text-primary" /> {current?.crop ?? '…'} — next 4 weeks
            </CardTitle>
            <CardDescription>
              {current ? (
                <>
                  {current.region} market · updated daily · as of {longDate(current.as_of)}
                </>
              ) : (
                'Loading…'
              )}
            </CardDescription>
            {current && (
              <CardAction>
                <TrendBadge trend={current.trend} pct={current.change_pct} />
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {loading || !current ? (
              <LoadingRows rows={4} />
            ) : (
              <>
                <ForecastChart forecast={current} govPrice={govFor(current.crop)?.price} />
                <ChartLegend gov={!!govFor(current.crop)} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniStat label="Price today" value={unitPrice(current.current_price, user?.settings)} />
                  {isFarmer ? (
                    <MiniStat
                      label="Best week to sell"
                      value={unitPrice(current.best_day_to_sell.price, user?.settings)}
                      sub={longDate(current.best_day_to_sell.date)}
                    />
                  ) : (
                    <MiniStat
                      label="Best week to buy"
                      value={unitPrice(current.best_day_to_buy.price, user?.settings)}
                      sub={longDate(current.best_day_to_buy.date)}
                    />
                  )}
                  <MiniStat
                    label="Gov. indicative price"
                    value={govFor(current.crop) ? unitPrice(govFor(current.crop)!.price, user?.settings) : '—'}
                    sub={govFor(current.crop) ? `as of ${shortDate(govFor(current.crop)!.date)}` : undefined}
                  />
                </div>
                <ModelNote f={current} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Today’s forecast, all crops</CardTitle>
            <CardDescription>Click a crop to see its chart</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingRows rows={6} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead className="text-right">Now</TableHead>
                    <TableHead className="text-right">Next week</TableHead>
                    <TableHead className="text-right">In 4 weeks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.forecasts.map((f) => (
                    <TableRow
                      key={f.crop}
                      className="cursor-pointer"
                      data-state={f.crop === current?.crop ? 'selected' : undefined}
                      onClick={() => setSelected(f.crop)}
                    >
                      <TableCell>
                        <p className="font-medium">{f.crop}</p>
                        <TrendBadge trend={f.trend} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{num(f.current_price)}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(f.forecast[0]?.price)}</TableCell>
                      <TableCell className="text-right tabular-nums">{num(f.forecast[f.forecast.length - 1]?.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Prices in TZS per kg.</p>
          </CardContent>
        </Card>
      </div>

      <NewPredictionDialog open={open} onOpenChange={setOpen} defaultCrop={current?.crop} defaultRegion={region} />
    </>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function ModelNote({ f }: { f: Forecast }) {
  return (
    <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">{f.model}.</span>{' '}
      {f.model_metrics?.mape != null && <>Back-test error: ~{f.model_metrics.mape.toFixed(1)}% (MAPE) on real weekly data. </>}
      {f.data_source && <>Training data: {f.data_source}. </>}
      Predictions are estimates, not guarantees.
    </p>
  )
}

/** Farmer only: expected value of each active listing today vs the best day ahead. */
function SalesPrediction() {
  const { user } = useAuth()
  const { data } = useApi<{ listings: Listing[] }>('/listings/mine')
  const active = useMemo(
    () => (data?.listings ?? []).filter((l) => l.status === 'available' || l.status === 'partially_sold'),
    [data],
  )
  const [fc, setFc] = useState<Record<string, Forecast>>({})

  useEffect(() => {
    const keys = [...new Set(active.map((l) => `${l.crop}|${l.region}`))]
    keys.forEach((k) => {
      const [crop, region] = k.split('|')
      api<DailyResp>(`/predictions/daily?crop=${encodeURIComponent(crop)}&region=${encodeURIComponent(region)}`)
        .then((r) => setFc((prev) => ({ ...prev, [k]: r.forecasts[0] })))
        .catch(() => {})
    })
  }, [active])

  if (!data) return null
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="size-5 text-amber-500" /> Your sales prediction
        </CardTitle>
        <CardDescription>Estimated value of the crops you have in stock, based on today’s AI forecast for each crop’s region.</CardDescription>
      </CardHeader>
      <CardContent>
        {!active.length ? (
          <EmptyState
            icon={Coins}
            title="No crops in stock"
            text="Register the crops you have available to see how much they could earn."
            action={
              <Button asChild size="sm">
                <Link to="/farmer/crops">Register crops</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead className="text-right">In stock</TableHead>
                <TableHead className="text-right">Your price</TableHead>
                <TableHead className="text-right">Market value today</TableHead>
                <TableHead>Best week to sell (next 4 weeks)</TableHead>
                <TableHead className="text-right">Value on best week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map((l) => {
                const f = fc[`${l.crop}|${l.region}`]
                const gain = f ? (f.best_day_to_sell.price - f.current_price) * l.quantity_available_kg : 0
                return (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className="font-medium">{l.crop}</p>
                      <p className="text-xs text-muted-foreground">{l.region}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{num(l.quantity_available_kg)} kg</TableCell>
                    <TableCell className="text-right tabular-nums">{unitPrice(l.price_per_kg, user?.settings)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {f ? tzs(f.current_price * l.quantity_available_kg) : <Loader2 className="ml-auto size-4 animate-spin" />}
                    </TableCell>
                    <TableCell>
                      {f && (
                        <span className="flex items-center gap-2">
                          <CalendarClock className="size-4 text-muted-foreground" />
                          {longDate(f.best_day_to_sell.date)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {f && (
                        <>
                          {tzs(f.best_day_to_sell.price * l.quantity_available_kg)}
                          {gain > 0 && <p className="text-xs text-emerald-600">+{tzs(gain)}</p>}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function NewPredictionDialog({
  open,
  onOpenChange,
  defaultCrop,
  defaultRegion,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultCrop?: string
  defaultRegion: string
}) {
  const { user, meta } = useAuth()
  const [crop, setCrop] = useState(defaultCrop ?? 'Maize')
  const [region, setRegion] = useState(defaultRegion)
  const [days, setDays] = useState('7')
  const [qty, setQty] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PredictionRecord | null>(null)

  useEffect(() => {
    if (open) {
      setCrop(defaultCrop ?? 'Maize')
      setRegion(defaultRegion)
      setResult(null)
    }
  }, [open, defaultCrop, defaultRegion])

  const run = async () => {
    setBusy(true)
    try {
      const r = await api<{ prediction: PredictionRecord }>('/predictions', {
        method: 'POST',
        body: { crop, region, days: Number(days), quantity_kg: qty ? Number(qty) : undefined },
      })
      setResult(r.prediction)
      toast.success('Prediction saved to your history')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const f = result?.result
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New price prediction</DialogTitle>
          <DialogDescription>Run the AI model now. The result is saved in your prediction history.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Crop">
            <SimpleSelect value={crop} onChange={setCrop} options={meta.crops} />
          </Field>
          <Field label="Market / region">
            <SimpleSelect value={region} onChange={setRegion} options={meta.market_regions} />
          </Field>
          <Field label="Days ahead">
            <SimpleSelect value={days} onChange={setDays} options={['3', '7', '14'].map((d) => ({ value: d, label: `${d} days` }))} />
          </Field>
          <Field label={user?.role === 'farmer' ? 'Quantity to sell (kg)' : 'Quantity to buy (kg)'} hint="Optional — to estimate value">
            <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. 1000" />
          </Field>
        </div>
        {f && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {f.crop} · {f.region}
              </p>
              <TrendBadge trend={f.trend} pct={f.change_pct} />
            </div>
            <div className="flex flex-wrap gap-2">
              {f.forecast.map((p) => (
                <Badge key={p.date} variant="outline" className="tabular-nums">
                  {shortDate(p.date)}: {num(p.price)}
                </Badge>
              ))}
            </div>
            {f.quantity_kg && (
              <p className="text-sm">
                {num(f.quantity_kg)} kg is worth about <b>{tzs(f.expected_revenue_today)}</b> today and{' '}
                <b>{tzs(f.expected_revenue_best_day)}</b> on {longDate(f.best_day_to_sell.date)}.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          {f && (
            <Button variant="outline" asChild>
              <Link to={`/${user?.role}/history`}>
                <History /> View history
              </Link>
            </Button>
          )}
          <Button onClick={run} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Predict
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
