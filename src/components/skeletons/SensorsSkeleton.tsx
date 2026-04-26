import { Layout } from "@/components/Layout";

const S = ({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`skeleton-shimmer rounded-xl ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", ...style }}
  />
);

/* ── Sensor card skeleton ───────────────────────────────────── */
function CardSkel({ i }: { i: number }) {
  return (
    <div
      className="rounded-2xl border border-border/30 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        animation: "fadeSlideIn 0.4s ease both",
        animationDelay: `${0.1 + i * 0.06}s`,
      }}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <S className="w-9 h-9 rounded-xl" />
          <S className="w-10 h-4 rounded" />
        </div>
        <S className="w-16 h-8 rounded-lg" />
        <S className="w-20 h-3 rounded" />
      </div>
    </div>
  );
}

/* ── Full Sensors Skeleton ──────────────────────────────────── */
export function SensorsSkeleton() {
  return (
    <Layout>
      <div className="space-y-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Page header */}
        <div className="flex items-center justify-between" style={{ animation: "fadeSlideIn 0.3s ease both" }}>
          <div className="flex items-center gap-3">
            <S className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <S className="w-36 h-6 rounded-lg" />
              <S className="w-32 h-3 rounded" />
            </div>
          </div>
          <S className="w-20 h-8 rounded-full" />
        </div>

        {/* Sensor cards grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkel key={i} i={i} />
          ))}
        </div>

        {/* Chart card */}
        <div
          className="rounded-2xl border border-border/30 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.02)",
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.28s",
          }}
        >
          {/* Chart header */}
          <div className="px-5 pt-4 pb-3 border-b border-border/20 space-y-3">
            {/* Title + range */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <S className="w-1.5 h-4 rounded-full" />
                <S className="w-32 h-4 rounded" />
                <S className="w-14 h-3 rounded" />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((r) => (
                  <S key={r} className="w-10 h-7 rounded-lg" />
                ))}
              </div>
            </div>
            {/* Stats row */}
            <div className="flex gap-4">
              {[1, 2, 3].map((s) => (
                <S key={s} className="w-20 h-5 rounded" />
              ))}
            </div>
            {/* Metric selector */}
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <S key={i} className="w-24 h-7 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Chart area */}
          <div className="px-4 py-4 h-64 flex items-end gap-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer flex-1 rounded-t"
                style={{
                  height: `${20 + Math.sin(i * 0.6) * 30 + Math.random() * 25}%`,
                  background: "rgba(255,255,255,0.03)",
                  animationDelay: `${i * 0.03}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
