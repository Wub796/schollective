export default function LoadingDashboard() {
  return (
    <div className="py-12 flex flex-col gap-12 max-w-5xl mx-auto w-full">
      {/* Header skeleton */}
      <div className="flex flex-col gap-3">
        <div className="w-20 h-2 rounded bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
        <div className="w-80 max-w-[80%] h-11 rounded-lg bg-slate-200/60 dark:bg-slate-800/90 animate-pulse" />
        <div className="w-60 max-w-[60%] h-4 rounded bg-slate-200/50 dark:bg-slate-800/60 animate-pulse" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md flex flex-col gap-3"
          >
            <div className="w-16 h-9 rounded-md bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
            <div className="w-20 h-2.5 rounded bg-slate-200/50 dark:bg-slate-800/60 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-200/60 dark:bg-slate-800" />

      {/* Content cards skeleton */}
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
