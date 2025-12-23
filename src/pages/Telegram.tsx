import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Bot, Code } from "lucide-react";

export default function Telegram() {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");

  const handleSave = () => {
    if (!botToken || !chatId) {
      toast.error("Please fill in all fields");
      return;
    }
    
    // In production, save to database
    localStorage.setItem('telegram_bot_token', botToken);
    localStorage.setItem('telegram_chat_id', chatId);
    toast.success("Telegram settings saved!");
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            Telegram Bot
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure Telegram bot for remote control and notifications
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Bot Configuration
              </CardTitle>
              <CardDescription>
                Set up your Telegram bot token and chat ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Get your bot token from @BotFather on Telegram
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-id">Chat ID</Label>
                <Input
                  id="chat-id"
                  type="text"
                  placeholder="123456789"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Get your chat ID from @userinfobot on Telegram
                </p>
              </div>

              <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Supported Commands
              </CardTitle>
              <CardDescription>
                Commands you can send to the bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/status</code>
                  <span className="text-muted-foreground">Get system status</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/temp</code>
                  <span className="text-muted-foreground">Get current temperature</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/humidity</code>
                  <span className="text-muted-foreground">Get current humidity</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/sensors</code>
                  <span className="text-muted-foreground">Get all sensor readings</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/light on|off</code>
                  <span className="text-muted-foreground">Control main light</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/fan on|off</code>
                  <span className="text-muted-foreground">Control ceiling fan</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/lock</code>
                  <span className="text-muted-foreground">Lock the door</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <code className="text-primary">/unlock</code>
                  <span className="text-muted-foreground">Unlock the door</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Webhook Endpoint
              </CardTitle>
              <CardDescription>
                Configure this endpoint in your Telegram bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <code className="block p-4 bg-secondary/50 rounded-lg text-sm break-all">
                {window.location.origin}/api/telegram/webhook
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Use this URL when setting up your webhook with BotFather
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
