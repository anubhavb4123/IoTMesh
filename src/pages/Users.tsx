import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon, Shield, User, Trash2 } from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, remove } from "firebase/database";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: string;
  name: string;
  role: string;
  timestamp: number;
}

interface TelegramSubscriber {
  id: string;
  name: string;
  chatId: string;
  createdAt: number;
}

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<TelegramSubscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);

  const { role: currentUserRole } = useAuth();

  useEffect(() => {
    const usersRef = ref(database, "home/users");

    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const data = snapshot.val();

      const list: UserProfile[] = Object.keys(data).map((id) => ({
        id,
        ...data[id],
      }));

      // latest first
      list.sort((a, b) => b.timestamp - a.timestamp);

      setUsers(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const subsRef = ref(database, "telegram/subscribers");

  const unsub = onValue(subsRef, (snapshot) => {
    if (!snapshot.exists()) {
      setSubscribers([]);
      setLoadingSubs(false);
      return;
    }

    const data = snapshot.val();
    const list: TelegramSubscriber[] = Object.keys(data).map((id) => ({
      id,
      ...data[id],
    }));

    list.sort((a, b) => b.createdAt - a.createdAt);
    setSubscribers(list);
    setLoadingSubs(false);
  });

  return () => unsub();
}, []);

  const deleteUser = async (id: string) => {
    if (currentUserRole !== "admin") {
      toast.error("Only admin can delete users!");
      return;
    }

    await remove(ref(database, `home/users/${id}`));
    toast.success("User deleted");
  };

  const deleteSubscriber = async (id: string) => {
    if (currentUserRole !== "admin") {
      toast.error("Only admin can remove subscribers!");
      return;
    }

    await remove(ref(database, `telegram/subscribers/${id}`));
    toast.success("Subscriber removed");
  };

  const getRoleBadge = (role: string) => {
    const Icon = role === "admin" ? Shield : User;

    return (
      <Badge variant={role === "admin" ? "destructive" : "secondary"} className="gap-1 capitalize">
        <Icon className="h-3 w-3" />
        {role}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>

        <Card className="border-border/50 bg-card/50">
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
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No users found</TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>{new Date(u.timestamp).toLocaleString()}</TableCell>

                    {currentUserRole === "admin" && (
                      <TableCell className="text-right">
                        <Trash2
                          onClick={() => deleteUser(u.id)}
                          className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
        {/* ================= TELEGRAM SUBSCRIBERS ================= */}
        <Card className="border-border/50 bg-card/50">
          <h2 className="text-xl font-semibold px-6 pt-6 flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Telegram Subscribers
          </h2>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Chat ID</TableHead>
                <TableHead>Subscribed At</TableHead>
                {currentUserRole === "admin" && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loadingSubs ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No Telegram subscribers
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.chatId}
                    </TableCell>
                    <TableCell>
                      {new Date(s.createdAt).toLocaleString()}
                    </TableCell>

                    {currentUserRole === "admin" && (
                      <TableCell className="text-right">
                        <Trash2
                          onClick={() => deleteSubscriber(s.id)}
                          className="h-5 w-5 text-red-500 cursor-pointer hover:text-red-700"
                        />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </Layout>
  );
}