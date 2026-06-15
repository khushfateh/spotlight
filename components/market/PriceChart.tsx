'use client'

import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { PricePoint, TimeRange } from '@/types'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'

type PriceChartProps = {
  data: PricePoint[]
  isPositive: boolean
  showRangeSelector?: boolean
  height?: number
  compact?: boolean
}

const RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y']

type TooltipEntry = { payload?: { date?: string }; value?: number }
function TooltipContent(active: boolean, payload: TooltipEntry[]) {
  if (!active || !payload?.[0]) return null
  return (
    <div className="bg-hype-surface-2 border border-hype-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-hype-muted">{payload[0].payload?.date}</p>
      <p className="text-hype-text font-semibold tabular">{formatPrice(payload[0].value ?? 0)}</p>
    </div>
  )
}

export default function PriceChart({ data, isPositive, showRangeSelector = false, height = 180, compact = false }: PriceChartProps) {
  const [range, setRange] = useState<TimeRange>('3M')

  const color = isPositive ? '#10B981' : '#EF4444'
  const gradientId = isPositive ? 'emeraldGrad' : 'redGrad'

  const slicedData = (() => {
    if (range === '1D') return data.slice(-1)
    if (range === '1W') return data.slice(-7)
    if (range === '1M') return data.slice(-30)
    if (range === '3M') return data.slice(-90)
    return data
  })()

  const displayData = slicedData.length < 2 ? data.slice(-30) : slicedData

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={displayData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {!compact && (
            <>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#525252', fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                tickCount={4}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fill: '#525252', fontFamily: 'Inter' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatPrice(v as number)}
                width={52}
              />
              <Tooltip
                content={({ active, payload }) =>
                  TooltipContent(!!active, (payload ?? []) as unknown as TooltipEntry[])
                }
              />
            </>
          )}
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={compact ? 1.5 : 1.75}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={compact ? false : { r: 3, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {showRangeSelector && (
        <div className="flex items-center justify-center gap-1 mt-4">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                range === r
                  ? 'bg-hype-surface-2 text-hype-text border border-hype-border'
                  : 'text-hype-muted hover:text-hype-secondary',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
