import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="space-y-6 pb-12 max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
            Telegram Emergency Dispatch
          </h1>
          <p className="text-xs text-[#797a82] mt-0.5">
            Configure instant push alert delivery for hardware critical triggers and perimeter alarms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Connect QR card */}
          <div className="clay-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#edece8] flex items-center justify-center text-[#18191c]">
                  <Bot className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#18191c]">1. Link Telegram Bot</h2>
              </div>
              <p className="text-xs text-[#797a82]">
                Scan the QR code or search the bot, then send <strong>/start</strong> to receive your unique Chat ID.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white/90 border border-black/[0.06] my-2 shadow-sm">
              <img src="/telegram-qr.png" alt="Telegram Bot QR" className="h-44 w-44 object-contain rounded-xl" />
              <p className="text-xs font-mono font-bold text-[#18191c] mt-3">@IoTMesh_Alert_Bot</p>
            </div>

            <p className="text-[11px] text-[#797a82] text-center">
              The bot sends instant push notifications on critical gas leaks, motion breaches, and door triggers.
            </p>
          </div>

          {/* Registration form card */}
          <div className="clay-card p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#edece8] flex items-center justify-center text-[#18191c]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#18191c]">2. Register Recipient</h2>
              </div>
              <p className="text-xs text-[#797a82]">
                Add your recipient credentials to enable automated alert dispatch.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#55565d]">Recipient Name</Label>
                <Input
                  placeholder="e.g. John Doe (Homeowner)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#55565d]">Telegram Chat ID</Label>
                <Input
                  placeholder="e.g. 987654321"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="bg-[#edece8] border-black/[0.08] text-xs font-mono font-bold text-[#18191c] rounded-xl"
                />
                <p className="text-[10px] text-[#797a82]">Numerical ID provided by the Telegram bot</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              className="w-full clay-btn-dark text-xs mt-4"
            >
              <Send className="w-3.5 h-3.5 inline mr-1.5" /> Save & Enable Alerts
            </button>
          </div>

        </div>

      </div>
    </Layout>
  );
}
