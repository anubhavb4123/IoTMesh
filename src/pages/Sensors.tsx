import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { useSensorData } from "@/hooks/useSensorData";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

interface HistoryPoint {
  timestamp: number;
  temperature: number;
  humidity: number;
  gas: number;
  pressure: number;
  waterLevel: number;
  time: string;
}

export default function Sensors() {
  const { sensorData, loading, error } = useSensorData();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [range, setRange] = useState<1 | 12 | 24>(24);
  const [selectedMetric, setSelectedMetric] =
    useState<"temperature" | "humidity" | "gas" | "pressure" | "waterLevel">(
      "temperature"
    );

  // ================= LOAD HISTORY =================
  useEffect(() => {
    const historyRef = ref(database, "home/room1/history/h24");

    const unsubscribe = onValue(historyRef, (snapshot) => {
      if (!snapshot.exists()) {
        setHistory([]);
        return;
      }

      const raw = snapshot.val();

      const arr: HistoryPoint[] = Object.entries(raw).map(
        ([_, item]: any) => {
          // ⭐ FIX: Normalize timestamp (sec → ms)
          const ts =
            item.timestamp < 1e12
              ? item.timestamp * 1000
              : item.timestamp;

          return {
            timestamp: ts,
            temperature: item.temperature ?? 0,
            humidity: item.humidity ?? 0,
            gas: item.gas ?? 0,
            pressure: item.pressure ?? 0,
            waterLevel: item.waterLevel ?? 0,
            time: new Date(ts).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        }
      );

      // Sort oldest → newest
      arr.sort((a, b) => a.timestamp - b.timestamp);
      setHistory(arr);
    });

    return () => unsubscribe();
  }, []);

  // ================= RANGE FILTER =================
  const now = Date.now();
  const filteredHistory = history.filter(
    (item) => now - item.timestamp <= range * 60 * 60 * 1000
  );

  const colors = {
    temperature: "#ef4444",
    humidity: "#3b82f6",
    gas: "#10b981",
    pressure: "#f59e0b",
    waterLevel: "#6366f1"
  };

  if (loading) {
    return (
      <Layout>
        <p>Loading sensor data...</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <p className="text-red-500">Error: {error}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* CURRENT SENSOR CARDS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/50 bg-card/50 p-6">
            <h2>Temperature</h2>
            <p className="text-4xl font-bold text-primary">
              {sensorData?.temperature.toFixed(1)}°C
            </p>
          </Card>

          <Card className="border-border/50 bg-card/50 p-6">
            <h2>Humidity</h2>
            <p className="text-4xl font-bold text-primary">
              {sensorData?.humidity.toFixed(1)}%
            </p>
          </Card>

          <Card className="border-border/50 bg-card/50 p-6">
            <h2>Air Quality</h2>
            <p className="text-4xl font-bold text-primary">
              {sensorData?.gas.toFixed(0)} PPM
            </p>
          </Card>

          <Card className="border-border/50 bg-card/50 p-6">
            <h2>Pressure</h2>
            <p className="text-4xl font-bold text-primary">
              {(sensorData?.pressure ?? 0).toFixed(0)} hPa
            </p>
          </Card>

          <Card className="border-border/50 bg-card/50 p-6">
            <h2>Water Level</h2>
            <p className="text-4xl font-bold text-primary">
              {(sensorData?.WaterLevel ?? 0).toFixed(0)} cm
            </p>
          </Card>
        </div>

        {/* HISTORY GRAPH */}
        <Card className="border-border/50 bg-card/50 p-6">
          <h2 className="text-xl font-semibold mb-4">Historical Data</h2>

          <div className="flex gap-2 mb-4">
            <Button variant={range === 1 ? "default" : "outline"} onClick={() => setRange(1)}>
              Last 1 Hr
            </Button>
            <Button variant={range === 12 ? "default" : "outline"} onClick={() => setRange(12)}>
              Last 12 Hr
            </Button>
            <Button variant={range === 24 ? "default" : "outline"} onClick={() => setRange(24)}>
              Last 24 Hr
            </Button>
          </div>

          <div className="flex gap-2 mb-6">
            <Button variant={selectedMetric === "temperature" ? "default" : "outline"} onClick={() => setSelectedMetric("temperature")}>Temperature</Button>
            <Button variant={selectedMetric === "humidity" ? "default" : "outline"} onClick={() => setSelectedMetric("humidity")}>Humidity</Button>
            <Button variant={selectedMetric === "gas" ? "default" : "outline"} onClick={() => setSelectedMetric("gas")}>Gas</Button>
            <Button variant={selectedMetric === "pressure" ? "default" : "outline"} onClick={() => setSelectedMetric("pressure")}>Pressure</Button>
            <Button variant={selectedMetric === "waterLevel" ? "default" : "outline"} onClick={() => setSelectedMetric("waterLevel")}>Water Level</Button>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  stroke={colors[selectedMetric]}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </Layout>
  );
}