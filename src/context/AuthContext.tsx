'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: string;
  isPremium: boolean;
  completedQuizzes: string[];
  weakTopics: string[];
  themeMode: 'soft' | 'sharp';
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateXP: (xp: number) => Promise<void>;
  updateStreak: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const newProfile: UserProfile = {
      uid: cred.user.uid, email, displayName: name,
      xp: 0, level: 1, streak: 0, lastStudyDate: '',
      isPremium: false, completedQuizzes: [], weakTopics: [], themeMode: 'soft',
    };
    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    setProfile(newProfile);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const updateXP = async (xpGain: number) => {
    if (!user || !profile) return;
    const newXP = profile.xp + xpGain;
    const newLevel = Math.floor(newXP / 100) + 1;
    const updated = { ...profile, xp: newXP, level: newLevel };
    await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
    setProfile(updated);
  };

  const updateStreak = async () => {
    if (!user || !profile) return;
    const today = new Date().toDateString();
    if (profile.lastStudyDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = profile.lastStudyDate === yesterday ? profile.streak + 1 : 1;
    const updated = { ...profile, streak: newStreak, lastStudyDate: today };
    await setDoc(doc(db, 'users', user.uid), updated, { merge: true });
    setProfile(updated);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, register, login, logout, updateXP, updateStreak }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
