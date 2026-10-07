import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BrainCircuit,
  Landmark,
  Loader2,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Receipt,
  ShoppingBasket,
  ShoppingCart,
  Trash2,
  Wallet,
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
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { api } from '@/lib/api'
import { dateTime, longDate, num, shortDate, tzs, unitPrice } from '@/lib/format'
import type { Forecast, Listing, Order } from '@/lib/types'
import { useApi } from '@/lib/useApi'

/* ======================= Marketplace (buyer home) ======================= */
export function Marketplace() {
  const { user, meta } = useAuth()
  const cart = useCart()
  const [crop, setCrop] = useState('all')
  const [region, setRegion] = useState('all')
  const [showSold, setShowSold] = useState(false)
  const params = new URLSearchParams()
  if (crop !== 'all') params.set('crop', crop)
  if (region !== 'all') params.set('region', region)
  if (showSold) params.set('include_sold', '1')
  const { data, loading, error } = useApi<{ listings: Listing[] }>(`/listings?${params}`)
  const daily = useApi<{ forecasts: Forecast[] }>('/predictions/daily?region=National')
  const orders = useApi<{ orders: Order[] }>('/orders/buyer')
  const [adding, setAdding] = useState<Listing | null>(null)

  const fcFor = (c: string) => daily.data?.forecasts.find((f) => f.crop === c)
  const spent = (orders.data?.orders ?? []).filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  const available = (data?.listings ?? []).filter((l) => l.status !== 'sold')

  return (
    <>
      <PageHeader
        title="Buyer dashboard"
        description="Crops farmers have available right now, with the government indicative price and the AI forecast."
        action={
          <Button asChild variant="outline">
            <Link to="/buyer/cart">
              <ShoppingCart /> Cart ({cart.count})
            </Link>
          </Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Crops available" value={available.length} hint={`${num(available.reduce((s, l) => s + l.quantity_available_kg, 0))} kg in total`} />
        <StatCard icon={ShoppingCart} label="In your cart" value={cart.count} tone="sky" hint={tzs(cart.total)} />
        <StatCard icon={Receipt} label="Your orders" value={orders.data?.orders.length ?? 0} tone="amber" />
        <StatCard icon={Wallet} label="Total purchases" value={tzs(spent)} tone="rose" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SimpleSelect value={crop} onChange={setCrop} options={[{ value: 'all', label: 'All crops' }, ...meta.crops]} className="w-44" />
        <SimpleSelect value={region} onChange={setRegion} options={[{ value: 'all', label: 'All regions' }, ...meta.regions]} className="w-44" />
        <Label className="ml-1 flex items-center gap-2 text-sm font-normal">
          <Switch checked={showSold} onCheckedChange={setShowSold} /> Show crops already bought
        </Label>
      </div>
      {error && <ErrorBox message={error} />}
      {loading ? (
        <LoadingRows />
      ) : !data?.listings.length ? (
        <EmptyState icon={ShoppingBasket} title="No crops match" text="Try another crop or region — farmers add new crops every day." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.listings.map((l) => {
            const f = fcFor(l.crop)
            const inCart = cart.items.find((i) => i.listing.id === l.id)
            const buyable = l.status === 'available' || l.status === 'partially_sold'
            return (
              <Card key={l.id} className="gap-4">
                <CardHeader>
                  <CardTitle>
                    {l.crop}
                    {l.variety && <span className="font-normal text-muted-foreground"> · {l.variety}</span>}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {[l.district, l.region].filter(Boolean).join(', ')}
                  </CardDescription>
                  <CardAction>
                    <ListingStatusBadge status={l.status} />
                  </CardAction>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Farmer’s price</p>
                      <p className="text-xl font-semibold tabular-nums">{unitPrice(l.price_per_kg, user?.settings)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="font-semibold tabular-nums">{num(l.quantity_available_kg)} kg</p>
                    </div>
                  </div>
                  <div className="grid gap-2 rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Landmark className="size-4" /> Gov. price
                      </span>
                      <span className="font-medium tabular-nums">
                        {l.gov_price ? unitPrice(l.gov_price.price, user?.settings) : '—'}
                        {l.vs_gov_pct != null && (
                          <Badge variant={l.vs_gov_pct > 5 ? 'warning' : 'success'} className="ml-1.5">
                            {l.vs_gov_pct > 0 ? '+' : ''}
                            {l.vs_gov_pct}%
                          </Badge>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <BrainCircuit className="size-4" /> AI in 4 weeks (national)
                      </span>
                      {f ? (
                        (() => {
                          const later = f.forecast[f.forecast.length - 1]?.price ?? f.current_price
                          return (
                            <span className="flex items-center gap-1.5">
                              <span className="tabular-nums">{num(later)}</span>
                              <TrendBadge trend={later > f.current_price * 1.01 ? 'up' : later < f.current_price * 0.99 ? 'down' : 'stable'} />
                            </span>
                          )
                        })()
                      ) : (
                        '—'
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {l.quality_grade && <Badge variant="outline">{l.quality_grade}</Badge>}
                    {l.min_order_kg && <Badge variant="outline">Min {num(l.min_order_kg)} kg</Badge>}
                    {l.harvest_date && <Badge variant="outline">Harvested {shortDate(l.harvest_date)}</Badge>}
                  </div>
                  {l.description && <p className="line-clamp-2 text-muted-foreground">{l.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    Farmer: <span className="font-medium text-foreground">{l.farmer?.full_name ?? l.farmer_name}</span>
                  </p>
                </CardContent>
                <CardFooter className="mt-auto">
                  {buyable ? (
                    <Button className="w-full" variant={inCart ? 'secondary' : 'default'} onClick={() => setAdding(l)}>
                      <ShoppingCart /> {inCart ? `In cart (${num(inCart.quantity_kg)} kg) — change` : 'Add to cart'}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Already bought
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
      <AddToCartDialog listing={adding} forecast={adding ? fcFor(adding.crop) : undefined} onClose={() => setAdding(null)} />
    </>
  )
}

function AddToCartDialog({ listing, forecast, onClose }: { listing: Listing | null; forecast?: Forecast; onClose: () => void }) {
  const cart = useCart()
  const [qty, setQty] = useState('')
  const [busy, setBusy] = useState(false)
  const existing = listing ? cart.items.find((i) => i.listing.id === listing.id) : undefined
  const q = Number(qty || existing?.quantity_kg || listing?.min_order_kg || 50)

  const add = async () => {
    if (!listing) return
    setBusy(true)
    try {
      await cart.add(listing.id, q)
      toast.success(`${num(q)} kg of ${listing.crop} added to cart`)
      setQty('')
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  if (!listing) return null
  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && (setQty(''), onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {listing.crop} to cart</DialogTitle>
          <DialogDescription>
            From {listing.farmer?.full_name ?? listing.farmer_name}, {listing.region} · {num(listing.quantity_available_kg)} kg available
          </DialogDescription>
        </DialogHeader>
        <Field label="Quantity (kg)" hint={listing.min_order_kg ? `Minimum order ${num(listing.min_order_kg)} kg` : undefined}>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setQty(String(Math.max(1, q - 100)))} aria-label="Less">
              <Minus />
            </Button>
            <Input type="number" min={1} max={listing.quantity_available_kg} value={qty || q} onChange={(e) => setQty(e.target.value)} />
            <Button variant="outline" size="icon" onClick={() => setQty(String(Math.min(listing.quantity_available_kg, q + 100)))} aria-label="More">
              <Plus />
            </Button>
          </div>
        </Field>
        <div className="space-y-1 rounded-lg border p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price</span>
            <span>{tzs(listing.price_per_kg)}/kg</span>
          </div>
          {listing.gov_price && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gov. indicative</span>
              <span>{tzs(listing.gov_price.price)}/kg</span>
            </div>
          )}
          {forecast && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI: cheapest in next 4 weeks</span>
              <span>
                {tzs(forecast.best_day_to_buy.price)}/kg ({shortDate(forecast.best_day_to_buy.date)})
              </span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Subtotal</span>
            <span>{tzs(q * listing.price_per_kg)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={add} disabled={busy || !q}>
            {busy ? <Loader2 className="animate-spin" /> : <ShoppingCart />} {existing ? 'Update cart' : 'Add to cart'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ======================= Cart ======================= */
export function CartPage() {
  const cart = useCart()
  const [payment, setPayment] = useState('cash_on_delivery')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Order[] | null>(null)
  const problems = useMemo(() => cart.items.filter((i) => i.problem).length, [cart.items])

  const checkout = async () => {
    setBusy(true)
    try {
      const r = await api<{ orders: Order[]; skipped: string[] }>('/cart/checkout', {
        method: 'POST',
        body: { payment_method: payment, delivery_note: note },
      })
      setDone(r.orders)
      if (r.skipped.length) toast.warning(`${r.skipped.length} item(s) were no longer available and stayed in the cart`)
      else toast.success('Order placed! Farmers will confirm soon.')
      cart.reload()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (done)
    return (
      <EmptyState
        icon={Receipt}
        title={`${done.length} order${done.length > 1 ? 's' : ''} placed`}
        text={`Total ${tzs(done.reduce((s, o) => s + o.total, 0))}. The farmers will contact you to confirm and arrange delivery.`}
        action={
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/buyer/orders">View my orders</Link>
            </Button>
            <Button variant="outline" onClick={() => setDone(null)}>
              Back to cart
            </Button>
          </div>
        }
      />
    )

  return (
    <>
      <PageHeader title="My cart" description="Review the crops you want to buy, then place your order." />
      {cart.loading ? (
        <LoadingRows />
      ) : !cart.items.length ? (
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          text="Browse available crops and add what you want to buy."
          action={
            <Button asChild>
              <Link to="/buyer">Browse crops</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 py-2">
            <CardContent className="px-2 sm:px-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead className="text-right">Price/kg</TableHead>
                    <TableHead className="w-32">Qty (kg)</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <p className="font-medium">{i.listing.crop}</p>
                        <p className="text-xs text-muted-foreground">{i.listing.region}</p>
                        {i.problem && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="size-3" /> {i.problem}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p>{i.listing.farmer?.full_name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="size-3" /> {i.listing.farmer?.phone}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{num(i.listing.price_per_kg)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          defaultValue={i.quantity_kg}
                          className="h-8"
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (v && v !== i.quantity_kg) cart.update(i.id, v).catch((err) => toast.error(err.message))
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{tzs(i.subtotal)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => cart.remove(i.id)} aria-label="Remove">
                          <Trash2 className="text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{cart.count}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{tzs(cart.total)}</span>
              </div>
              <Field label="Payment">
                <SimpleSelect
                  value={payment}
                  onChange={setPayment}
                  options={[
                    { value: 'cash_on_delivery', label: 'Cash on delivery' },
                    { value: 'mobile_money', label: 'Mobile money (M-Pesa, Tigo Pesa, Airtel Money)' },
                    { value: 'bank_transfer', label: 'Bank transfer' },
                  ]}
                />
              </Field>
              <Field label="Delivery note">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where and when to deliver" />
              </Field>
              {problems > 0 && <p className="text-xs text-destructive">{problems} item(s) can’t be ordered — adjust or remove them.</p>}
              <Button className="w-full" size="lg" onClick={checkout} disabled={busy || cart.total <= 0}>
                {busy && <Loader2 className="animate-spin" />} Place order
              </Button>
              <p className="text-xs text-muted-foreground">Payment is arranged directly with the farmer after they confirm.</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

/* ======================= Orders ======================= */
export function BuyerOrders() {
  const { data, loading, error } = useApi<{ orders: Order[] }>('/orders/buyer')
  return (
    <>
      <PageHeader title="My orders" description="Crops you have bought and their status." />
      {error && <ErrorBox message={error} />}
      {loading ? (
        <LoadingRows />
      ) : !data?.orders.length ? (
        <EmptyState icon={Receipt} title="No orders yet" text="When you check out your cart, orders appear here." />
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{dateTime(o.created_at)}</TableCell>
                    <TableCell className="font-medium">
                      {o.crop} <span className="text-xs text-muted-foreground">({o.region})</span>
                    </TableCell>
                    <TableCell>{o.farmer_name}</TableCell>
                    <TableCell className="text-right tabular-nums">{num(o.quantity_kg)} kg</TableCell>
                    <TableCell className="text-right tabular-nums">{tzs(o.total)}</TableCell>
                    <TableCell className="capitalize">{o.payment_method.replaceAll('_', ' ')}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Updated {longDate(new Date().toISOString().slice(0, 10))}</p>
    </>
  )
}
