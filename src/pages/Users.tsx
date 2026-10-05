import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Users as UsersIcon,
  Shield,
  User,
  Trash2,
  Send,
  ChevronDown,
  UserPlus,
  CheckCircle2,
  Clock,
  Mail,
  Sparkles,
} from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, remove, update, set } from "firebase/database";
import { toast } from "sonner";
import { useAuth, sanitizeEmailKey, UserRole } from "@/contexts/AuthContext";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { UsersSkeleton } from "@/components/skeletons/UsersSkeleton";
import { cn } from "@/lib/utils";

interface AuthorizedAccount {
  key: string; // sanitized email key in RTDB
  email: string;
  role: UserRole;
  status: "pending" | "active";
  addedAt: number;
  addedBy?: string;
  lastLoginAt?: number;
  uid?: string;
  displayName?: string;
  photoURL?: string;
}

interface TelegramSubscriber {
  id: string;
  name: string;
  chatId: string;
  createdAt: number;
}

export default function Users() {
  const [authorizedAccounts, setAuthorizedAccounts] = useState<AuthorizedAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [subscribers, setSubscribers] = useState<TelegramSubscriber[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const { role: currentUserRole, user: currentUser } = useAuth();

  // New user authorization form state
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("user");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Listen to authorized_users & users in RTDB ──
  useEffect(() => {
    let rawAuth: Record<string, any> = {};
    let rawHomeAuth: Record<string, any> = {};
    let rawUsers: Record<string, any> = {};

    const unsubAuth = onValue(ref(database, "authorized_users"), (authSnap) => {
      rawAuth = authSnap.exists() ? authSnap.val() : {};
      mergeAndSet();
    });

    const unsubHomeAuth = onValue(ref(database, "home/authorized_users"), (authSnap) => {
      rawHomeAuth = authSnap.exists() ? authSnap.val() : {};
      mergeAndSet();
    });

    const unsubUsers = onValue(ref(database, "users"), (usersSnap) => {
      rawUsers = usersSnap.exists() ? usersSnap.val() : {};
      mergeAndSet();
    });

    const mergeAndSet = () => {
      const map: Record<string, AuthorizedAccount> = {};
      const combinedAuth = { ...rawHomeAuth, ...rawAuth };

      // 1. Process authorized_users entries
      Object.entries(combinedAuth).forEach(([key, val]: [string, any]) => {
        if (!val || !val.email) return;
        map[val.email.toLowerCase()] = {
          key,
          email: val.email,
          role: (val.role as UserRole) || "user",
          status: val.status || "pending",
          addedAt: val.addedAt || Date.now(),
          addedBy: val.addedBy || "Admin",
          lastLoginAt: val.lastLoginAt,
        };
      });

      // 2. Process users/{uid} entries to enrich active accounts
      Object.entries(rawUsers).forEach(([uid, u]: [string, any]) => {
        if (!u || !u.email) return;
        const lower = u.email.toLowerCase();
        if (map[lower]) {
          map[lower].uid = uid;
          map[lower].displayName = u.displayName;
          map[lower].photoURL = u.photoURL;
          map[lower].status = "active";
          if (u.role) map[lower].role = u.role;
          if (u.lastLogin) map[lower].lastLoginAt = u.lastLogin;
        } else {
          // Pre-existing user in users node
          const key = sanitizeEmailKey(lower);
          map[lower] = {
            key,
            email: u.email,
            role: (u.role as UserRole) || "user",
            status: "active",
            addedAt: u.createdAt || Date.now(),
            addedBy: "System",
            uid,
            displayName: u.displayName,
            photoURL: u.photoURL,
            lastLoginAt: u.lastLogin,
          };
        }
      });

      const list = Object.values(map);
      list.sort((a, b) => (b.lastLoginAt || b.addedAt || 0) - (a.lastLoginAt || a.addedAt || 0));
      setAuthorizedAccounts(list);
      setLoadingAccounts(false);
    };

    return () => {
      unsubAuth();
      unsubHomeAuth();
      unsubUsers();
    };
  }, []);

  // ── Load Telegram subscribers ──
  useEffect(() => {
    const unsub = onValue(ref(database, "telegram/subscribers/list"), (snapshot) => {
      if (!snapshot.exists()) {
        setSubscribers([]);
        setLoadingSubs(false);
        return;
      }
      const data = snapshot.val();
      const list: TelegramSubscriber[] = Object.keys(data).map((id) => ({ id, ...data[id] }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setSubscribers(list);
      setLoadingSubs(false);
    });
    return () => unsub();
  }, []);

  // ── Authorize new Gmail address ──
  const handleAuthorizeUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentUserRole !== "admin") {
      toast.error("Administrator access required to authorize users");
      sounds.error();
      haptic.error();
      return;
    }

    const emailTrimmed = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      toast.error("Please enter a valid Gmail address");
      sounds.error();
      haptic.error();
      return;
    }

    const key = sanitizeEmailKey(emailTrimmed);

    // Check if already authorized
    if (authorizedAccounts.some((acc) => acc.email.toLowerCase() === emailTrimmed)) {
      toast.info(`${emailTrimmed} is already on the authorized list.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const record = {
        email: emailTrimmed,
        role: newRole,
        status: "pending",
        addedAt: Date.now(),
        addedBy: currentUser?.email || "Admin",
      };

      await Promise.allSettled([
        set(ref(database, `authorized_users/${key}`), record),
        set(ref(database, `home/authorized_users/${key}`), record),
      ]);

      sounds.success?.();
      haptic.success();
      toast.success(`Authorized ${emailTrimmed}!`, {
        description: `They can now sign in via Google OAuth with '${newRole.toUpperCase()}' privileges.`,
      });
      setNewEmail("");
      setNewRole("user");
    } catch (err: any) {
      sounds.wrongPass();
      haptic.error();
      toast.error("Failed to authorize user", {
        description: err?.message || "Check permissions and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle role for a user ──
  const toggleRole = async (acc: AuthorizedAccount) => {
    if (currentUserRole !== "admin") {
      toast.error("Only administrators can modify user roles");
      sounds.error();
      haptic.error();
      return;
    }

    if (acc.email.toLowerCase() === currentUser?.email?.toLowerCase()) {
      toast.error("You cannot change your own administrator role");
      sounds.error();
      haptic.error();
      return;
    }

    const newRoleValue: UserRole = acc.role === "admin" ? "user" : "admin";

    // Update in authorized_users and home/authorized_users
    await Promise.allSettled([
      update(ref(database, `authorized_users/${acc.key}`), { role: newRoleValue }),
      update(ref(database, `home/authorized_users/${acc.key}`), { role: newRoleValue }),
    ]);

    // Also update in users/{uid} if user has already logged in
    if (acc.uid) {
      await update(ref(database, `users/${acc.uid}`), { role: newRoleValue });
    }

    toast.success(`${acc.email} is now ${newRoleValue === "admin" ? "an Administrator" : "a Standard User"}`);
    sounds.success?.();
    haptic.success();
  };

  // ── Revoke authorization / Delete user ──
  const handleRevokeUser = async (acc: AuthorizedAccount) => {
    if (currentUserRole !== "admin") {
      toast.error("Only administrators can revoke authorizations");
      haptic.error();
      sounds.error();
      return;
    }

    if (acc.email.toLowerCase() === currentUser?.email?.toLowerCase()) {
      toast.error("You cannot remove your own administrator account");
      sounds.error();
      return;
    }

    if (!window.confirm(`Revoke Google OAuth access for ${acc.email}? They will no longer be able to sign in.`)) {
      return;
    }

    try {
      // Remove from both authorized_users and home/authorized_users
      await Promise.allSettled([
        remove(ref(database, `authorized_users/${acc.key}`)),
        remove(ref(database, `home/authorized_users/${acc.key}`)),
      ]);

      // Also remove from users/{uid} if present
      if (acc.uid) {
        await remove(ref(database, `users/${acc.uid}`));
      }

      toast.success(`Revoked authorization for ${acc.email}`);
      sounds.delete?.();
      haptic.medium();
    } catch (err: any) {
      toast.error("Failed to revoke access: " + (err?.message || "Error"));
    }
  };

  const deleteSubscriber = async (id: string) => {
    if (currentUserRole !== "admin") {
      toast.error("Only administrators can remove subscribers");
      sounds.wrongPass();
      return;
    }
    if (!window.confirm("Unsubscribe this Telegram recipient?")) return;
    await remove(ref(database, `telegram/subscribers/list/${id}`));
    toast.success("Subscriber removed");
    sounds.delete?.();
    haptic.medium();
  };

  const getRoleBadge = (role: string) => {
    const Icon = role === "admin" ? Shield : User;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
          role === "admin"
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-[#edece8] border-black/[0.08] text-[#18191c]"
        }`}
      >
        <Icon className="w-3 h-3" />
        {role === "admin" ? "Admin" : "User"}
      </span>
    );
  };

  const getStatusBadge = (status: "pending" | "active") => {
    if (status === "active") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 border border-amber-200 text-amber-700">
        <Clock className="w-2.5 h-2.5" />
        Pending Login
      </span>
    );
  };

  if (loadingAccounts && loadingSubs) return <UsersSkeleton />;

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-[1440px] mx-auto">

        {/* ── Page Header ── */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
              Google OAuth Whitelist &amp; User Directory
            </h1>
            <p className="text-xs text-[#797a82] mt-0.5">
              Authorize Gmail addresses for passwordless Google OAuth access and assign system privileges
            </p>
          </div>
        </div>

        {/* ── Admin: Authorize New Gmail Card ── */}
        {currentUserRole === "admin" && (
          <div className="clay-card p-6 shadow-md border border-black/[0.08] bg-gradient-to-r from-white via-white to-[#edece8]/40 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#18191c] text-white flex items-center justify-center shadow-md">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#18191c]">
                  Authorize New User (Gmail)
                </h2>
                <p className="text-xs text-[#797a82]">
                  Add a user&apos;s Gmail address to allow them to sign in via Google OAuth without a password
                </p>
              </div>
            </div>

            <form onSubmit={handleAuthorizeUser} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
              {/* Email Input */}
              <div className="md:col-span-6 relative">
                <Input
                  type="email"
                  placeholder="colleague@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] placeholder:text-[#9b9a94] rounded-xl h-11 pl-9"
                />
                <Mail className="w-4 h-4 text-[#797a82] absolute left-3 top-3.5" />
              </div>

              {/* Role Selector */}
              <div className="md:col-span-3 flex items-center p-1 rounded-xl bg-[#edece8] border border-black/[0.06] shadow-inner h-11">
                <button
                  type="button"
                  onClick={() => setNewRole("user")}
                  className={cn(
                    "flex-1 h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    newRole === "user"
                      ? "bg-white text-[#18191c] shadow-sm"
                      : "text-[#797a82] hover:text-[#18191c]"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  Standard User
                </button>
                <button
                  type="button"
                  onClick={() => setNewRole("admin")}
                  className={cn(
                    "flex-1 h-full rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    newRole === "admin"
                      ? "bg-[#18191c] text-white shadow-sm"
                      : "text-[#797a82] hover:text-[#18191c]"
                  )}
                >
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  Admin
                </button>
              </div>

              {/* Submit Button */}
              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full clay-btn-dark h-11 text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Authorize Gmail</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Tables Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Authorized Google Accounts Table */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#edece8] flex items-center justify-center text-[#18191c]">
                  <UsersIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#18191c]">Authorized Accounts</h2>
                  <p className="text-[10px] text-[#797a82]">Google OAuth Whitelist</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#797a82]">
                {authorizedAccounts.length} authorized
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-black/[0.06] hover:bg-transparent">
                  <TableHead className="text-[#797a82] text-xs font-bold">Gmail / User</TableHead>
                  <TableHead className="text-[#797a82] text-xs font-bold">Status</TableHead>
                  <TableHead className="text-[#797a82] text-xs font-bold">Role</TableHead>
                  {currentUserRole === "admin" && (
                    <TableHead className="text-right text-[#797a82] text-xs font-bold">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {authorizedAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-[#797a82] py-8">
                      No authorized accounts found. Authorize a Gmail address above.
                    </TableCell>
                  </TableRow>
                ) : (
                  authorizedAccounts.map((acc) => {
                    const isSelf = acc.email.toLowerCase() === currentUser?.email?.toLowerCase();

                    return (
                      <TableRow
                        key={acc.key}
                        className={cn(
                          "border-black/[0.04] hover:bg-white/80 transition-colors",
                          isSelf && "bg-emerald-50/40"
                        )}
                      >
                        <TableCell className="font-bold text-xs text-[#18191c]">
                          <div className="flex items-center gap-2">
                            {acc.photoURL ? (
                              <img
                                src={acc.photoURL}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover shrink-0 border border-black/[0.08]"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#edece8] text-[#18191c] flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                                {acc.email[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate max-w-[150px] sm:max-w-[200px]">
                                {acc.email}
                                {isSelf && (
                                  <span className="ml-1 text-[9px] font-mono text-emerald-600 font-bold">(you)</span>
                                )}
                              </p>
                              {acc.displayName && (
                                <p className="text-[10px] text-[#797a82] font-normal truncate">
                                  {acc.displayName}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(acc.status)}</TableCell>
                        <TableCell>
                          {currentUserRole === "admin" && !isSelf ? (
                            <button
                              type="button"
                              onClick={() => toggleRole(acc)}
                              title={`Click to change role to ${acc.role === "admin" ? "Standard User" : "Administrator"}`}
                              className="cursor-pointer group flex items-center gap-1.5 hover:opacity-85 transition-opacity"
                            >
                              {getRoleBadge(acc.role)}
                              <span className="text-[10px] text-[#797a82] group-hover:text-[#18191c] font-mono underline decoration-dotted">
                                change
                              </span>
                            </button>
                          ) : (
                            getRoleBadge(acc.role)
                          )}
                        </TableCell>
                        {currentUserRole === "admin" && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => toggleRole(acc)}
                                  title={acc.role === "admin" ? "Demote to Standard User" : "Promote to Administrator"}
                                  className={cn(
                                    "px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-xs",
                                    acc.role === "admin"
                                      ? "bg-[#edece8] border-black/[0.08] text-[#55565d] hover:bg-white"
                                      : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                  )}
                                >
                                  {acc.role === "admin" ? (
                                    <>
                                      <User className="w-3 h-3" />
                                      <span>Make User</span>
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="w-3 h-3 text-red-500" />
                                      <span>Make Admin</span>
                                    </>
                                  )}
                                </button>
                              )}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeUser(acc)}
                                  title="Revoke Google OAuth Authorization"
                                  className="text-[#797a82] hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Telegram Subscribers Table */}
          <div className="clay-card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#edece8] flex items-center justify-center text-[#18191c]">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#18191c]">Telegram Dispatch List</h2>
                  <p className="text-[10px] text-[#797a82]">Instant Hardware Alert Recipients</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-[#797a82]">
                {subscribers.length} recipients
              </span>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-black/[0.06] hover:bg-transparent">
                  <TableHead className="text-[#797a82] text-xs font-bold">Recipient</TableHead>
                  <TableHead className="text-[#797a82] text-xs font-bold">Chat ID</TableHead>
                  <TableHead className="text-[#797a82] text-xs font-bold">Registered</TableHead>
                  {currentUserRole === "admin" && (
                    <TableHead className="text-right text-[#797a82] text-xs font-bold">Action</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-[#797a82] py-8">
                      No Telegram subscribers registered
                    </TableCell>
                  </TableRow>
                ) : (
                  subscribers.map((s) => (
                    <TableRow key={s.id} className="border-black/[0.04] hover:bg-white/80">
                      <TableCell className="font-bold text-xs text-[#18191c]">{s.name}</TableCell>
                      <TableCell className="text-xs font-mono font-bold text-[#55565d]">{s.chatId}</TableCell>
                      <TableCell className="text-xs text-[#797a82] font-mono">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </TableCell>
                      {currentUserRole === "admin" && (
                        <TableCell className="text-right">
                          <button
                            type="button"
                            onClick={() => deleteSubscriber(s.id)}
                            className="text-[#797a82] hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
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
