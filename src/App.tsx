import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { Menu, X, LayoutGrid, ArrowRightLeft, UserCircle2, GraduationCap, LogOut, Shield, User, ChevronDown, Settings, RefreshCcw, Moon, Sun, Bell, Target, History, ShieldAlert, List, Users as UsersIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { Transaction, UdhaarEntry, CollegeFee } from './types';
import Expenses from './components/Expenses';
import Udhaar from './components/Udhaar';
import CollegeFees from './components/CollegeFees';
import Dashboard from './components/Dashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import NotificationsList from './components/NotificationsList';
import ProfileModal from './components/ProfileModal';
import HistoryModal from './components/HistoryModal';
import { useLocalStorage } from './hooks/useLocalStorage';

import { createNotification } from './lib/notificationsUtils';
import { useNotifications } from './hooks/useNotifications';
import AdminPanel from './components/admin/AdminPanel';
import Budgets from './components/Budgets';
import Footer from './components/Footer';

type Tab = 'Dashboard' | 'Expenses' | 'Udhaar' | 'Fees' | 'Budgets' | 'Admin';

export default function App() {
  const { user, userDetails, role, loading, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, clearAll } = useNotifications(user);
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard');
  const [adminTab, setAdminTab] = useState<'Overview' | 'Users' | 'Logs'>('Overview');
  const [showSignup, setShowSignup] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'settings'>('profile');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('darkMode', false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Note: These will need to be fetched from Firestore in reality
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [udhaarEntries, setUdhaarEntries] = useState<UdhaarEntry[]>([]);
  const [collegeFees, setCollegeFees] = useState<CollegeFee[]>([]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, []);

  if (loading) return <div>Loading...</div>;

  const isBlocked = userDetails?.status === 'blocked' && role !== 'admin';

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-rose-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert className="w-20 h-20 text-rose-500 mb-6 animate-bounce" />
        <h1 className="text-4xl font-black italic tracking-tighter uppercase text-rose-600 mb-2">Access Revoked</h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-md font-medium">
          Your account has been suspended by the administrator. If you believe this is a mistake, please contact support.
        </p>
        <button 
          onClick={() => handleLogout()}
          className="mt-8 px-8 py-3 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-gray-800 transition-all"
        >
          Logout Session
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-6">
        <Toaster position="top-right" />
        {showSignup ? <Signup /> : <Login />}
        {import.meta.env.VITE_DEMO_MODE !== 'true' && (
          <button onClick={() => setShowSignup(!showSignup)} className="mt-4 text-blue-600 dark:text-blue-400 font-bold hover:underline transition-colors">
            {showSignup ? 'Already have an account? Login' : 'Need an account? Signup'}
          </button>
        )}
      </div>
    );
  }

  const handleLogout = async () => {
    await createNotification('Logout', 'Logged out successfully', 'Logout');
    logout();
  };

  const navItems: { name: Tab; icon: React.ReactNode; color: string }[] = [
    { name: 'Dashboard', icon: <LayoutGrid className="w-5 h-5" />, color: 'text-blue-500' },
    { name: 'Expenses', icon: <ArrowRightLeft className="w-5 h-5" />, color: 'text-emerald-500' },
    { name: 'Budgets', icon: <Target className="w-5 h-5" />, color: 'text-rose-500' },
    { name: 'Udhaar', icon: <UserCircle2 className="w-5 h-5" />, color: 'text-amber-500' },
    { name: 'Fees', icon: <GraduationCap className="w-5 h-5" />, color: 'text-indigo-500' },
    ...(role === 'admin' ? [{ name: 'Admin', icon: <Shield className="w-5 h-5" />, color: 'text-purple-500' } as any] : []),
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'mesh-gradient' : 'mesh-gradient-light'} text-gray-800 dark:text-gray-100 selection:bg-indigo-500/30`}>
      <Toaster position="top-right" />
      <header className="glass dark:glass-dark px-3 sm:px-4 md:px-6 h-16 md:h-20 flex items-center justify-between sticky top-0 z-40 gap-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 min-w-0"
        >
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <motion.div 
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "anticipate" }}
            className="w-7 h-7 sm:w-8 lg:w-10 lg:h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-lg sm:rounded-xl flex flex-shrink-0 items-center justify-center text-white font-black text-sm sm:text-lg shadow-lg shadow-indigo-200 dark:shadow-none"
          >
            ₹
          </motion.div>
          <h1 className="text-xs xs:text-sm sm:text-xl lg:text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter truncate transition-all">
            Money Details
          </h1>
        </motion.div>

        <div className="hidden md:flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-2xl gap-0.5 border border-gray-100 dark:border-white/5 backdrop-blur-md mx-2 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <motion.button
              key={item.name}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(item.name)}
              className={`px-2 lg:px-4 py-2 text-[8px] lg:text-sm font-black rounded-xl transition-all relative flex-shrink-0 ${
                activeTab === item.name 
                  ? 'text-gray-900 dark:text-white' 
                  : item.name === 'Admin'
                    ? 'text-purple-600 dark:text-purple-400 hover:text-purple-700 font-black'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 uppercase tracking-widest'
              }`}
            >
              {activeTab === item.name && (
                <motion.div 
                  layoutId="activeTabHeader"
                  className="absolute inset-0 bg-white dark:bg-white/10 rounded-xl shadow-md z-0"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1 lg:gap-2">
                 <span className={`${activeTab === item.name ? item.color : item.name === 'Admin' ? 'text-purple-500' : 'opacity-50'}`}>{item.icon}</span>
                 <span className="hidden xl:inline">{item.name}</span>
                 <span className="inline xl:hidden text-[7px] lg:text-[10px]">{item.name.substring(0, 4)}</span>
              </span>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
          {role === 'admin' && (
            <div className="flex items-center gap-1">
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => { setActiveTab('Admin'); setAdminTab('Users'); }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl transition-all ${activeTab === 'Admin' && adminTab === 'Users' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white shadow-sm dark:bg-gray-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30'}`}
                title="Users Management"
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Users</span>
              </motion.button>
              
              {activeTab !== 'Admin' && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { setActiveTab('Admin'); setAdminTab('Overview'); }}
                  className="flex items-center gap-1 sm:gap-1.5 bg-purple-600 text-white px-2 sm:px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-purple-200 dark:shadow-none hover:bg-purple-700 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </motion.button>
              )}
            </div>
          )}
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button onClick={() => setShowHistoryModal(true)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors">
            <History className="w-5 h-5" />
          </button>
          
          <div className="relative" ref={notificationMenuRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAllAsRead();
              }} 
              className="p-2 flex-shrink-0 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white flex items-center justify-center text-[10px] font-bold rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden origin-top-right"
                >
                  <NotificationsList notifications={notifications} onClearAll={clearAll} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative flex-shrink-0" ref={profileMenuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-colors text-gray-800 dark:text-gray-200"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-6 h-6 sm:w-6 sm:h-6 rounded-full" />
              ) : (
                <User className="w-5 h-5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              )}
              <span className="hidden sm:block truncate max-w-[100px] md:max-w-[120px]">{user.displayName || (user.email ? user.email.split('@')[0] : 'User')}</span>
              <ChevronDown className="hidden sm:block w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-1 origin-top-right"
                >
                  <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1 flex items-center gap-3">
                    {user.photoURL ? (
                       <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex flex-shrink-0 items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg">
                        {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{user.displayName || 'User'}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
                    </div>
                  </div>
                  {role === 'admin' && (
                    <>
                      <button 
                        onClick={() => { setActiveTab('Admin'); setShowProfileMenu(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2 rounded-md transition-colors font-black uppercase tracking-widest text-[10px]"
                      >
                        <Shield className="w-4 h-4" /> Admin System
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                    </>
                  )}
                  <button 
                    onClick={() => { setProfileModalTab('profile'); setShowProfileModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-md transition-colors"
                  >
                    <User className="w-4 h-4" /> Account
                  </button>
                  <button 
                    onClick={() => { setProfileModalTab('settings'); setShowProfileModal(true); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-md transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button 
                    onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-md transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" /> Switch Account
                  </button>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button 
                    onClick={() => { handleLogout(); setShowProfileMenu(false); }} 
                    className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-3 sm:p-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {activeTab === 'Dashboard' && <Dashboard transactions={transactions} />}
            {activeTab === 'Expenses' && <Expenses />}
            {activeTab === 'Budgets' && <Budgets transactions={transactions} />}
            {activeTab === 'Udhaar' && <Udhaar entries={udhaarEntries} setEntries={setUdhaarEntries} />}
            {activeTab === 'Fees' && <CollegeFees fees={collegeFees} setFees={setCollegeFees} />}
            {activeTab === 'Admin' && role === 'admin' && <AdminPanel initialTab={adminTab} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {showProfileModal && (
        <ProfileModal 
          onClose={() => setShowProfileModal(false)} 
          initialTab={profileModalTab} 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={setIsDarkMode} 
        />
      )}
      {showHistoryModal && <HistoryModal onClose={() => setShowHistoryModal(false)} history={notifications} onClearAll={clearAll} />}

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileMenu(false)}
            className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-50 md:hidden flex flex-col shadow-2xl"
          >
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                  ₹
                </div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Money Details</h2>
              </div>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                title="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name);
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                    activeTab === item.name 
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 font-medium tracking-wide'
                  }`}
                >
                  <span className={`${activeTab === item.name ? item.color : 'text-gray-400 dark:text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex flex-shrink-0 items-center justify-center text-gray-500 dark:text-gray-400 font-bold text-lg">
                    {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate text-sm">{user.displayName || 'User'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

