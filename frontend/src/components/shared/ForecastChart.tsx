import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { shortDate, tzs } from '@/lib/format'
import type { Forecast } from '@/lib/types'

interface Row {
  date: string
  actual?: number
  predicted?: number
  band?: [number, number]
}

export function ForecastChart({ forecast, govPrice, height = 280 }: { forecast: Forecast; govPrice?: number | null; height?: number }) {
  const rows: Row[] = forecast.recent.map((r) => ({ date: r.date, actual: r.price }))
  // connect the lines at "today"
  if (rows.length) rows[rows.length - 1].predicted = rows[rows.length - 1].actual
  forecast.forecast.forEach((p) => rows.push({ date: p.date, predicted: p.price, band: [p.low, p.high] }))

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            className="text-xs"
            tick={{ fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => v.toLocaleString('en-US')}
            className="text-xs"
            tick={{ fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--popover-foreground)',
            }}
            labelFormatter={(l) => shortDate(String(l))}
            formatter={(v, name) => {
              if (Array.isArray(v)) return [`${tzs(v[0])} – ${tzs(v[1])}`, 'Likely range']
              return [tzs(Number(v)) + '/kg', name === 'actual' ? 'Market price' : 'AI prediction']
            }}
          />
          <Area dataKey="band" stroke="none" fill="var(--chart-2)" fillOpacity={0.18} isAnimationActive={false} />
          <Line dataKey="actual" stroke="var(--chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line
            dataKey="predicted"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
          {govPrice ? (
            <ReferenceLine
              y={govPrice}
              stroke="var(--chart-3)"
              strokeDasharray="2 3"
              label={{ value: 'Gov. price', position: 'insideTopLeft', fill: 'var(--chart-3)', fontSize: 11 }}
            />
          ) : null}
          <ReferenceLine x={forecast.as_of} stroke="var(--muted-foreground)" strokeOpacity={0.4} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ChartLegend({ gov }: { gov?: boolean }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 bg-chart-1" /> Market price (last 30 days)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 border-t-2 border-dashed border-chart-2" /> AI prediction
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-4 rounded-sm bg-chart-2/20" /> Likely range
      </span>
      {gov && (
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t-2 border-dotted border-chart-3" /> Government indicative price
        </span>
      )}
    </div>
  )
}
