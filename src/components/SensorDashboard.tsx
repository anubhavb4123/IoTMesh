import { useSensorData } from '@/hooks/useSensorData';
import { useDeviceControls } from '@/hooks/useDeviceControls';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Wind, CloudRain, Lightbulb, Fan, Activity, DoorOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

// =============== TIME AGO FUNCTION ==================
function getTimeAgo(timestamp?: number) {
  if (!timestamp) return "No data";

  const diffSec = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  return `${Math.floor(diffSec / 3600)}h ago`;
}

export default function SensorDashboard() {
  const { sensorData, loading: sensorLoading, error: sensorError } = useSensorData();
  const { controlData, loading: controlLoading, error: controlError, updateDeviceState } = useDeviceControls();

  
  const handleToggleLight = () => {
    if (controlData?.light !== undefined) {
      updateDeviceState('light', !controlData.light);
    }
  };

  const handleToggleFan = () => {
    if (controlData?.fan !== undefined) {
      updateDeviceState('fan', !controlData.fan);
    }
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
          <p className="text-destructive">
            Error loading data: {sensorError || controlError}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* =================== SENSOR CARDS =================== */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensorData?.temperature ?? '--'}°C</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humidity</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensorData?.humidity ?? '--'}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pressure</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensorData?.pressure ?? '--'} hPa</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water Level</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensorData?.WaterLevel ?? '--'} cm</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Level</CardTitle>
            <Wind className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sensorData?.gas ?? '--'} ppm</div>
          </CardContent>
        </Card>

        <Card>
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

        <Card>
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

        <Card>
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

      {/* =================== DEVICE CONTROLS =================== */}
      <div className="grid gap-4 md:grid-cols-2">

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Light Control
            </CardTitle>
            <CardDescription>Control the main room light</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleToggleLight}
              variant={controlData?.light ? "default" : "outline"}
              className="w-full"
            >
              {controlData?.light ? "Turn Off" : "Turn On"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fan className="h-5 w-5" />
              Fan Control
            </CardTitle>
            <CardDescription>Control the ceiling fan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleToggleFan}
              variant={controlData?.fan ? "default" : "outline"}
              className="w-full"
            >
              {controlData?.fan ? "Turn Off" : "Turn On"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}