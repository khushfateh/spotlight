'use client'

import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="px-4 pt-4 pb-28 space-y-5">
      <h1 className="text-hype-text font-bold text-xl">Notifications</h1>

      <div className="text-center py-16">
        <Bell size={40} className="text-hype-dim mx-auto mb-3" />
        <p className="text-hype-text font-semibold mb-1">No notifications yet</p>
        <p className="text-hype-secondary text-sm">You&apos;re all caught up!</p>
      </div>
    </div>
  )
}
