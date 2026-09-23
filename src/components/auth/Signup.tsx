import { useState } from 'react';
import React from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createNotification } from '../../lib/notificationsUtils';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: fullName });
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: email,
        fullName: fullName,
        role: 'user',
        mobile: ''
      });
      await createNotification('Account Created', 'Successfully signed up', 'Signup');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl mb-4">
          ₹
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Money Details</h1>
        <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">Digital Expense Master</p>
      </div>

      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden relative group transition-all hover:border-emerald-500/50">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <h2 className="text-2xl font-black mb-6 dark:text-gray-100 uppercase tracking-tighter">Create Account</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSignup} className="space-y-4">
        <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" />
        <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl font-bold">Signup</button>
      </form>
    </div>
    </div>
  );
}
