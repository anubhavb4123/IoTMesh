import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { database } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";

export default function IgnitionControl() {

  const { role } = useAuth();

  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  const holdTimer = useRef<NodeJS.Timeout | null>(null);

  const startHold = () => {

    if (role !== "admin") return;

    setHolding(true);
    setProgress(0);

    let count = 0;

    holdTimer.current = setInterval(() => {

      count += 1;
      setProgress(count);

      if (count >= 5) {

        triggerIgnition();

        if (holdTimer.current) {
          clearInterval(holdTimer.current);
        }

        setHolding(false);
        setProgress(0);
      }

    }, 1000);
  };

  const stopHold = () => {

    setHolding(false);
    setProgress(0);

    if (holdTimer.current) {
      clearInterval(holdTimer.current);
    }
  };

  const triggerIgnition = async () => {
    await set(ref(database, "special/ignition"), 1);
  };

  return (
    <Layout>

      <div className="max-w-3xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-red-400">
          Ignition Control
        </h1>

        <Card className="border-red-500/40 bg-card/40">

          <CardHeader>

            <CardTitle className="text-red-400">
              Ignition System
            </CardTitle>

            <CardDescription>
              Hold the button for 5 seconds to trigger ignition.
              Only admin users can activate this system.
            </CardDescription>

          </CardHeader>

          <CardContent className="flex flex-col gap-4">

            <Button
              disabled={role !== "admin"}
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              className="bg-red-600 hover:bg-red-700 text-white h-14 text-lg"
            >
              {role !== "admin"
                ? "Admin Only"
                : holding
                ? `Hold... ${progress}/5`
                : "Hold 5s to Ignite"}
            </Button>

            {/* Progress Bar */}
            {holding && (
              <div className="w-full bg-white/10 h-2 rounded">
                <div
                  className="bg-red-500 h-2 rounded transition-all"
                  style={{ width: `${progress * 20}%` }}
                />
              </div>
            )}

          </CardContent>

        </Card>

      </div>

    </Layout>
  );
}