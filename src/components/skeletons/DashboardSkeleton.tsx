import { Layout } from "@/components/Layout";

/* ── Shimmer block ──────────────────────────────────────────── */
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
        animationDelay: `${i * 0.06}s`,
      }}
    >
      <div className="p-4 space-y-3">
        {/* Icon + badge row */}
        <div className="flex items-center justify-between">
          <S className="w-10 h-10 rounded-xl" />
          <S className="w-12 h-5 rounded-lg" />
        </div>
        {/* Value */}
        <S className="w-20 h-8 rounded-lg" />
        {/* Label */}
        <S className="w-24 h-3 rounded" />
      </div>
    </div>
  );
}

/* ── Status row skeleton ────────────────────────────────────── */
function StatusSkel({ i }: { i: number }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-border/20"
      style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${0.55 + i * 0.05}s` }}
    >
      <S className="w-10 h-10 rounded-xl shrink-0" />
      <div className="space-y-1.5 flex-1">
        <S className="w-16 h-2.5 rounded" />
        <S className="w-24 h-3.5 rounded" />
      </div>
    </div>
  );
}

/* ── Full Dashboard Skeleton ────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <Layout>
      <div className="flex flex-col gap-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{ animation: "fadeSlideIn 0.3s ease both" }}
        >
          <div className="flex items-center gap-3">
            <S className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <S className="w-28 h-6 rounded-lg" />
              <S className="w-36 h-3 rounded" />
            </div>
          </div>
          <S className="w-24 h-8 rounded-full" />
        </div>

        {/* Sensor grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 11 }).map((_, i) => (
            <CardSkel key={i} i={i} />
          ))}
        </div>

        {/* System status */}
        <div
          className="rounded-2xl border border-border/30 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.02)",
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.5s",
          }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border/20">
            <S className="w-1.5 h-1.5 rounded-full" />
            <S className="w-24 h-2.5 rounded" />
          </div>
          <div className="grid gap-3 md:grid-cols-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatusSkel key={i} i={i} />
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
