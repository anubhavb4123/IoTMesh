import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Bot, Users } from "lucide-react";

import { database } from "@/lib/firebase";
import { ref, push, onValue } from "firebase/database";

export default function Telegram() {
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");

  // 🔹 SAVE USER TO FIREBASE
  const handleSave = async () => {
    if (!name.trim() || !chatId.trim()) {
      toast.error("Name and Chat ID are required");
      return;
    }

  try {
    await push(ref(database, "telegram/subscribers"), {
      name,
      chatId,
      createdAt: Date.now(),
    });

    toast.success("Subscriber saved!");
    setName("");
    setChatId("");
  } catch (err) {
    console.error("Firebase save error:", err);
    toast.error("Failed to save subscriber");
  }
};

  return (
    <Layout>
      <div className="space-y-6 pb-5">

        {/* ================= HEADER ================= */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            Telegram Alerts
          </h1>
          <p className="text-muted-foreground mt-1">
            Subscribe users to receive system alerts on Telegram
          </p>
        </div>

        {/* ================= QR CODE ================= */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Connect Telegram Bot
            </CardTitle>
            <CardDescription>
              Scan QR code → Start bot → Get your Chat ID
            </CardDescription>
          </CardHeader>

          <CardContent className="h-auto flex flex-col items-center gap-4">
            <img
              src="/telegram-qr.png"
              alt="Telegram Bot QR"
              className="h-60 w-60 object-contain"
            />
            <p className="text-sm text-muted-foreground text-center">
              Open Telegram, press <b>Start</b>, the bot will reply with your Chat ID
            </p>
          </CardContent>
        </Card>

        {/* ================= SUBSCRIBE FORM ================= */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Subscribe for Alerts
            </CardTitle>
            <CardDescription>
              Enter your name and Telegram Chat ID
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Telegram Chat ID</Label>
              <Input
                placeholder="123456789"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get it by sending <b>/start</b> to the bot
              </p>
            </div>

            <Button onClick={handleSave} className="w-full">
              Enable Alerts
            </Button>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}