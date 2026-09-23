import { useState, useEffect } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { X, CreditCard, Landmark, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface Props {
  user: any;
  onClose: () => void;
}

export default function ViewUserModal({ user, onClose }: Props) {
  const [data, setData] = useState({
    expenses: [] as any[],
    udhaar: [] as any[],
    fees: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const expSnap = await getDocs(collection(db, 'users', user.id, 'transactions'));
        const udhaarSnap = await getDocs(collection(db, 'users', user.id, 'udhaar'));
        const feesSnap = await getDocs(collection(db, 'users', user.id, 'college_fees'));

        setData({
          expenses: expSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          udhaar: udhaarSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
          fees: feesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        });
      } catch (error) {
        console.error('Error fetching user detail data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-indigo-600 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-black text-xl italic">
              {(user.fullName?.[0] || user.email?.[0] || '?').toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none">{user.fullName || 'User Record'}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loading ? (
             <div className="flex items-center justify-center py-20 italic text-gray-500">Loading user history...</div>
          ) : (
            <>
              {/* Summary Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30">
                  <CreditCard className="w-5 h-5 text-rose-500 mb-2" />
                  <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">Total Expenses</p>
                  <p className="text-xl font-black italic text-gray-900 dark:text-white">
                    ₹{data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30">
                  <Landmark className="w-5 h-5 text-amber-500 mb-2" />
                  <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">Udhaar Balance</p>
                  <p className="text-xl font-black italic text-gray-900 dark:text-white">
                    ₹{data.udhaar.reduce((sum, e) => sum + (e.type === 'You Gave' ? e.amount : -e.amount), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30">
                  <GraduationCap className="w-5 h-5 text-indigo-500 mb-2" />
                  <p className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">Fee Payments</p>
                  <p className="text-xl font-black italic text-gray-900 dark:text-white">
                    ₹{data.fees.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Data Lists */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Recent Expenses ({data.expenses.length})</h4>
                  <div className="space-y-2">
                    {data.expenses.slice(0, 5).map(e => (
                      <div key={e.id} className="p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{e.note || e.category}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{e.date ? format(new Date(e.date), 'PP') : ''}</p>
                        </div>
                        <span className="font-black text-rose-500">₹{e.amount}</span>
                      </div>
                    ))}
                    {data.expenses.length === 0 && <p className="text-sm italic text-gray-500 px-2">No expenses recorded.</p>}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 px-2">Recent Udhaar ({data.udhaar.length})</h4>
                  <div className="space-y-2">
                    {data.udhaar.slice(0, 5).map(e => (
                      <div key={e.id} className="p-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-xl flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{e.personName}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{e.type} • {e.date ? format(new Date(e.date), 'PP') : ''}</p>
                        </div>
                        <span className={`font-black ${e.type === 'You Got' ? 'text-green-500' : 'text-red-500'}`}>
                          ₹{e.amount}
                        </span>
                      </div>
                    ))}
                    {data.udhaar.length === 0 && <p className="text-sm italic text-gray-500 px-2">No udhaar records.</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg"
          >
            Close Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}
