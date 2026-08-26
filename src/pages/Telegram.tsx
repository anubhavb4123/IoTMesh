import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Bot, QrCode, Send } from "lucide-react";
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
        toast.success("Subscriber added to alert channel");
        sounds.loginSuccess();
        haptic.success();
        setName("");
        setChatId("");
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to register subscriber");
      sounds.wrongPass();
      haptic.error();
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-4xl">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Telegram Emergency Dispatch</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure instant push alert delivery for hardware critical triggers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Connect QR card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-white">1. Link Telegram Bot</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Scan the QR code or message the bot, then send <strong>/start</strong> to obtain your unique Chat ID.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-950 border border-zinc-800 my-2">
              <img src="/telegram-qr.png" alt="Telegram Bot QR" className="h-44 w-44 object-contain rounded-lg invert-[0.05]" />
              <p className="text-[11px] font-mono text-zinc-500 mt-3">@IoTMesh_Alert_Bot</p>
            </div>

            <p className="text-[11px] text-zinc-500 text-center">
              The bot sends instant push notifications on critical gas leaks, motion breaches, and door triggers.
            </p>
          </div>

          {/* Registration form card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-white">2. Register Recipient</h2>
              </div>
              <p className="text-xs text-zinc-400">
                Add your recipient credentials to enable automated alert dispatch.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Recipient Name</Label>
                <Input
                  placeholder="e.g. John Doe (Homeowner)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs text-white rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Telegram Chat ID</Label>
                <Input
                  placeholder="e.g. 987654321"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-xs font-mono text-white rounded-xl"
                />
                <p className="text-[10px] text-zinc-500">Numerical ID provided by the Telegram bot</p>
              </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium rounded-xl mt-4"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Save & Enable Alerts
            </Button>
          </div>

        </div>

      </div>
    </Layout>
  );
}
