"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  createUserProfile,
  deleteUserProfile,
  UserProfile,
} from "@/lib/firestore";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, isArtist?: boolean) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isFirebaseConfigured = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );

  const loadProfile = async (u: User) => {
    const profile = await getUserProfile(u.uid);
    setUserProfile(profile);
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [isFirebaseConfigured]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    isArtist = false
  ) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await createUserProfile(result.user.uid, {
      email,
      displayName,
      photoURL: result.user.photoURL ?? "",
      isArtist,
    });
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const existing = await getUserProfile(result.user.uid);
    if (!existing) {
      await createUserProfile(result.user.uid, {
        email: result.user.email ?? "",
        displayName: result.user.displayName ?? "",
        photoURL: result.user.photoURL ?? "",
        isArtist: false,
      });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const deleteAccount = async () => {
    if (!user) return;
    await deleteUserProfile(user.uid);
    await deleteUser(user);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isFirebaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
