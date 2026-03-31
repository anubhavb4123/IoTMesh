import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Bot } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, set, onValue } from "firebase/database";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

export default function Telegram() {
  const [name, setName] = useState("");
  const [chatId, setChatId] = useState("");

  const handleSave = async () => {
    if (!name.trim() || !chatId.trim()) { toast.error("Name and Chat ID are required"); return; }
    try {
      const metaRef = ref(database, "telegram/subscribers/meta/nextIndex");
      await onValue(metaRef, async (snap) => {
        const index = snap.exists() ? snap.val() : 0;
        await set(ref(database, `telegram/subscribers/list/${index}`), { name, chatId, createdAt: Date.now() });
        await set(metaRef, index + 1);
        toast.success("Subscriber saved!");
        sounds.loginSuccess();
        haptic.success();
        setName("");
        setChatId("");
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save subscriber");
      sounds.wrongPass();
      haptic.error();
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div style={{ animation: "fadeSlideIn 0.4s ease both" }}>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            Telegram Alerts
          </h1>
          <p className="text-muted-foreground mt-1">Subscribe users to receive system alerts on Telegram</p>
        </div>

        {/* QR Code card*/}
        <Card
          className="border-border/40 bg-card/40"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.1s" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Connect Telegram Bot
            </CardTitle>
            <CardDescription>Scan QR code → Start bot → Get your Chat ID</CardDescription>
          </CardHeader>
          <CardContent className="h-auto flex flex-col items-center gap-4">
            <div className="transition-transform duration-300 hover:scale-105">
              <img src="/telegram-qr.png" alt="Telegram Bot QR" className="h-60 w-60 object-contain" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Open Telegram, press <b>Start</b>, the bot will reply with your Chat ID
            </p>
          </CardContent>
        </Card>

        {/* Subscribe form */}
        <Card
          className="border-border/40 bg-card/40"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.18s" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Subscribe for Alerts
            </CardTitle>
            <CardDescription>Enter your name and Telegram Chat ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telegram Chat ID</Label>
              <Input placeholder="123456789" value={chatId} onChange={(e) => setChatId(e.target.value)} />
              <p className="text-xs text-muted-foreground">Get it by sending <b>/start</b> to the bot</p>
            </div>
            <Button onClick={handleSave} className="w-full transition-transform duration-150 active:scale-95">
              Enable Alerts
            </Button>
          </CardContent>
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
