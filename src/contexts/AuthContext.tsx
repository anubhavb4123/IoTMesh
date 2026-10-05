import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, database, googleProvider } from '@/lib/firebase';

// ─────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────
export type UserRole = 'admin' | 'user';

export const MASTER_ADMIN_EMAIL = (
  import.meta.env.VITE_ADMIN_EMAIL || 'anubhavb4123@gmail.com'
).toLowerCase().trim();

export interface AuthorizedUserRecord {
  email: string;
  role: UserRole;
  status: 'pending' | 'active';
  addedAt: number;
  addedBy: string;
  lastLoginAt?: number;
}

/** Sanitize email address for safe use as a Firebase RTDB key */
export const sanitizeEmailKey = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .replace(/\./g, '_dot_')
    .replace(/@/g, '_at_')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
};

interface AuthContextType {
  /** Raw Firebase Auth user (null = not logged in) */
  user: FirebaseUser | null;
  /** Display-friendly name */
  displayName: string;
  /** Role fetched from RTDB */
  role: UserRole;
  /** True while auth state is resolving */
  loading: boolean;
  /** Sign in with Google OAuth popup */
  signInWithGoogle: () => Promise<void>;
  /** Firebase sign-out */
  signOut: () => Promise<void>;
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

// ─────────────────────────────────────────────
// HELPER — derive a friendly display name
// ─────────────────────────────────────────────
const toDisplayName = (fbUser: FirebaseUser): string => {
  if (fbUser.displayName) return fbUser.displayName;
  return fbUser.email?.split('@')[0] ?? 'User';
};

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole>('user');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // ── Listen to Firebase Auth state changes ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const email = firebaseUser.email.toLowerCase().trim();
        const emailKey = sanitizeEmailKey(email);

        // 1. Master administrator bypass
        if (email === MASTER_ADMIN_EMAIL) {
          try {
            const adminRecord = {
              email,
              role: 'admin' as UserRole,
              status: 'active' as const,
              addedAt: Date.now(),
              addedBy: 'SuperAdmin',
              lastLoginAt: Date.now(),
            };
            await Promise.allSettled([
              set(ref(database, `authorized_users/${emailKey}`), adminRecord),
              set(ref(database, `home/authorized_users/${emailKey}`), adminRecord),
              set(ref(database, `users/${firebaseUser.uid}`), {
                email,
                role: 'admin',
                displayName: firebaseUser.displayName || email.split('@')[0],
                photoURL: firebaseUser.photoURL || '',
                lastLogin: Date.now(),
              }),
            ]);
          } catch (e) {
            console.warn('Master admin record sync notice:', e);
          }
          setUser(firebaseUser);
          setRole('admin');
          setDisplayName(toDisplayName(firebaseUser));
          setLoading(false);
          return;
        }

        // 2. Strict Whitelist Check for standard users
        try {
          const [authSnap, homeAuthSnap] = await Promise.all([
            get(ref(database, `authorized_users/${emailKey}`)),
            get(ref(database, `home/authorized_users/${emailKey}`)),
          ]);

          const authData = authSnap.exists()
            ? authSnap.val()
            : homeAuthSnap.exists()
            ? homeAuthSnap.val()
            : null;

          if (!authData) {
            // NOT REGISTERED BY ADMIN: Strict lockout & immediate sign-out
            console.warn(`Unauthorized login attempt by: ${email}`);
            await firebaseSignOut(auth);
            setUser(null);
            setRole('user');
            setDisplayName('');
            setLoading(false);
            return;
          }

          // Registered user
          const userRole = (authData.role || 'user') as UserRole;
          setUser(firebaseUser);
          setRole(userRole);
          setDisplayName(toDisplayName(firebaseUser));
        } catch (err) {
          console.error('Authorization verification error:', err);
          // FAIL-SECURE: Never admit user on error!
          await firebaseSignOut(auth);
          setUser(null);
          setRole('user');
          setDisplayName('');
        }
      } else {
        setUser(null);
        setRole('user');
        setDisplayName('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ── Sign In With Google ──
  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const email = fbUser.email?.toLowerCase().trim();

    if (!email) {
      await firebaseSignOut(auth);
      throw new Error('No email address provided by Google account.');
    }

    const emailKey = sanitizeEmailKey(email);

    // 1. Check if user is the master administrator
    if (email === MASTER_ADMIN_EMAIL) {
      const adminRecord = {
        email,
        role: 'admin' as UserRole,
        status: 'active' as const,
        addedAt: Date.now(),
        addedBy: 'SuperAdmin',
        lastLoginAt: Date.now(),
      };
      await Promise.allSettled([
        set(ref(database, `authorized_users/${emailKey}`), adminRecord),
        set(ref(database, `home/authorized_users/${emailKey}`), adminRecord),
        set(ref(database, `users/${fbUser.uid}`), {
          email,
          role: 'admin',
          displayName: fbUser.displayName || email.split('@')[0],
          photoURL: fbUser.photoURL || '',
          lastLogin: Date.now(),
        }),
      ]);
      setUser(fbUser);
      setRole('admin');
      setDisplayName(toDisplayName(fbUser));
      return;
    }

    // 2. Strict Whitelist Check: Must be added by admin in authorized_users
    const [authSnap, homeAuthSnap] = await Promise.all([
      get(ref(database, `authorized_users/${emailKey}`)),
      get(ref(database, `home/authorized_users/${emailKey}`)),
    ]);

    const authData = authSnap.exists()
      ? authSnap.val()
      : homeAuthSnap.exists()
      ? homeAuthSnap.val()
      : null;

    if (!authData) {
      // User has NOT been registered by an admin! Block and sign out!
      await firebaseSignOut(auth);
      setUser(null);
      setRole('user');
      const error: any = new Error(
        `Access Denied: ${email} has not been registered. Only users added by an administrator on the /user page can sign in.`
      );
      error.code = 'auth/not-authorized';
      error.email = email;
      throw error;
    }

    // Authorized! Assign the role configured by admin
    const assignedRole: UserRole = authData.role || 'user';

    await Promise.allSettled([
      update(ref(database, `authorized_users/${emailKey}`), {
        status: 'active',
        lastLoginAt: Date.now(),
      }),
      update(ref(database, `home/authorized_users/${emailKey}`), {
        status: 'active',
        lastLoginAt: Date.now(),
      }),
      set(ref(database, `users/${fbUser.uid}`), {
        email,
        role: assignedRole,
        displayName: fbUser.displayName || email.split('@')[0],
        photoURL: fbUser.photoURL || '',
        lastLogin: Date.now(),
      }),
    ]);

    setUser(fbUser);
    setRole(assignedRole);
    setDisplayName(toDisplayName(fbUser));
  };

  // ── Sign Out ──
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setRole('user');
    setDisplayName('');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        displayName,
        role,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};