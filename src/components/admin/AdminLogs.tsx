import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'adminLogs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black italic tracking-tighter uppercase dark:text-white flex items-center gap-2">
        <Activity className="w-5 h-5 text-indigo-500" />
        Admin Activity Logs
      </h3>

      <div className="glass dark:glass-dark rounded-3xl border border-white/40 overflow-hidden shadow-sm">
        <div className="divide-y divide-white/20 dark:divide-white/5">
          {logs.map((log, idx) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="p-4 hover:bg-white/30 dark:hover:bg-white/5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    <span className="text-indigo-600 dark:text-indigo-400 font-black italic mr-2">{log.action}:</span>
                    {log.targetEmail}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-black">
                    By {log.adminEmail}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  {log.timestamp?.toDate ? format(log.timestamp.toDate(), 'PPpp') : 'Recent'}
                </p>
              </div>
            </motion.div>
          ))}
          {logs.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500 italic">No logs found. Admins actions will appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
