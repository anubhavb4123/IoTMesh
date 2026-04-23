import { Layout } from "@/components/Layout";

const S = ({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) => (
  <div
    className={`skeleton-shimmer rounded-xl ${className}`}
    style={{ background: "rgba(255,255,255,0.04)", ...style }}
  />
);

/* ── Device toggle row skeleton ─────────────────────────────── */
function DeviceRowSkel() {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <S className="w-9 h-9 rounded-xl" />
        <S className="w-16 h-4 rounded" />
      </div>
      <S className="w-11 h-6 rounded-full" />
    </div>
  );
}

/* ── Room card skeleton ─────────────────────────────────────── */
function RoomSkel({ i }: { i: number }) {
  return (
    <div
      className="rounded-2xl border border-border/30 p-4 space-y-3"
      style={{
        background: "rgba(255,255,255,0.02)",
        animation: "fadeSlideIn 0.4s ease both",
        animationDelay: `${0.1 + i * 0.07}s`,
      }}
    >
      <S className="w-16 h-5 rounded-lg" />
      <DeviceRowSkel />
      <DeviceRowSkel />
      <DeviceRowSkel />
      {/* Fan slider skeleton */}
      <div className="rounded-xl border border-border/20 px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <S className="w-7 h-7 rounded-lg" />
            <S className="w-16 h-3 rounded" />
          </div>
          <S className="w-14 h-5 rounded-full" />
        </div>
        <S className="w-full h-1.5 rounded-full" style={{ maxWidth: "100%" }} />
      </div>
    </div>
  );
}

/* ── Full Devices Skeleton ──────────────────────────────────── */
export function DevicesSkeleton() {
  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Title */}
        <S className="w-40 h-8 rounded-lg" />

        {/* Shortcuts card */}
        <div
          className="rounded-2xl border border-border/30 p-4 space-y-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.05s",
          }}
        >
          <S className="w-20 h-5 rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <S className="w-9 h-9 rounded-xl" />
                  <S className="w-20 h-4 rounded" />
                </div>
                <S className="w-11 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Room cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <RoomSkel key={i} i={i} />
          ))}
        </div>

        {/* Common Areas */}
        <div
          className="rounded-2xl border border-border/30 p-4 space-y-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.31s",
          }}
        >
          <S className="w-28 h-5 rounded" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <DeviceRowSkel key={i} />
            ))}
          </div>
        </div>

        {/* Relay Controls */}
        <div
          className="rounded-2xl border border-border/30 p-4 space-y-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.38s",
          }}
        >
          <S className="w-28 h-5 rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <DeviceRowSkel key={i} />
            ))}
          </div>
        </div>

        {/* Security */}
        <div
          className="rounded-2xl border border-border/30 p-4 space-y-4"
          style={{
            background: "rgba(255,255,255,0.02)",
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.45s",
          }}
        >
          <S className="w-20 h-5 rounded" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <DeviceRowSkel key={i} />
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
