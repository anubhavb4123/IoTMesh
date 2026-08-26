import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, Shield, User, Trash2, Send } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, remove } from "firebase/database";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { UsersSkeleton } from "@/components/skeletons/UsersSkeleton";

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
    if (currentUserRole !== "admin") { toast.error("Only administrators can delete user sessions"); haptic.error(); sounds.error(); return; }
    if (!window.confirm("Remove this user session record?")) return;
    await remove(ref(database, `home/users/${id}`));
    toast.success("User record removed");
    sounds.delete();
    haptic.medium();
  };

  const deleteSubscriber = async (id: string) => {
    if (currentUserRole !== "admin") { toast.error("Only administrators can remove subscribers"); sounds.wrongPass(); return; }
    if (!window.confirm("Unsubscribe this Telegram recipient?")) return;
    await remove(ref(database, `telegram/subscribers/list/${id}`));
    toast.success("Subscriber removed");
    sounds.delete();
    haptic.medium();
  };

  const getRoleBadge = (role: string) => {
    const Icon = role === "admin" ? Shield : User;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
        role === "admin"
          ? "bg-red-500/10 border-red-500/20 text-red-400"
          : "bg-zinc-800 border-zinc-700 text-zinc-300"
      }`}>
        <Icon className="w-3 h-3" />
        {role === "admin" ? "Admin" : "Guest"}
      </span>
    );
  };

  if (loading && loadingSubs) return <UsersSkeleton />;

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-6xl">

        {/* ── Header ── */}
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Access Directory & Telegram Subscribers</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Audit authenticated sessions and emergency alert channels</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Users Table */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-white">Active Login Sessions</h2>
              </div>
              <span className="text-xs font-mono text-zinc-500">{users.length} logged</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800/60 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Name</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Role</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Last Login</TableHead>
                  {currentUserRole === "admin" && <TableHead className="text-right text-zinc-500 text-xs">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-xs text-zinc-500 py-6">No users found</TableCell></TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} className="border-zinc-800/40 hover:bg-zinc-850/40">
                      <TableCell className="font-medium text-xs text-zinc-200">{u.name}</TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell className="text-xs text-zinc-400 font-mono">{new Date(u.timestamp).toLocaleDateString()}</TableCell>
                      {currentUserRole === "admin" && (
                        <TableCell className="text-right">
                          <button onClick={() => deleteUser(u.id)} className="text-zinc-500 hover:text-red-400 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Telegram Subscribers Table */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-semibold text-white">Telegram Dispatch List</h2>
              </div>
              <span className="text-xs font-mono text-zinc-500">{subscribers.length} recipients</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800/60 hover:bg-transparent">
                  <TableHead className="text-zinc-500 text-xs">Recipient</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Chat ID</TableHead>
                  <TableHead className="text-zinc-500 text-xs">Registered</TableHead>
                  {currentUserRole === "admin" && <TableHead className="text-right text-zinc-500 text-xs">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-xs text-zinc-500 py-6">No subscribers registered</TableCell></TableRow>
                ) : (
                  subscribers.map((s) => (
                    <TableRow key={s.id} className="border-zinc-800/40 hover:bg-zinc-850/40">
                      <TableCell className="font-medium text-xs text-zinc-200">{s.name}</TableCell>
                      <TableCell className="text-xs font-mono text-zinc-400">{s.chatId}</TableCell>
                      <TableCell className="text-xs text-zinc-500 font-mono">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                      {currentUserRole === "admin" && (
                        <TableCell className="text-right">
                          <button onClick={() => deleteSubscriber(s.id)} className="text-zinc-500 hover:text-red-400 p-1">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

        </div>

      </div>
    </Layout>
  );
}
