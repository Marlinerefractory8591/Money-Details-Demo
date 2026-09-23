import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { confirmAction } from '../lib/confirmToast';
import { createNotification } from '../lib/notificationsUtils';
import { Budget, Transaction } from '../types';
import { Plus, Pencil, Trash2, AlertCircle, TrendingDown, TrendingUp, Target, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CategorySelector from './CategorySelector';
import { parseISO, addDays, addWeeks, addMonths, isBefore, isAfter, format } from 'date-fns';

interface Props {
  transactions: Transaction[]; // Just for prop signature if needed, but we'll fetch its own if needed, wait, let's just fetch
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('All');
  
  const [formData, setFormData] = useState({ 
    id: '', 
    name: '',
    category: '', 
    amount: '',
    period: 'Monthly' as 'Daily' | 'Weekly' | 'Monthly',
    startDate: new Date().toISOString().slice(0, 16)
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const bPath = `users/${auth.currentUser.uid}/budgets`;
    const q1 = query(collection(db, bPath), orderBy('startDate', 'desc'));
    const unsubBudgets = onSnapshot(q1, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
      setBudgets(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, bPath));

    const tPath = `users/${auth.currentUser.uid}/transactions`;
    const q2 = query(collection(db, tPath), orderBy('date', 'desc'));
    const unsubTransactions = onSnapshot(q2, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, tPath));

    return () => { unsubBudgets(); unsubTransactions(); };
  }, []);

  const getBudgetSpent = (budget: Budget) => {
    const now = new Date();
    // Fallback to start of current month if startDate is missing for legacy budgets
    const fallbackDate = new Date();
    fallbackDate.setDate(1);
    fallbackDate.setHours(0, 0, 0, 0);

    let periodStart = parseISO(budget.startDate || fallbackDate.toISOString());
    
    if (isAfter(periodStart, now)) return 0;
    
    const budgetPeriod = budget.period || 'Monthly';
    
    if (budgetPeriod === 'Daily') {
      while (isBefore(addDays(periodStart, 1), now)) {
        periodStart = addDays(periodStart, 1);
      }
    } else if (budgetPeriod === 'Weekly') {
      while (isBefore(addWeeks(periodStart, 1), now)) {
        periodStart = addWeeks(periodStart, 1);
      }
    } else if (budgetPeriod === 'Monthly') {
      while (isBefore(addMonths(periodStart, 1), now)) {
        periodStart = addMonths(periodStart, 1);
      }
    }
  
    let periodEnd;
    if (budgetPeriod === 'Daily') periodEnd = addDays(periodStart, 1);
    else if (budgetPeriod === 'Weekly') periodEnd = addWeeks(periodStart, 1);
    else periodEnd = addMonths(periodStart, 1);
  
    const spent = transactions
      .filter(t => t.type === 'Expense')
      .filter(t => budget.category === 'All' || t.category === budget.category)
      .filter(t => {
        const tDate = parseISO(t.date || new Date().toISOString());
        return !isBefore(tDate, periodStart) && isBefore(tDate, periodEnd);
      })
      .reduce((sum, t) => sum + t.amount, 0);
  
    return spent;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.category || !formData.amount) return;

    // Add real-world seconds and ms to ensure proper chronological sorting for items added in the same minute
    const finalDate = new Date(formData.startDate);
    const now = new Date();
    finalDate.setSeconds(now.getSeconds());
    finalDate.setMilliseconds(now.getMilliseconds());

    const bPath = `users/${auth.currentUser.uid}/budgets`;
    const payload = {
      name: formData.name,
      category: formData.category,
      amount: Number(formData.amount),
      period: formData.period,
      startDate: finalDate.toISOString()
    };

    try {
      if (formData.id) {
        await updateDoc(doc(db, "users", auth.currentUser.uid, "budgets", formData.id), payload);
        await createNotification('Budget Updated', `Updated budget for ${payload.category}`, 'Edit');
      } else {
        await addDoc(collection(db, bPath), payload);
        await createNotification('Budget Added', `Set budget for ${payload.category}`, 'Add');
      }
      setShowForm(false);
      setFormData({ 
        id: '', name: '', category: '', amount: '', 
        period: 'Monthly', startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm") 
      });
    } catch (error) {
      handleFirestoreError(error, formData.id ? OperationType.UPDATE : OperationType.CREATE, bPath);
    }
  };

  const handleDelete = async (id: string, category: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/budgets/${id}`;
    const loadingToast = toast.loading('Deleting...');
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "budgets", id));
      await createNotification('Budget Deleted', `Deleted budget for ${category}`, 'Delete');
      toast.success('Deleted successfully', { id: loadingToast });
    } catch (error) {
       toast.error('Failed to delete', { id: loadingToast });
       handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center glass dark:glass-dark p-8 rounded-[2.5rem] border-white/40 gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl text-indigo-600">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Monthly Budgets</h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em]">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { 
            setShowForm(true); 
            setFormData({ 
              id: '', name: '', category: '', amount: '', 
              period: 'Monthly', startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm") 
            }); 
          }} 
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-3.5 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all text-sm"
        >
          <Plus className="w-5 h-5" /> Add Budget
        </motion.button>
      </motion.div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Daily', 'Weekly', 'Monthly'].map(p => (
          <button 
            key={p} 
            onClick={() => setFilter(p)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === p ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500 hover:text-indigo-600'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleSave} 
            className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-6 relative overflow-hidden mb-8"
          >
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
            <h3 className="font-black text-xl dark:text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-indigo-500" /> {formData.id ? 'Modify' : 'Initialize'} Budget
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Budget Name (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Weekend Trip" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                />
              </div>
              <CategorySelector 
                type="Expense" 
                selected={formData.category} 
                onSelect={(cat) => setFormData({...formData, category: cat})} 
                label="Budget Category"
                allowAll={true}
              />
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Time Period</label>
                <select 
                  value={formData.period} 
                  onChange={e => setFormData({...formData, period: e.target.value as any})} 
                  className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold cursor-pointer"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Limit Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="5000" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                  className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-xl" 
                  required 
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
                <input 
                  type="datetime-local" 
                  value={formData.startDate} 
                  onChange={e => setFormData({...formData, startDate: e.target.value})} 
                  className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" 
                  required 
                />
              </div>
            </div>
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all"
              >
                Save Budget
              </motion.button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="px-8 text-gray-400 font-bold hover:text-gray-600 transition-colors"
              >
                Discard
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode='popLayout'>
          {budgets
            .filter(b => filter === 'All' || (b.period || 'Monthly') === filter)
            .map((budget, idx) => {
            const spent = getBudgetSpent(budget);
            const percentage = Math.min(100, Math.round((spent / budget.amount) * 100));
            const isOver = spent > budget.amount;
            const isNearing = percentage > 80;
            
            const progressColor = isOver 
              ? 'bg-rose-500' 
              : isNearing 
                ? 'bg-amber-500' 
                : 'bg-emerald-500';

            const bgColor = isOver 
              ? 'bg-rose-50 dark:bg-rose-900/10' 
              : isNearing 
                ? 'bg-amber-50 dark:bg-amber-900/10' 
                : 'bg-emerald-50 dark:bg-emerald-900/10';

            const textColor = isOver 
              ? 'text-rose-600 dark:text-rose-400' 
              : isNearing 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-emerald-600 dark:text-emerald-400';
            
            return (
              <motion.div 
                key={budget.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="group glass dark:glass-dark p-8 rounded-[2.5rem] border-white/40 flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${bgColor} ${textColor}`}>
                        {isOver ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-black text-lg text-gray-900 dark:text-white uppercase tracking-tight truncate max-w-[150px]">{budget.name || budget.category}</h3>
                        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{budget.period || 'Monthly'} • {budget.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { 
                          setFormData({ 
                            id: budget.id, name: budget.name || '', category: budget.category, 
                            amount: String(budget.amount), period: budget.period || 'Monthly', 
                            startDate: budget.startDate ? format(new Date(budget.startDate), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm") 
                          }); 
                          setShowForm(true); 
                        }} 
                        className="p-2 text-gray-300 hover:text-indigo-600 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => {
                          confirmAction('Are you sure you want to delete this budget?', () => {
                            handleDelete(budget.id, budget.category);
                          });
                      }} className="p-2 text-gray-300 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className={`text-3xl font-black ${textColor}`}>₹{spent.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">of ₹{budget.amount.toLocaleString()} goal</p>
                      </div>
                      <div className={`text-xs font-black px-2.5 py-1 rounded-lg ${bgColor} ${textColor}`}>
                        {percentage}%
                      </div>
                    </div>

                    <div className="relative pt-4">
                      <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${progressColor} shadow-lg shadow-current/20`}
                        ></motion.div>
                      </div>
                    </div>

                    {(isOver || isNearing) && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-2 p-3 ${isOver ? 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400'} rounded-2xl text-[10px] font-black uppercase tracking-wider mt-2`}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {isOver ? `Exceeded by ₹${(spent - budget.amount).toLocaleString()}` : 'Budget almost reached'}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {budgets.length === 0 && !showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-24 text-center bg-gray-50/50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800"
          >
            <Wallet className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">No budget guardrails set</p>
            <button 
              onClick={() => {
                setShowForm(true);
                setFormData({ 
                  id: '', name: '', category: '', amount: '', 
                  period: 'Monthly', startDate: new Date().toISOString().slice(0, 16) 
                });
              }}
              className="mt-4 text-indigo-600 font-black text-sm hover:underline"
            >
              Set First Budget
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
