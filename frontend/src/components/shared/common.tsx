import type { ReactNode } from 'react'
import { AlertCircle, Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/lib/i18n'
import type { ListingStatus, Order } from '@/lib/types'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: LucideIcon
  tone?: 'default' | 'amber' | 'sky' | 'rose'
}) {
  const tones = {
    default: 'bg-primary/10 text-primary',
    amber: 'bg-amber-500/10 text-amber-600',
    sky: 'bg-sky-500/10 text-sky-600',
    rose: 'bg-rose-500/10 text-rose-600',
  }
  return (
    <Card className="gap-0 py-5">
      <CardContent className="flex items-start gap-4">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const LISTING_STATUS_VARIANT: Record<ListingStatus, 'success' | 'warning' | 'info' | 'muted'> = {
  available: 'success',
  partially_sold: 'warning',
  sold: 'info',
  withdrawn: 'muted',
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const t = useT()
  const labels: Record<ListingStatus, string> = {
    available: t('Inapatikana', 'Available'),
    partially_sold: t('Imenunuliwa kwa sehemu', 'Partly bought'),
    sold: t('Imenunuliwa / Imeuzwa', 'Bought / Sold'),
    withdrawn: t('Imeondolewa', 'Withdrawn'),
  }
  const variant = LISTING_STATUS_VARIANT[status] ?? LISTING_STATUS_VARIANT.available
  return <Badge variant={variant}>{labels[status] ?? labels.available}</Badge>
}

const ORDER_STATUS: Record<Order['status'], 'warning' | 'info' | 'success' | 'muted'> = {
  pending: 'warning',
  confirmed: 'info',
  delivered: 'success',
  cancelled: 'muted',
}

export function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const t = useT()
  const labels: Record<Order['status'], string> = {
    pending: t('Inasubiri', 'Pending'),
    confirmed: t('Imethibitishwa', 'Confirmed'),
    delivered: t('Imefikishwa', 'Delivered'),
    cancelled: t('Imeghairiwa', 'Cancelled'),
  }
  return (
    <Badge variant={ORDER_STATUS[status]} className="capitalize">
      {labels[status]}
    </Badge>
  )
}

export function TrendBadge({ trend, pct }: { trend: 'up' | 'down' | 'stable'; pct?: number }) {
  const t = useT()
  const map = {
    up: { icon: TrendingUp, cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300', label: t('Inapanda', 'Rising') },
    down: { icon: TrendingDown, cls: 'text-rose-700 bg-rose-50 dark:bg-rose-950 dark:text-rose-300', label: t('Inashuka', 'Falling') },
    stable: { icon: Minus, cls: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300', label: t('Tulivu', 'Stable') },
  }[trend]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', map.cls)}>
      <map.icon className="size-3.5" />
      {map.label}
      {pct != null && ` ${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
    </span>
  )
}

export function Field({
  label,
  error,
  children,
  hint,
  className,
}: {
  label: string
  error?: string
  children: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function SimpleSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  invalid,
}: {
  value?: string
  onChange: (v: string) => void
  options: (string | { value: string; label: string })[]
  placeholder?: string
  className?: string
  invalid?: boolean
}) {
  const t = useT()
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={className} aria-invalid={invalid || undefined}>
        <SelectValue placeholder={placeholder ?? t('Chagua', 'Select')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value
          const l = typeof o === 'string' ? o : o.label
          return (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <p className="font-medium">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      {message}
    </div>
  )
}

export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}
