import { useState, type FormEvent } from 'react'
import { Landmark, Package, Receipt, ShoppingBasket, Tractor, Users } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/DashboardLayout'
import { EmptyState, ErrorBox, Field, LoadingRows, SimpleSelect, StatCard } from '@/components/shared/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { shortDate, tzs } from '@/lib/format'
import type { GovPrice } from '@/lib/types'
import { useApi } from '@/lib/useApi'

interface Stats {
  farmers: number
  buyers: number
  listings: number
  orders: number
  gov_prices: number
}

interface AdminUser {
  id: string
  role: 'farmer' | 'buyer'
  full_name: string
  email: string
  phone: string
  region?: string
  district?: string
  business_name?: string
  business_type?: string
  main_crops?: string[]
  interested_crops?: string[]
  created_at: string
}

// ---------------- Overview ----------------
export function AdminOverview() {
  const { data, loading, error } = useApi<Stats>('/admin/stats')
  return (
    <>
      <PageHeader title="Admin overview" description="Agri-Market AI at a glance." />
      {error && <ErrorBox message={error} />}
      {loading || !data ? (
        <LoadingRows rows={2} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Farmers" value={data.farmers} icon={Tractor} />
          <StatCard label="Buyers" value={data.buyers} icon={ShoppingBasket} tone="sky" />
          <StatCard label="Crop listings" value={data.listings} icon={Package} />
          <StatCard label="Orders" value={data.orders} icon={Receipt} tone="amber" />
          <StatCard label="Government prices on file" value={data.gov_prices} icon={Landmark} />
        </div>
      )}
    </>
  )
}

// ---------------- Government indicative prices ----------------
export function AdminGovPrices() {
  const { meta } = useAuth()
  const today = new Date().toISOString().slice(0, 10)
  const [crop, setCrop] = useState('')
  const [region, setRegion] = useState('National')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(today)
  const [source, setSource] = useState('')
  const [busy, setBusy] = useState(false)

  // show the current official price per crop for the chosen region
  const { data, loading, error, reload } = useApi<{ prices: { crop: string; official: GovPrice | null }[] }>(
    `/gov-prices?region=${encodeURIComponent(region)}`,
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!crop) return toast.error('Choose a crop.')
    const p = Number(price)
    if (!p || p <= 0) return toast.error('Enter a valid price.')
    setBusy(true)
    try {
      await api('/admin/gov-prices', {
        method: 'POST',
        body: {
          source: source || `Ministry bulletin (${date})`,
          prices: [{ crop, region, price: p, date }],
        },
      })
      toast.success(`Saved ${crop} · ${region} · ${tzs(p)}`)
      setPrice('')
      reload()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Government prices (bei elekezi)"
        description="Add the official indicative prices from the Ministry bulletin. New prices feed the AI and clear the “old price” warning."
      />
      {error && <ErrorBox message={error} />}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Add a price</CardTitle>
            <CardDescription>One crop + region at a time.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-4">
              <Field label="Crop">
                <SimpleSelect value={crop} onChange={setCrop} options={meta.crops} placeholder="Choose a crop" />
              </Field>
              <Field label="Region">
                <SimpleSelect value={region} onChange={setRegion} options={meta.market_regions} />
              </Field>
              <Field label="Price (TZS / kg)">
                <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 850" />
              </Field>
              <Field label="Date of bulletin">
                <Input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Source (optional)">
                <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Weekly Market Bulletin 1-5 Oct 2026" />
              </Field>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save price'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="size-5 text-primary" /> Current official prices · {region}
            </CardTitle>
            <CardDescription>The latest price on file for each crop.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !data ? (
              <LoadingRows rows={4} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Crop</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.prices.map((r) => (
                    <TableRow key={r.crop}>
                      <TableCell className="font-medium">{r.crop}</TableCell>
                      <TableCell>{r.official ? tzs(r.official.price) : '—'}</TableCell>
                      <TableCell>{r.official ? shortDate(r.official.date) : '—'}</TableCell>
                      <TableCell className={r.official && r.official.days_old > 30 ? 'text-amber-600' : ''}>
                        {r.official ? `${r.official.days_old} days` : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

// ---------------- Registered users ----------------
export function AdminUsers() {
  const [filter, setFilter] = useState('All')
  const { data, loading, error } = useApi<{ users: AdminUser[]; counts: { farmers: number; buyers: number } }>('/admin/users')
  const users = (data?.users ?? []).filter((u) => filter === 'All' || u.role === filter.toLowerCase())

  return (
    <>
      <PageHeader
        title="Registered users"
        description={data ? `${data.counts.farmers} farmers · ${data.counts.buyers} buyers` : 'Farmers and buyers on the platform.'}
        action={<SimpleSelect value={filter} onChange={setFilter} options={['All', 'Farmer', 'Buyer']} className="w-36" />}
      />
      {error && <ErrorBox message={error} />}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <LoadingRows rows={5} />
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No users yet" text="Farmers and buyers will appear here once they register." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Crops / Business</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell className="text-sm">
                      <div>{u.phone}</div>
                      <div className="text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>{[u.district, u.region].filter(Boolean).join(', ') || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.role === 'farmer'
                        ? (u.main_crops ?? []).join(', ') || '—'
                        : u.business_name || (u.interested_crops ?? []).join(', ') || '—'}
                    </TableCell>
                    <TableCell>{shortDate(u.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}
