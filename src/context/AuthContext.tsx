import { createContext, useContext, useEffect, useState } from 'react';
import React from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserDetails {
  uid?: string;
  fullName?: string;
  mobile?: string;
  email?: string;
  role?: string;
  photoURL?: string;
  status?: 'active' | 'blocked';
  createdAt?: any;
}

const AuthContext = createContext<{ 
  user: User | null; 
  userDetails: UserDetails | null; 
  role: string | null; 
  loading: boolean; 
  logout: () => void 
}>({
  user: null,
  userDetails: null,
  role: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, loadingSet] = useState(true);

  const ADMIN_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL || '';

  useEffect(() => {
    let userUnsub: (() => void) | undefined;
    
    const authUnsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (userUnsub) {
        userUnsub();
        userUnsub = undefined;
      }

      if (u) {
        // Special case for initial admin identification via email
        const isAdminEmail = u.email === ADMIN_EMAIL;
        
        // Ensure user document exists and has correct info (Role Persistance)
        const userRef = doc(db, 'users', u.uid);
        getDoc(userRef).then(async (snap) => {
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              fullName: u.displayName || '',
              role: isAdminEmail ? 'admin' : 'user',
              status: 'active',
              createdAt: serverTimestamp()
            });
          } else {
            const data = snap.data();
            // Force update role if email matches but role is wrong
            if (isAdminEmail && data.role !== 'admin') {
              await updateDoc(userRef, { role: 'admin' });
            }
          }
        }).catch(err => {
          console.error("AuthContext: Error checking user document:", err);
        });

        userUnsub = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserDetails;
            setUserDetails({ ...data, uid: u.uid });
            // Admin role is granted if explicit in DB OR if email matches ADMIN_EMAIL
            const effectiveRole = data.role === 'admin' || isAdminEmail ? 'admin' : (data.role || 'user');
            setRole(effectiveRole);
            console.log(`User logged in: ${u.email}, Role: ${effectiveRole}`);
          } else {
            // Document might be in process of creation
            setUserDetails(null);
            setRole(isAdminEmail ? 'admin' : 'user');
          }
        }, (err) => {
          console.error("AuthContext: User document read error:", err);
          // If we get a permission error, it's likely the user is blocked
          if (err.message.toLocaleLowerCase().includes('permission-denied')) {
            setUserDetails({ status: 'blocked' }); // Mock details to trigger blocked screen
          }
        });
      } else {
        setUserDetails(null);
        setRole(null);
      }
      loadingSet(false);
    });

    return () => {
      authUnsub();
      if (userUnsub) userUnsub();
    };
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, userDetails, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
