import { useState, useEffect } from 'react';
import Overview from './Overview';
import UserManagement from './UserManagement';
import AdminLogs from './AdminLogs';
import { LayoutDashboard, Users, Activity, ShieldAlert, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AdminTab = 'Overview' | 'Users' | 'Logs';

export default function AdminPanel({ initialTab = 'Overview' }: { initialTab?: AdminTab }) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Sync state if initialTab changes (to support switching sub-tabs from App.tsx header)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { id: 'Overview' as AdminTab, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'Users' as AdminTab, label: 'Users Control', icon: <Users className="w-4 h-4" /> },
    { id: 'Logs' as AdminTab, label: 'Activity Logs', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass dark:glass-dark p-8 rounded-[3rem] border border-white/40 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Shield className="w-48 h-48 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200">
               <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-4xl font-black italic tracking-tighter uppercase text-gray-900 dark:text-white leading-none">
                System Command
              </h2>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                Secure Admin Infrastructure
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gray-900 text-white shadow-xl translate-y-[-2px]' 
                    : 'bg-white/50 dark:bg-gray-800/50 text-gray-500 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {activeTab === 'Overview' && <Overview />}
            {activeTab === 'Users' && <UserManagement />}
            {activeTab === 'Logs' && <AdminLogs />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

