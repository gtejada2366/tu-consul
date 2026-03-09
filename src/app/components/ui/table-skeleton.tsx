export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-alt animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-surface-alt rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-surface-alt rounded animate-pulse w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-surface-alt rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-[12px] p-6 shadow-sm">
      <div className="space-y-4">
        <div className="h-6 bg-surface-alt rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-surface-alt rounded animate-pulse w-full"></div>
        <div className="h-4 bg-surface-alt rounded animate-pulse w-2/3"></div>
      </div>
    </div>
  );
}
