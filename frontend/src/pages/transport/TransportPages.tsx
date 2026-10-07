import { useState } from 'react'
import { BadgeCheck, Mail, MapPin, Phone, Plane, Ship, Star, Truck } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/DashboardLayout'
import { EmptyState, ErrorBox, LoadingRows } from '@/components/shared/common'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { num, shortDate } from '@/lib/format'
import type { Order, Shipment, TransportAgency, TransportMode } from '@/lib/types'
import { useApi } from '@/lib/useApi'
import { cn } from '@/lib/utils'

const MODE_ICON = { road: Truck, air: Plane, water: Ship } as const
const MODES: TransportMode[] = ['road', 'air', 'water']
const MODE_LABEL = { road: 'Road', air: 'Air', water: 'Water' }

function StatusBadge({ status }: { status: Shipment['status'] }) {
  const map = {
    requested: { v: 'warning', t: 'Requested' },
    dispatched: { v: 'info', t: 'Sent / In transit' },
    delivered: { v: 'success', t: 'Delivered' },
    cancelled: { v: 'muted', t: 'Cancelled' },
  } as const
  const s = map[status]
  return <Badge variant={s.v}>{s.t}</Badge>
}

function AgencyContact({ a }: { a: Shipment['agency'] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">{a.name}</span>
      {a.verified && (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <BadgeCheck className="size-3.5" /> Trusted
        </span>
      )}
      <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 text-primary hover:underline">
        <Phone className="size-3.5" /> {a.phone}
      </a>
      <a href={`mailto:${a.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
        <Mail className="size-3.5" /> Email
      </a>
    </div>
  )
}

// ---------------- Buyer: request + track transport ----------------
export function BuyerTransport() {
  const orders = useApi<{ orders: Order[] }>('/orders/buyer')
  const ships = useApi<{ shipments: Shipment[] }>('/transport/mine')
  const [requesting, setRequesting] = useState<Order | null>(null)

  const byOrder = new Map((ships.data?.shipments ?? []).map((s) => [s.order_id, s]))
  const reload = () => {
    ships.reload()
    orders.reload()
  }

  return (
    <>
      <PageHeader title="Transport" description="Choose a trusted agency to move your purchase — by road, air or water — and track it." />
      {(orders.error || ships.error) && <ErrorBox message={orders.error || ships.error || ''} />}
      {orders.loading ? (
        <LoadingRows />
      ) : !orders.data?.orders.length ? (
        <EmptyState icon={Truck} title="No orders to ship" text="Buy a crop first, then request transport here." />
      ) : (
        <div className="grid gap-4">
          {orders.data.orders.map((o) => {
            const s = byOrder.get(o.id)
            const Icon = s ? MODE_ICON[s.mode] : Truck
            return (
              <Card key={o.id}>
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {o.crop} · {num(o.quantity_kg)} kg
                      <span className="ml-2 text-xs text-muted-foreground">from {o.farmer_name}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" /> {o.region}
                    </p>
                  </div>
                  {s ? (
                    <div className="flex flex-col items-start gap-1.5 sm:items-end">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-primary" />
                        <span className="text-sm">{MODE_LABEL[s.mode]}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <AgencyContact a={s.agency} />
                    </div>
                  ) : o.status === 'confirmed' || o.status === 'delivered' ? (
                    <Button onClick={() => setRequesting(o)}>
                      <Truck className="size-4" /> Request transport
                    </Button>
                  ) : o.status === 'cancelled' ? (
                    <Badge variant="muted">Order cancelled</Badge>
                  ) : (
                    <Badge variant="warning">Waiting for farmer approval</Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      <RequestDialog
        order={requesting}
        onClose={() => setRequesting(null)}
        onDone={() => {
          setRequesting(null)
          reload()
        }}
      />
    </>
  )
}

function RequestDialog({ order, onClose, onDone }: { order: Order | null; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<TransportMode | ''>('')
  const [agencyId, setAgencyId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const region = order?.region ?? ''
  const agencies = useApi<{ agencies: TransportAgency[] }>(
    order && mode ? `/transport/agencies?region=${encodeURIComponent(region)}&mode=${mode}` : null,
  )

  const reset = () => {
    setMode('')
    setAgencyId('')
    setNote('')
  }
  const submit = async () => {
    if (!order || !mode) return toast.error('Choose a transport mode.')
    if (!agencyId) return toast.error('Choose an agency.')
    setBusy(true)
    try {
      await api('/transport/request', { method: 'POST', body: { order_id: order.id, mode, agency_id: agencyId, note } })
      toast.success('Transport requested')
      reset()
      onDone()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && (reset(), onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request transport</DialogTitle>
          <DialogDescription>
            {order?.crop} · {order ? num(order.quantity_kg) : 0} kg · from {region}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">1. Route / mode</p>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => {
                const Icon = MODE_ICON[m]
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m)
                      setAgencyId('')
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm transition-colors',
                      mode === m ? 'border-primary bg-primary/5 font-medium' : 'hover:bg-muted',
                    )}
                  >
                    <Icon className="size-5 text-primary" /> {MODE_LABEL[m]}
                  </button>
                )
              })}
            </div>
          </div>

          {mode && (
            <div>
              <p className="mb-2 text-sm font-medium">2. Agency serving {region}</p>
              {agencies.loading ? (
                <LoadingRows rows={2} />
              ) : !agencies.data?.agencies.length ? (
                <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  No {MODE_LABEL[mode].toLowerCase()} agency serves {region} yet. Try another mode.
                </p>
              ) : (
                <div className="grid max-h-56 gap-2 overflow-y-auto">
                  {agencies.data.agencies.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAgencyId(a.id)}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors',
                        agencyId === a.id ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                      )}
                    >
                      <span>
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {a.name}
                          {a.verified && <BadgeCheck className="size-3.5 text-emerald-600" />}
                        </span>
                        <span className="text-xs text-muted-foreground">{a.phone}</span>
                      </span>
                      {a.rating != null && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Star className="size-3.5 fill-amber-400 text-amber-400" /> {a.rating}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {agencyId && (
            <div>
              <p className="mb-2 text-sm font-medium">3. Note for the agency (optional)</p>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Collect from the warehouse" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => (reset(), onClose())}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !agencyId}>
            {busy ? 'Requesting…' : 'Request transport'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------- Farmer: dispatch shipments ----------------
export function FarmerShipments() {
  const { data, loading, error, reload } = useApi<{ shipments: Shipment[] }>('/transport/farmer')

  const advance = async (s: Shipment, status: Shipment['status']) => {
    try {
      await api(`/transport/${s.id}/status`, { method: 'PATCH', body: { status } })
      toast.success(status === 'dispatched' ? 'Marked as sent' : 'Marked as delivered')
      reload()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return (
    <>
      <PageHeader title="Shipments" description="Transport buyers requested for your sold crops. Mark them as sent when the agency collects." />
      {error && <ErrorBox message={error} />}
      {loading ? (
        <LoadingRows />
      ) : !data?.shipments.length ? (
        <EmptyState icon={Truck} title="No shipments yet" text="When a buyer requests transport for an order, it appears here." />
      ) : (
        <Card className="py-2">
          <CardContent className="px-2 sm:px-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Crop</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Agency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.shipments.map((s) => {
                  const Icon = MODE_ICON[s.mode]
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.crop} <span className="text-xs text-muted-foreground">({num(s.quantity_kg)} kg)</span>
                      </TableCell>
                      <TableCell>{s.buyer_name}</TableCell>
                      <TableCell className="text-sm">
                        <span className="inline-flex items-center gap-1">
                          <Icon className="size-3.5 text-primary" /> {s.pickup_region} → {s.dest_region ?? '—'}
                        </span>
                        <span className="block text-xs text-muted-foreground">{shortDate(s.created_at)}</span>
                      </TableCell>
                      <TableCell className="text-sm">{s.agency.name}</TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {s.status === 'requested' && (
                          <Button size="sm" onClick={() => advance(s, 'dispatched')}>
                            Mark sent
                          </Button>
                        )}
                        {s.status === 'dispatched' && (
                          <Button size="sm" variant="outline" onClick={() => advance(s, 'delivered')}>
                            Mark delivered
                          </Button>
                        )}
                        {(s.status === 'delivered' || s.status === 'cancelled') && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
