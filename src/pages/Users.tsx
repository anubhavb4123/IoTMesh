import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, Shield, User, Trash2 } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, remove } from "firebase/database";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

interface UserProfile { id: string; name: string; role: string; timestamp: number; }
interface TelegramSubscriber { id: string; name: string; chatId: string; createdAt: number; }

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<TelegramSubscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const { role: currentUserRole } = useAuth();

  useEffect(() => {
    const unsub = onValue(ref(database, "home/users"), (snapshot) => {
      if (!snapshot.exists()) { setUsers([]); setLoading(false); return; }
      const data = snapshot.val();
      const list: UserProfile[] = Object.keys(data).map((id) => ({ id, ...data[id] }));
      list.sort((a, b) => b.timestamp - a.timestamp);
      setUsers(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onValue(ref(database, "telegram/subscribers/list"), (snapshot) => {
      if (!snapshot.exists()) { setSubscribers([]); setLoadingSubs(false); return; }
      const data = snapshot.val();
      const list: TelegramSubscriber[] = Object.keys(data).map((id) => ({ id, ...data[id] }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setSubscribers(list);
      setLoadingSubs(false);
    });
    return () => unsub();
  }, []);

  const deleteUser = async (id: string) => {
    if (currentUserRole !== "admin") { toast.error("Only admin can delete users!"); haptic.error(); sounds.error(); return; }
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    await remove(ref(database, `home/users/${id}`));
    toast.success("User deleted");
    sounds.delete();
    haptic.medium();
  };

  const deleteSubscriber = async (id: string) => {
    if (currentUserRole !== "admin") { toast.error("Only admin can remove subscribers!"); sounds.wrongPass(); return; }
    if (!window.confirm("Remove this Telegram subscriber?")) return;
    await remove(ref(database, `telegram/subscribers/list/${id}`));
    toast.success("Subscriber removed");
    sounds.delete();
    haptic.medium();
  };

  const getRoleBadge = (role: string) => {
    const Icon = role === "admin" ? Shield : User;
    return (
      <Badge variant={role === "admin" ? "destructive" : "secondary"} className="gap-1 capitalize">
        <Icon className="h-3 w-3" />{role}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div style={{ animation: "fadeSlideIn 0.4s ease both" }}>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            Users
          </h1>
          <p className="text-muted-foreground mt-1">Manage login users and Telegram subscribers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ===== Users table ==== */}
          <Card
            className="border-border/40 bg-card/40"
            style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.1s" }}
          >
            <h2 className="text-xl font-semibold px-6 pt-6 flex items-center gap-2">
              <UsersIcon className="h-5 w-5" /> Users
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Login Time</TableHead>
                  {currentUserRole === "admin" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center animate-pulse">Loading...</TableCell></TableRow>
                ) : users.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No users found</TableCell></TableRow>
                ) : (
                  users.map((u, i) => (
                    <TableRow
                      key={u.id}
                      className="transition-colors hover:bg-white/5"
                      style={{ animation: "fadeSlideIn 0.3s ease both", animationDelay: `${i * 0.03}s` }}
                    >
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>{new Date(u.timestamp).toLocaleString()}</TableCell>
                      {currentUserRole === "admin" && (
                        <TableCell className="text-right">
                          <Trash2 onClick={() => deleteUser(u.id)} className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700 transition-colors" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Telegram subscribers table */}
          <Card
            className="border-border/40 bg-card/40"
            style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.17s" }}
          >
            <h2 className="text-xl font-semibold px-6 pt-6 flex items-center gap-2">
              <UsersIcon className="h-5 w-5" /> Telegram Subscribers
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Chat ID</TableHead>
                  <TableHead>Subscribed At</TableHead>
                  {currentUserRole === "admin" && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSubs ? (
                  <TableRow><TableCell colSpan={4} className="text-center animate-pulse">Loading...</TableCell></TableRow>
                ) : subscribers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center">No Telegram subscribers</TableCell></TableRow>
                ) : (
                  subscribers.map((s, i) => (
                    <TableRow
                      key={s.id}
                      className="transition-colors hover:bg-white/5"
                      style={{ animation: "fadeSlideIn 0.3s ease both", animationDelay: `${i * 0.03}s` }}
                    >
                      <TableCell>{s.name}</TableCell>
                      <TableCell className="font-mono text-sm">{s.chatId}</TableCell>
                      <TableCell>{new Date(s.createdAt).toLocaleString()}</TableCell>
                      {currentUserRole === "admin" && (
                        <TableCell className="text-right">
                          <Trash2 onClick={() => deleteSubscriber(s.id)} className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700 transition-colors" />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
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
