import { Layout } from "@/components/Layout";

const S = ({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`skeleton-shimmer rounded-xl ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", ...style }}
  />
);

/* ── Alert row skeleton ─────────────────────────────────────── */
function AlertRowSkel({ i }: { i: number }) {
  return (
    <div
      className="flex items-start gap-4 px-5 py-3.5 border-b border-border/10"
      style={{
        animation: "fadeSlideIn 0.3s ease both",
        animationDelay: `${0.15 + i * 0.04}s`,
      }}
    >
      {/* Icon */}
      <S className="w-8 h-8 rounded-lg shrink-0" />
      {/* Content */}
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <S className="w-12 h-3.5 rounded" />
          <S className="w-14 h-4 rounded" />
        </div>
        <S className="w-full max-w-xs h-3 rounded" />
      </div>
      {/* Time */}
      <div className="text-right space-y-1 shrink-0">
        <S className="w-14 h-3.5 rounded" />
        <S className="w-10 h-2.5 rounded" />
      </div>
    </div>
  );
}

/* ── Full Alerts Skeleton ───────────────────────────────────── */
export function AlertsSkeleton() {
  return (
    <Layout>
      <div className="space-y-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ animation: "fadeSlideIn 0.3s ease both" }}>
          <div className="flex items-center gap-3">
            <S className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <S className="w-24 h-6 rounded-lg" />
              <S className="w-36 h-3 rounded" />
            </div>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2 flex-wrap" style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.05s" }}>
          {[1, 2, 3, 4].map((i) => (
            <S key={i} className="w-20 h-7 rounded-full" />
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex gap-1.5 flex-wrap" style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.1s" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <S key={i} className="w-16 h-7 rounded-lg" />
          ))}
        </div>

        {/* Alert list */}
        <div
          className="rounded-2xl border border-border/30 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.02)",
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.15s",
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <AlertRowSkel key={i} i={i} />
          ))}
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
