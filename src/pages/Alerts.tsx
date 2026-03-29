import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";

interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  sensor_value: number | null;
  timestamp: number;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const alertRef = ref(database, "home/room1/alerts/logs");
    const unsubscribe = onValue(alertRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data)
          .map(([id, val]: any) => ({ id, ...val }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setAlerts(list);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getSeverityBadge = (severity: string) => {
    const variants = {
      info:     { variant: "secondary" as const,    icon: Info,          label: "Info" },
      warning:  { variant: "default" as const,      icon: AlertTriangle, label: "Warning" },
      error:    { variant: "destructive" as const,  icon: AlertCircle,   label: "Error" },
      critical: { variant: "destructive" as const,  icon: AlertCircle,   label: "Critical" },
    };
    const config = variants[severity as keyof typeof variants] || variants.info;
    const Icon = config.icon; 
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div style={{ animation: "fadeSlideIn 0.4s ease both" }}>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            Alert Log
          </h1>
          <p className="text-muted-foreground mt-1">System alerts and notifications history</p>
        </div>

        {/* Table card */}
        <Card
          className="border-border/40 bg-card/40"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.1s" }}
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground animate-pulse">
                    Loading alerts...
                  </TableCell>
                </TableRow>
              ) : alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert, i) => (
                  <TableRow
                    key={alert.id}
                    className="border-border/50 transition-colors hover:bg-white/5"
                    style={{ animation: "fadeSlideIn 0.3s ease both", animationDelay: `${i * 0.03}s` }}
                  >
                    <TableCell className="text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{alert.alert_type}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell className="text-muted-foreground">{alert.sensor_value ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
