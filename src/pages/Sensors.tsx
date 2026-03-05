import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSensorData } from "@/hooks/useSensorData";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { TooltipProps } from "recharts";

interface HistoryPoint {
  timestamp: number;
  temperature: number;
  humidity: number;
  gas: number;
  pressure: number;
  waterLevel: number;
  time: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg bg-black/80 px-3 py-2 text-white text-sm border border-white/20">
      <p className="font-semibold">🕒 {label}</p>
      <p>{payload[0].name}: <span className="font-bold">{payload[0].value}</span></p>
    </div>
  );
};

export default function Sensors() {
  const { sensorData, loading, error } = useSensorData();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [range, setRange] = useState<1 | 12 | 24>(24);
  const [selectedMetric, setSelectedMetric] = useState<"temperature" | "humidity" | "gas" | "pressure" | "waterLevel">("temperature");

  useEffect(() => {
    const historyRef = ref(database, "home/room1/history/h24");
    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (!snapshot.exists()) { setHistory([]); return; }
      const raw = snapshot.val();
      const arr: HistoryPoint[] = Object.entries(raw).map(([_, item]: any) => {
        const ts = item.timestamp < 1e12 ? item.timestamp * 1000 : item.timestamp;
        return {
          timestamp: ts,
          temperature: item.temperature ?? 0,
          humidity: item.humidity ?? 0,
          gas: item.gas ?? 0,
          pressure: item.pressure ?? 0,
          waterLevel: item.waterLevel ?? 0,
          time: new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };
      });
      arr.sort((a, b) => a.timestamp - b.timestamp);
      setHistory(arr);
    });
    return () => unsubscribe();
  }, []);

  const now = Date.now();
  const filteredHistory = history.filter((item) => now - item.timestamp <= range * 60 * 60 * 1000);

  const colors = { temperature: "#ef4444", humidity: "#3b82f6", gas: "#10b981", pressure: "#f59e0b", waterLevel: "#6366f1" };

  const sensorCards = [
    { label: "Temperature", value: `${sensorData?.temperature.toFixed(1)}°C` },
    { label: "Humidity",    value: `${sensorData?.humidity.toFixed(1)}%` },
    { label: "Air Quality", value: `${sensorData?.gas.toFixed(0)} PPM` },
    { label: "Pressure",    value: `${(sensorData?.pressure ?? 0).toFixed(0)} hPa` },
    { label: "Water Level", value: `${(sensorData?.WaterLevel ?? 0).toFixed(0)} cm` },
  ];

  if (loading) return <Layout><p className="text-muted-foreground animate-pulse">Loading sensor data...</p></Layout>;
  if (error)   return <Layout><p className="text-red-500">Error: {error}</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Current sensor cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sensorCards.map((s, i) => (
            <Card
              key={s.label}
              className="border-border/40 bg-card/40 p-6 hover:border-border/70 transition-all duration-300 hover:scale-[1.02]"
              style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${i * 0.07}s` }}
            >
              <h2 className="text-sm text-muted-foreground mb-1">{s.label}</h2>
              <p className="text-4xl font-bold text-primary">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* History graph */}
        <Card
          className="border-border/40 bg-card/40 p-6"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.35s" }}
        >
          <h2 className="text-xl font-semibold mb-4">Historical Data</h2>

          <div className="flex gap-2 mb-4 flex-wrap">
            {([1, 12, 24] as const).map((r) => (
              <Button key={r} variant={range === r ? "default" : "outline"} onClick={() => setRange(r)}>
                Last {r} Hr
              </Button>
            ))}
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(["temperature", "humidity", "gas", "pressure", "waterLevel"] as const).map((m) => (
              <Button key={m} variant={selectedMetric === m ? "default" : "outline"} onClick={() => setSelectedMetric(m)}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Button>
            ))}
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={selectedMetric} stroke={colors[selectedMetric]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
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
