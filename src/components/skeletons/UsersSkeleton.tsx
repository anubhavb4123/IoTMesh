import { Layout } from "@/components/Layout";

const S = ({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`skeleton-shimmer rounded-xl ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", ...style }}
  />
);

/* ── Table row skeleton ─────────────────────────────────────── */
function RowSkel({ i, cols }: { i: number; cols: number }) {
  return (
    <div
      className="flex items-center gap-4 px-6 py-3 border-b border-border/10"
      style={{
        animation: "fadeSlideIn 0.3s ease both",
        animationDelay: `${0.15 + i * 0.04}s`,
      }}
    >
      {Array.from({ length: cols }).map((_, c) => (
        <S
          key={c}
          className="h-4 rounded"
          style={{ flex: c === 0 ? 2 : 1, maxWidth: c === cols - 1 ? 40 : undefined }}
        />
      ))}
    </div>
  );
}

/* ── Table skeleton block ───────────────────────────────────── */
function TableSkel({
  title,
  delay,
  rows = 4,
  cols = 4,
}: {
  title: string;
  delay: string;
  rows?: number;
  cols?: number;
}) {
  return (
    <div
      className="rounded-2xl border border-border/30 overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        animation: "fadeSlideIn 0.4s ease both",
        animationDelay: delay,
      }}
    >
      {/* Card header */}
      <div className="px-6 pt-6 pb-3 flex items-center gap-2">
        <S className="w-5 h-5 rounded" />
        <S className="w-20 h-5 rounded" />
      </div>

      {/* Table header row */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-border/20">
        {Array.from({ length: cols }).map((_, c) => (
          <S
            key={c}
            className="h-3 rounded"
            style={{ flex: c === 0 ? 2 : 1, maxWidth: c === cols - 1 ? 40 : undefined }}
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkel key={i} i={i} cols={cols} />
      ))}
    </div>
  );
}

/* ── Full Users Skeleton ────────────────────────────────────── */
export function UsersSkeleton() {
  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div style={{ animation: "fadeSlideIn 0.4s ease both" }}>
          <S className="w-20 h-8 rounded-lg" />
          <S className="w-64 h-4 rounded mt-2" />
        </div>

        {/* Two tables side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkel title="Users" delay="0.1s" rows={5} cols={4} />
          <TableSkel title="Telegram" delay="0.17s" rows={4} cols={4} />
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
