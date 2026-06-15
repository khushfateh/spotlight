import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('shimmer rounded-lg', className)} />
}

export function CreatorCardSkeleton() {
  return (
    <div className="premium-card rounded-2xl p-4 space-y-3 min-w-[168px]">
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-2.5 w-20 rounded" />
          <Skeleton className="h-2 w-12 rounded" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-2.5 w-12 rounded" />
      </div>
    </div>
  )
}

export function CreatorRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-2.5 w-24 rounded" />
        <Skeleton className="h-2 w-14 rounded" />
      </div>
      <div className="text-right space-y-1.5">
        <Skeleton className="h-2.5 w-12 rounded ml-auto" />
        <Skeleton className="h-2 w-8 rounded ml-auto" />
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="space-y-0 premium-card rounded-2xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <CreatorRowSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
