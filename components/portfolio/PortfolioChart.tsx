'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { PortfolioSnapshot } from '@/types'
import { formatLargeNumber } from '@/lib/utils'

type PortfolioChartProps = {
  data: PortfolioSnapshot[]
  height?: number
}

type TooltipEntry = { payload?: { date?: string }; value?: number }
function TooltipContent(active: boolean, payload: TooltipEntry[]) {
  if (!active || !payload?.[0]) return null
  return (
    <div className="bg-hype-surface-2 border border-hype-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="text-hype-muted">{payload[0].payload?.date}</p>
      <p className="text-hype-text font-bold tabular">{formatLargeNumber(payload[0].value ?? 0)}</p>
    </div>
  )
}

export default function PortfolioChart({ data, height = 160 }: PortfolioChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 9, fill: '#525252', fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          tickCount={5}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 9, fill: '#525252', fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
          width={42}
        />
        <Tooltip
          content={({ active, payload }) =>
            TooltipContent(!!active, (payload ?? []) as unknown as TooltipEntry[])
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#10B981"
          strokeWidth={1.75}
          fill="url(#portfolioGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
