import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  ShoppingCart,
  Sprout,
  Trash2,
  Truck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/DashboardLayout'
import {
  EmptyState,
  ErrorBox,
  Field,
  ListingStatusBadge,
  LoadingRows,
  OrderStatusBadge,
  SimpleSelect,
  StatCard,
  TrendBadge,
} from '@/components/shared/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import { dateTime, num, shortDate, tzs, unitPrice } from '@/lib/format'
import type { Buyer, Forecast, GovPrice, Listing, Order } from '@/lib/types'
import { useApi } from '@/lib/useApi'

/* ======================= Overview ======================= */
export function FarmerOverview() {
  const { user } = useAuth()
  const listings = useApi<{ listings: Listing[] }>('/listings/mine')
  const orders = useApi<{ orders: Order[] }>('/orders/farmer')
  const region = user?.settings.market_region ?? 'National'
  const daily = useApi<{ forecasts: Forecast[] }>(`/predictions/daily?region=${encodeURIComponent(region)}`)
  const gov = useApi<{ prices: { crop: string; official: GovPrice | null }[] }>(`/gov-prices?region=${encodeURIComponent(region)}`)

  const L = listings.data?.listings ?? []
  const O = (orders.data?.orders ?? []).filter((o) => o.status !== 'cancelled')
  const stockKg = L.filter((l) => l.status === 'available' || l.status === 'partially_sold').reduce((s, l) => s + l.quantity_available_kg, 0)
  const soldKg = O.reduce((s, o) => s + o.quantity_kg, 0)
  const revenue = O.reduce((s, o) => s + o.total, 0)
  const pending = O.filter((o) => o.status === 'pending').length
  const myCrops = new Set([...(user?.main_crops ?? []), ...L.map((l) => l.crop)])
  const forecasts = (daily.data?.forecasts ?? []).filter((f) => myCrops.size === 0 || myCrops.has(f.crop))

  return (
    <>
      <PageHeader
        title="Farmer dashboard"
        description={`Overview of your crops, sales and today’s market in ${region}.`}
        action={
          <Button asChild>
            <Link to="/farmer/crops?new=1">
              <Plus /> Register crop
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Crops in stock" value={`${num(stockKg)} kg`} hint={`${L.filter((l) => l.status !== 'sold' && l.status !== 'withdrawn').length} active listings`} />
        <StatCard icon={CheckCircle2} label="Sold so far" value={`${num(soldKg)} kg`} tone="sky" hint={`${O.length} orders`} />
        <StatCard icon={Wallet} label="Sales value" value={tzs(revenue)} tone="amber" />
        <StatCard icon={ClipboardList} label="Orders to confirm" value={pending} tone="rose" hint={pending ? 'Buyers are waiting' : 'All handled'} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="size-5 text-primary" /> Today’s AI price forecast
            </CardTitle>
            <CardDescription>For your crops in {region} (TZS/kg)</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link to="/farmer/predictions">Details</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {daily.loading ? (
              <LoadingRows />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead className="text-right">Now</TableHead>
                    <TableHead className="text-right">Next week</TableHead>
                    <TableHead className="text-right">In 4 weeks</TableHead>
                    <TableHead className="text-right">Gov. price</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecasts.map((f) => {
                    const g = gov.data?.prices.find((p) => p.crop === f.crop)?.official
                    return (
                      <TableRow key={f.crop}>
                        <TableCell className="font-medium">{f.crop}</TableCell>
                        <TableCell className="text-right tabular-nums">{num(f.current_price)}</TableCell>
                        <TableCell className="text-right tabular-nums">{num(f.forecast[0]?.price)}</TableCell>
                        <TableCell className="text-right tabular-nums">{num(f.forecast[f.forecast.length - 1]?.price)}</TableCell>
                        <TableCell className="text-right tabular-nums">{g ? num(g.price) : '—'}</TableCell>
                        <TableCell>
                          <TrendBadge trend={f.trend} pct={f.change_pct} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" asChild>
                <Link to="/farmer/crops">All</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.loading ? (
              <LoadingRows />
            ) : !O.length ? (
              <p className="text-sm text-muted-foreground">No orders yet. Buyers will appear here when they buy your crops.</p>
            ) : (
              O.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {o.buyer_name} · {o.crop}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {num(o.quantity_kg)} kg · {tzs(o.total)}
                    </p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

/* ======================= My crops ======================= */
const GRADES = ['Grade A', 'Grade 1', 'Grade 2', 'Grade 3', 'Ungraded']

export function MyCrops() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useApi<{ listings: Listing[] }>('/listings/mine')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState<Listing | 'new' | null>(null)
  const [orderFor, setOrderFor] = useState<Listing | null>(null)

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('new')) setEditing('new')
  }, [])

  const rows = useMemo(() => {
    const L = data?.listings ?? []
    if (filter === 'all') return L
    if (filter === 'available') return L.filter((l) => l.status === 'available' || l.status === 'partially_sold')
    return L.filter((l) => l.status === filter)
  }, [data, filter])

  const setStatus = async (l: Listing, status: string) => {
    try {
      await api(`/listings/${l.id}`, { method: 'PUT', body: { status } })
      toast.success(status === 'sold' ? 'Marked as sold' : 'Listing updated')
      reload()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }
  const remove = async (l: Listing) => {
    await api(`/listings/${l.id}`, { method: 'DELETE' })
    toast.success('Listing removed')
    reload()
  }

  return (
    <>
      <PageHeader
        title="My crops"
        description="Register the crops you have available and follow whether they have been bought."
        action={
          <Button onClick={() => setEditing('new')}>
            <Plus /> Register crop
          </Button>
        }
      />
      {error && <ErrorBox message={error} />}
      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="available">Not yet bought</TabsTrigger>
          <TabsTrigger value="sold">Bought</TabsTrigger>
          <TabsTrigger value="withdrawn">Withdrawn</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <LoadingRows />
      ) : !rows.length ? (
        <EmptyState
          icon={Sprout}
          title="No crops here"
          text="Register a crop with its quantity and price so buyers can find it."
          action={
            <Button onClick={() => setEditing('new')}>
              <Plus /> Register crop
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((l) => {
            const soldPct = ((l.quantity_kg - l.quantity_available_kg) / l.quantity_kg) * 100
            const activeOrders = (l.orders ?? []).filter((o) => o.status !== 'cancelled')
            return (
              <Card key={l.id} className="gap-4">
                <CardHeader>
                  <CardTitle>
                    {l.crop}
                    {l.variety && <span className="font-normal text-muted-foreground"> · {l.variety}</span>}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {[l.district, l.region].filter(Boolean).join(', ')} · listed {shortDate(l.created_at)}
                  </CardDescription>
                  <CardAction>
                    <ListingStatusBadge status={l.status} />
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Your price</p>
                      <p className="font-semibold">{unitPrice(l.price_per_kg, user?.settings)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gov. indicative</p>
                      <p className="font-semibold">
                        {l.gov_price ? unitPrice(l.gov_price.price, user?.settings) : '—'}
                        {l.vs_gov_pct != null && (
                          <span className={`ml-1 text-xs ${l.vs_gov_pct > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            ({l.vs_gov_pct > 0 ? '+' : ''}
                            {l.vs_gov_pct}%)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>
                        {num(l.quantity_kg - l.quantity_available_kg)} of {num(l.quantity_kg)} kg bought
                      </span>
                      <span>{num(l.quantity_available_kg)} kg left</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${soldPct}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {l.quality_grade && <Badge variant="outline">{l.quality_grade}</Badge>}
                    {!!l.in_carts && (
                      <Badge variant="info">
                        <ShoppingCart /> In {l.in_carts} cart{l.in_carts > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {!!activeOrders.length && (
                      <Badge variant="warning">
                        {activeOrders.length} order{activeOrders.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {!!l.orders?.length && (
                      <Button size="sm" variant="secondary" onClick={() => setOrderFor(l)}>
                        <Truck /> Orders
                      </Button>
                    )}
                    {l.status !== 'sold' && l.status !== 'withdrawn' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditing(l)}>
                          <Pencil /> Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setStatus(l, 'sold')}>
                          <CheckCircle2 /> Mark sold
                        </Button>
                      </>
                    )}
                    {(l.status === 'sold' || l.status === 'withdrawn') && l.quantity_available_kg > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(l, 'available')}>
                        Relist
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(l)} aria-label="Remove">
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <ListingDialog
        listing={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          reload()
        }}
      />
      <OrdersDialog listing={orderFor} onClose={() => setOrderFor(null)} onChanged={reload} />
    </>
  )
}

function ListingDialog({ listing, onClose, onSaved }: { listing: Listing | 'new' | null; onClose: () => void; onSaved: () => void }) {
  const { user, meta } = useAuth()
  const [form, setForm] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [gov, setGov] = useState<GovPrice | null>(null)
  const [fc, setFc] = useState<Forecast | null>(null)
  const isNew = listing === 'new'

  useEffect(() => {
    if (!listing) return
    setErrors({})
    if (listing === 'new') setForm({ region: user?.region ?? '', district: user?.district ?? '', quality_grade: 'Grade 1' })
    else
      setForm(
        Object.fromEntries(
          Object.entries(listing)
            .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
            .map(([k, v]) => [k, String(v)]),
        ),
      )
  }, [listing, user])

  // show the government price + AI price for the chosen crop while filling the form
  useEffect(() => {
    if (!form.crop || !form.region) return
    const q = `crop=${encodeURIComponent(form.crop)}&region=${encodeURIComponent(form.region)}`
    api<{ prices: { official: GovPrice | null }[] }>(`/gov-prices?${q}`).then((r) => setGov(r.prices[0]?.official ?? null)).catch(() => {})
    api<{ forecasts: Forecast[] }>(`/predictions/daily?${q}`).then((r) => setFc(r.forecasts[0])).catch(() => setFc(null))
  }, [form.crop, form.region])

  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async () => {
    setBusy(true)
    setErrors({})
    const body = {
      crop: form.crop,
      variety: form.variety,
      quantity_kg: form.quantity_kg,
      price_per_kg: form.price_per_kg,
      region: form.region,
      district: form.district,
      harvest_date: form.harvest_date,
      quality_grade: form.quality_grade,
      min_order_kg: form.min_order_kg,
      description: form.description,
    }
    try {
      if (isNew) await api('/listings', { method: 'POST', body })
      else await api(`/listings/${(listing as Listing).id}`, { method: 'PUT', body })
      toast.success(isNew ? 'Crop registered — buyers can now see it' : 'Listing updated')
      onSaved()
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields)
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Register available crop' : 'Edit crop'}</DialogTitle>
          <DialogDescription>Buyers see these details in the marketplace.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Crop" error={errors.crop}>
            <SimpleSelect value={form.crop} onChange={(v) => setForm((f) => ({ ...f, crop: v }))} options={meta.crops} invalid={!!errors.crop} />
          </Field>
          <Field label="Variety">
            <Input value={form.variety ?? ''} onChange={set('variety')} placeholder="e.g. Kyela, Asante" />
          </Field>
          <Field label="Quantity available (kg)" error={errors.quantity_kg}>
            <Input type="number" min={0} value={form.quantity_kg ?? ''} onChange={set('quantity_kg')} aria-invalid={!!errors.quantity_kg} />
          </Field>
          <Field label="Your price (TZS per kg)" error={errors.price_per_kg}>
            <Input type="number" min={0} value={form.price_per_kg ?? ''} onChange={set('price_per_kg')} aria-invalid={!!errors.price_per_kg} />
          </Field>
          {(gov || fc) && (
            <div className="grid gap-2 rounded-lg border bg-muted/40 p-3 text-sm sm:col-span-2 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Gov. indicative</p>
                <p className="font-medium">{gov ? tzs(gov.price) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Market today (AI)</p>
                <p className="font-medium">{fc ? tzs(fc.current_price) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best in 4 weeks</p>
                <p className="font-medium">{fc ? `${tzs(fc.best_day_to_sell.price)} (${shortDate(fc.best_day_to_sell.date)})` : '—'}</p>
              </div>
            </div>
          )}
          <Field label="Region" error={errors.region}>
            <SimpleSelect value={form.region} onChange={(v) => setForm((f) => ({ ...f, region: v }))} options={meta.regions} invalid={!!errors.region} />
          </Field>
          <Field label="District">
            <Input value={form.district ?? ''} onChange={set('district')} />
          </Field>
          <Field label="Harvest date">
            <Input type="date" value={form.harvest_date ?? ''} onChange={set('harvest_date')} />
          </Field>
          <Field label="Quality">
            <SimpleSelect value={form.quality_grade} onChange={(v) => setForm((f) => ({ ...f, quality_grade: v }))} options={GRADES} />
          </Field>
          <Field label="Minimum order (kg)" error={errors.min_order_kg}>
            <Input type="number" min={0} value={form.min_order_kg ?? ''} onChange={set('min_order_kg')} placeholder="Optional" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description ?? ''} onChange={set('description')} placeholder="Moisture, packaging, transport…" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} {isNew ? 'Register crop' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OrdersDialog({ listing, onClose, onChanged }: { listing: Listing | null; onClose: () => void; onChanged: () => void }) {
  const [orders, setOrders] = useState<Order[]>([])
  useEffect(() => setOrders(listing?.orders ?? []), [listing])
  const act = async (o: Order, status: string) => {
    try {
      const r = await api<{ order: Order }>(`/orders/${o.id}/status`, { method: 'PUT', body: { status } })
      setOrders((prev) => prev.map((x) => (x.id === o.id ? r.order : x)))
      toast.success(`Order ${status}`)
      onChanged()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }
  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Orders for {listing?.crop}</DialogTitle>
          <DialogDescription>Confirm orders, then mark them delivered once the buyer has the crop.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{o.buyer_name}</p>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {num(o.quantity_kg)} kg × {tzs(o.price_per_kg)} = <b className="text-foreground">{tzs(o.total)}</b> ·{' '}
                {o.payment_method.replaceAll('_', ' ')} · {dateTime(o.created_at)}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm">
                <Phone className="size-3.5" /> <a href={`tel:${o.buyer_phone}`} className="text-primary hover:underline">{o.buyer_phone}</a>
              </p>
              {o.delivery_note && <p className="mt-1 text-sm italic">“{o.delivery_note}”</p>}
              <div className="mt-2 flex gap-2">
                {o.status === 'pending' && (
                  <Button size="sm" onClick={() => act(o, 'confirmed')}>
                    <CheckCircle2 /> Confirm
                  </Button>
                )}
                {o.status === 'confirmed' && (
                  <Button size="sm" onClick={() => act(o, 'delivered')}>
                    <Truck /> Mark delivered
                  </Button>
                )}
                {(o.status === 'pending' || o.status === 'confirmed') && (
                  <Button size="sm" variant="outline" onClick={() => act(o, 'cancelled')}>
                    <XCircle /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ======================= Buyers ======================= */
export function BuyersPage() {
  const { meta } = useAuth()
  const [region, setRegion] = useState('all')
  const [crop, setCrop] = useState('all')
  const { data, loading, error } = useApi<{ buyers: Buyer[] }>(
    `/buyers${region === 'all' ? '' : `?region=${encodeURIComponent(region)}`}`,
  )
  const rows = (data?.buyers ?? []).filter((b) => crop === 'all' || (b.interested_crops ?? []).includes(crop))
  return (
    <>
      <PageHeader
        title="Buyers"
        description="Registered buyers on the platform — contact them directly or wait for their orders."
        action={
          <div className="flex gap-2">
            <SimpleSelect value={crop} onChange={setCrop} options={[{ value: 'all', label: 'All crops' }, ...meta.crops]} className="w-40" />
            <SimpleSelect value={region} onChange={setRegion} options={[{ value: 'all', label: 'All regions' }, ...meta.regions]} className="w-40" />
          </div>
        }
      />
      {error && <ErrorBox message={error} />}
      {loading ? (
        <LoadingRows />
      ) : !rows.length ? (
        <EmptyState icon={Users} title="No buyers found" text="Try another region or crop." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => (
            <Card key={b.id} className="gap-3">
              <CardHeader>
                <CardTitle>{b.business_name || b.full_name}</CardTitle>
                <CardDescription>
                  {b.business_name && <>{b.full_name} · </>}
                  {b.business_type ?? 'Buyer'}
                </CardDescription>
                {(b.orders_with_you > 0 || b.in_cart_with_you > 0) && (
                  <CardAction>
                    <Badge variant={b.orders_with_you ? 'success' : 'info'}>
                      {b.orders_with_you ? `${b.orders_with_you} order(s) with you` : 'Has your crop in cart'}
                    </Badge>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" /> {[b.district, b.region].filter(Boolean).join(', ')}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <a href={`tel:${b.phone}`} className="text-primary hover:underline">
                    {b.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <a href={`mailto:${b.email}`} className="truncate text-primary hover:underline">
                    {b.email}
                  </a>
                </p>
                {!!b.interested_crops?.length && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {b.interested_crops.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}


/* ======================= Orders ======================= */
export function FarmerOrders() {
  const { data, loading, error, reload } = useApi<{ orders: Order[] }>('/orders/farmer')

  const act = async (o: Order, status: string) => {
    try {
      await api(`/orders/${o.id}/status`, { method: 'PUT', body: { status } })
      toast.success(status === 'confirmed' ? 'Order approved' : `Order ${status}`)
      reload()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader title="Orders" description="Approve orders buyers placed, then mark them delivered once the crop is handed over." />
      {error && <ErrorBox message={error} />}
      {loading ? (
        <LoadingRows />
      ) : !data?.orders.length ? (
        <EmptyState icon={ClipboardList} title="No orders yet" text="When a buyer orders one of your crops, it appears here to approve." />
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{dateTime(o.created_at)}</TableCell>
                    <TableCell className="font-medium">
                      {o.crop} <span className="text-xs text-muted-foreground">({o.region})</span>
                    </TableCell>
                    <TableCell>
                      <div>{o.buyer_name}</div>
                      <div className="text-xs text-muted-foreground">{o.buyer_phone}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{num(o.quantity_kg)} kg</TableCell>
                    <TableCell className="text-right tabular-nums">{tzs(o.total)}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {o.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => act(o, 'confirmed')}>
                              <CheckCircle2 /> Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => act(o, 'cancelled')}>
                              <XCircle /> Decline
                            </Button>
                          </>
                        )}
                        {o.status === 'confirmed' && (
                          <Button size="sm" variant="outline" onClick={() => act(o, 'delivered')}>
                            <Truck /> Mark delivered
                          </Button>
                        )}
                        {(o.status === 'delivered' || o.status === 'cancelled') && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
