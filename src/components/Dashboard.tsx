import { useEffect, useState, useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Filters state
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentModeFilter, setPaymentModeFilter] = useState('All');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    });
    return unsubscribe;
  }, []);

  const categories = useMemo(() => Array.from(new Set(transactions.map(t => t.category))), [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
      if (paymentModeFilter !== 'All' && t.paymentMode !== paymentModeFilter) return false;
      if (dateRange.start && new Date(t.date) < new Date(dateRange.start)) return false;
      if (dateRange.end && new Date(t.date) > new Date(dateRange.end)) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, paymentModeFilter, dateRange]);

  const income = filteredTransactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);

  const categoryData = filteredTransactions.filter(t => t.type === 'Expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  const paymentModeData = filteredTransactions.reduce((acc, t) => {
    acc[t.paymentMode] = (acc[t.paymentMode] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
  const modePieData = Object.entries(paymentModeData).map(([name, value]) => ({ name, value }));

  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string, Income: number, Expense: number }> = {};
    filteredTransactions.forEach(t => {
      const monthStr = format(parseISO(t.date), 'MMM yyyy');
      if (!data[monthStr]) {
        data[monthStr] = { month: monthStr, Income: 0, Expense: 0 };
      }
      data[monthStr][t.type] += t.amount;
    });
    return Object.values(data).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredTransactions]);

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass dark:glass-dark p-3 sm:p-6 rounded-3xl sm:rounded-[2.5rem] border-white/40 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        <div className="col-span-1">
          <label className="block text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 ml-1">Start Date</label>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="w-full p-2 sm:p-2.5 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
        </div>
        <div className="col-span-1">
          <label className="block text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 ml-1">End Date</label>
          <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="w-full p-2 sm:p-2.5 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
        </div>
        <div className="col-span-1">
          <label className="block text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 ml-1">Type</label>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full p-2 sm:p-2.5 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
            <option>All</option><option>Income</option><option>Expense</option>
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 ml-1">Category</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full p-2 sm:p-2.5 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
            <option>All</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2 lg:col-span-1">
          <label className="block text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2 ml-1">Payment Mode</label>
          <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value)} className="w-full p-2 sm:p-2.5 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-xl sm:rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
            <option>All</option>
            <option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option><option>Other</option>
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: 'Income', val: income, icon: '↑', color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-200 dark:shadow-none' },
          { label: 'Expense', val: expense, icon: '↓', color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-200 dark:shadow-none' },
          { label: 'Balance', val: income - expense, icon: '₹', color: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-200 dark:shadow-none' }
        ].map((card, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring' }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`relative overflow-hidden bg-gradient-to-br ${card.color} p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-xl ${card.shadow} group`}
          >
            <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <span className="text-6xl sm:text-8xl font-black italic">{card.icon}</span>
            </div>
            <p className="text-[8px] sm:text-[10px] text-white/80 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-1 sm:mb-2">{card.label}</p>
            <p className="font-black text-2xl sm:text-4xl text-white tracking-tighter">₹{card.val.toLocaleString()}</p>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <div className="h-1 w-8 sm:w-12 bg-white/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="h-full w-full bg-white/60"
                />
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-white/60 uppercase">Updated live</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm h-96 flex flex-col"
        >
          <h3 className="font-black text-xl mb-6 text-gray-800 dark:text-white">Expenses by Category</h3>
          <div className="flex-1">
            {pieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} fill="#8884d8" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={8} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value}`} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '15px', color: '#F3F4F6' }} itemStyle={{ color: '#F3F4F6' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold">No expense data</div>
            )}
          </div>
        </motion.div>

        {/* Payment Mode Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm h-96 flex flex-col"
        >
          <h3 className="font-black text-xl mb-6 text-gray-800 dark:text-white">Payment Mode Analysis</h3>
          <div className="flex-1">
            {modePieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={modePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} fill="#8884d8" label>
                    {modePieData.map((_, index) => <Cell key={index} fill={COLORS[(index + 3) % COLORS.length]} cornerRadius={8} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₹${value}`} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '15px', color: '#F3F4F6' }} itemStyle={{ color: '#F3F4F6' }} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold">No data</div>
            )}
          </div>
        </motion.div>
        
        {/* Monthly Summary Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm h-96 lg:col-span-2 flex flex-col"
        >
          <h3 className="font-black text-xl mb-6 text-gray-800 dark:text-white">Monthly Summary</h3>
          <div className="flex-1">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#9CA3AF" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} stroke="#9CA3AF" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <Tooltip formatter={(value: number) => `₹${value}`} cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '15px', color: '#F3F4F6' }} itemStyle={{ color: '#F3F4F6' }} />
                  <Legend iconType="rect" />
                  <Bar dataKey="Income" fill="#10b981" radius={[10, 10, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[10, 10, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold">No monthly data</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
