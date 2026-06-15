'use client'

import { Bell, TrendingUp, TrendingDown, Rocket, CheckCircle, AlertCircle } from 'lucide-react'
import { notifications } from '@/lib/mock-data'
import { formatTimeAgo, cn } from '@/lib/utils'

const notifIcons = {
  price_up: <TrendingUp size={16} className="text-hype-green" />,
  price_down: <TrendingDown size={16} className="text-hype-red" />,
  creator_update: <Bell size={16} className="text-hype-indigo" />,
  trade_executed: <CheckCircle size={16} className="text-hype-green" />,
  new_ipo: <Rocket size={16} className="text-hype-gold" />,
  fundraising_closed: <AlertCircle size={16} className="text-hype-purple" />,
}

const notifBg = {
  price_up: 'bg-hype-green/10',
  price_down: 'bg-hype-red/10',
  creator_update: 'bg-hype-indigo/10',
  trade_executed: 'bg-hype-green/10',
  new_ipo: 'bg-hype-gold/10',
  fundraising_closed: 'bg-hype-purple/10',
}

export default function NotificationsPage() {
  const unread = notifications.filter(n => !n.isRead)
  const read = notifications.filter(n => n.isRead)

  return (
    <div className="px-4 pt-4 pb-2 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-hype-text font-bold text-xl">Notifications</h1>
        {unread.length > 0 && (
          <button className="text-hype-gold text-xs font-medium hover:underline">
            Mark all read
          </button>
        )}
      </div>

      {unread.length > 0 && (
        <div>
          <p className="text-hype-muted text-[10px] font-semibold mb-2 uppercase tracking-wider">New</p>
          <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border">
            {unread.map(notif => (
              <div key={notif.id} className="flex items-start gap-3 px-4 py-3.5 bg-hype-surface-2/50">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', notifBg[notif.type])}>
                  {notifIcons[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-hype-text text-sm font-semibold">{notif.title}</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-hype-gold flex-shrink-0 mt-2" />
                  </div>
                  <p className="text-hype-secondary text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-hype-dim text-[10px] mt-1">{formatTimeAgo(notif.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <p className="text-hype-muted text-[10px] font-semibold mb-2 uppercase tracking-wider">Earlier</p>
          <div className="premium-card rounded-2xl overflow-hidden divide-y divide-hype-border">
            {read.map(notif => (
              <div key={notif.id} className="flex items-start gap-3 px-4 py-3.5">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 opacity-50', notifBg[notif.type])}>
                  {notifIcons[notif.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-hype-secondary text-sm font-medium">{notif.title}</p>
                  <p className="text-hype-muted text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-hype-dim text-[10px] mt-1">{formatTimeAgo(notif.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="text-center py-16">
          <Bell size={40} className="text-hype-dim mx-auto mb-3" />
          <p className="text-hype-text font-semibold mb-1">No notifications</p>
          <p className="text-hype-secondary text-sm">You&apos;re all caught up!</p>
        </div>
      )}
    </div>
  )
}
