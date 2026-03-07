import { useSensorData } from '@/hooks/useSensorData';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Wind, CloudRain, Lightbulb, Fan, Activity, DoorOpen } from 'lucide-react';

export default function SensorDashboard() {
  const { sensorData, loading: sensorLoading, error: sensorError } = useSensorData();
  const { controlData, loading: controlLoading, error: controlError, updateDeviceState } = useDeviceControls();

  const handleToggleLight = () => {
    if (controlData?.room1Light !== undefined) updateDeviceState('room1Light', !controlData.room1Light);
  };
  const handleToggleFan = () => {
    if (controlData?.room1Fan !== undefined) updateDeviceState('room1Fan', !controlData.room1Fan);
  };

  if (sensorLoading || controlLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (sensorError || controlError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Error loading data: {sensorError || controlError}</p>
        </CardContent>
      </Card>
    );
  }

  const sensorCards = [
    { label: "Temperature", value: `${sensorData?.temperature ?? '--'}°C`,  Icon: Thermometer },
    { label: "Humidity",    value: `${sensorData?.humidity ?? '--'}%`,       Icon: Droplets },
    { label: "Pressure",    value: `${sensorData?.pressure ?? '--'} hPa`,    Icon: Wind },
    { label: "Water Level", value: `${sensorData?.WaterLevel ?? '--'} cm`,   Icon: Droplets },
    { label: "Gas Level",   value: `${sensorData?.gas ?? '--'} ppm`,         Icon: Wind },
  ];

  return (
    <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

      {/* Sensor Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sensorCards.map(({ label, value, Icon }, i) => (
          <Card
            key={label}
            className="transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:border-border/70"
            style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${i * 0.07}s` }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}

        {/* Rain */}
        <Card
          className="transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.35s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rain Status</CardTitle>
            <CloudRain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={sensorData?.rain ? "destructive" : "secondary"}>
              {sensorData?.rain ? "Raining" : "Clear"}
            </Badge>
          </CardContent>
        </Card>

        {/* Motion */}
        <Card
          className="transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.42s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Motion</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={sensorData?.motion ? "destructive" : "secondary"}>
              {sensorData?.motion ? "Detected" : "Clear"}
            </Badge>
          </CardContent>
        </Card>

        {/* Door */}
        <Card
          className="transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.49s" }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Door Status</CardTitle>
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={sensorData?.door ? "destructive" : "secondary"}>
              {sensorData?.door ? "Open" : "Closed"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Device Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Light Control", desc: "Control the main room light", Icon: Lightbulb, active: controlData?.room1Light, toggle: handleToggleLight },
          { label: "Fan Control",   desc: "Control the ceiling fan",     Icon: Fan,       active: controlData?.room1Fan,   toggle: handleToggleFan },
        ].map(({ label, desc, Icon, active, toggle }, i) => (
          <Card
            key={label}
            className="transition-all duration-300 hover:border-border/70"
            style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${0.55 + i * 0.07}s` }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />{label}
              </CardTitle>
              <CardDescription>{desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={toggle}
                variant={active ? "default" : "outline"}
                className="w-full transition-transform duration-150 active:scale-95"
              >
                {active ? "Turn Off" : "Turn On"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
