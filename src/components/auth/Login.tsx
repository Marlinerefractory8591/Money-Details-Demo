import { useState } from 'react';
import React from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Eye, EyeOff } from 'lucide-react';
import { createNotification } from '../../lib/notificationsUtils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await createNotification('Login', 'Logged in successfully', 'Login');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'user') => {
    const demoEmail = role === 'admin'
      ? (import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin.demo@example.com')
      : (import.meta.env.VITE_DEMO_USER_EMAIL || 'user.demo@example.com');
    const demoPassword = role === 'admin'
      ? (import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'DemoAdmin@123')
      : (import.meta.env.VITE_DEMO_USER_PASSWORD || 'DemoUser@123');

    setError('');
    setMessage('');
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      await createNotification('Login', `Logged in as ${role === 'admin' ? 'Admin' : 'User'} demo`, 'Login');
    } catch (err: any) {
      console.error('Demo login error:', err);
      setError(err?.message || 'Demo login failed. Check that the demo account exists in Firebase Authentication.');
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await createNotification('Login', 'Logged in with Google', 'Login');
    } catch (err: any) {
        console.error('Google Login error:', err);
        setError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent. Check your inbox.');
      setError('');
    } catch (err: any) {
      console.error('Reset Password error:', err);
      setError(err.message);
    }
  };

  if (forgotPassword) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl mb-4">
            ₹
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Money Details</h1>
          <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">Digital Expense Master</p>
        </div>

        <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden relative group transition-all hover:border-indigo-500/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
          <h2 className="text-2xl font-black mb-6 dark:text-gray-100 uppercase tracking-tighter">Reset Password</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && <p className="text-green-500 mb-4">{message}</p>}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" required />
            <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl font-bold">Send Reset Email</button>
          </form>
          <button onClick={() => setForgotPassword(false)} className="w-full mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-bold text-sm">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl mb-4">
          ₹
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Money Details</h1>
        <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">Digital Expense Master</p>
      </div>

      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden relative group transition-all hover:border-indigo-500/50">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 to-blue-600"></div>
        <h2 className="text-2xl font-black mb-6 dark:text-gray-100 uppercase tracking-tighter">Login</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" required />
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-500 dark:text-gray-400">
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-xl font-bold">Login</button>
      </form>
      {import.meta.env.VITE_DEMO_MODE === 'true' && (
        <div className="mt-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/70 dark:bg-indigo-950/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3">Client Demo Access</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin')}
              className="p-2.5 rounded-xl bg-purple-600 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-colors"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('user')}
              className="p-2.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors"
            >
              User Demo
            </button>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">One click logs directly into the real demo application with a separate demo Firebase account.</p>
        </div>
      )}

      <button onClick={() => setForgotPassword(true)} className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">Forgot password?</button>
      <button onClick={handleGoogle} className="w-full flex items-center justify-center p-3 mt-4 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
        </svg>
        Sign in with Google
      </button>
    </div>
    </div>
  );
}
