export default function MarketplaceLoading() {
  return (
    <div className="container-page space-y-8 py-8 sm:py-12 animate-enter-up">
      {/* Hero Skeleton */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
        <div className="space-y-4 max-w-xl">
          <div className="h-6 w-36 rounded-full animate-shimmer" />
          <div className="h-10 w-3/4 rounded-xl animate-shimmer" />
          <div className="h-5 w-full rounded-lg animate-shimmer" />
        </div>

        <div className="mt-8 flex gap-4 border-b border-border pb-3">
          <div className="h-8 w-28 rounded-lg animate-shimmer" />
          <div className="h-8 w-28 rounded-lg animate-shimmer" />
        </div>
      </div>

      {/* Main Content Layout Skeleton */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-72 xl:w-80 shrink-0 space-y-6 rounded-2xl border border-border bg-surface p-5">
          <div className="h-6 w-24 rounded-lg animate-shimmer" />
          <div className="h-10 w-full rounded-xl animate-shimmer" />
          <div className="space-y-2 pt-2">
            <div className="h-4 w-20 rounded-md animate-shimmer" />
            <div className="h-10 w-full rounded-xl animate-shimmer" />
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-4 w-24 rounded-md animate-shimmer" />
            <div className="space-y-1.5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-full rounded-lg animate-shimmer" />
              ))}
            </div>
          </div>
        </div>

        {/* Listings Skeleton */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Toolbar Skeleton */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="h-5 w-44 rounded-lg animate-shimmer" />
            <div className="h-8 w-20 rounded-xl animate-shimmer" />
          </div>

          {/* Cards Grid Skeleton */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-surface"
              >
                <div className="aspect-4/3 w-full animate-shimmer" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-3/4 rounded-lg animate-shimmer" />
                  <div className="h-4 w-full rounded-md animate-shimmer" />
                  <div className="h-4 w-1/2 rounded-md animate-shimmer" />
                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div className="h-6 w-20 rounded-md animate-shimmer" />
                    <div className="h-8 w-8 rounded-xl animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
