import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, collectionGroup } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, CreditCard, Landmark, GraduationCap, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export default function Overview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExpenses: 0,
    totalUdhaar: 0,
    totalFees: 0,
    activeUsers: 0,
    blockedUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGlobalStats() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => doc.data());
        
        let active = 0;
        let blocked = 0;
        users.forEach((u: any) => {
          if (u.status === 'blocked') blocked++;
          else active++;
        });

        let expTotal = 0;
        let udhaarTotal = 0;
        let feesTotal = 0;

        // Global stats using collectionGroup for admin
        // Note: This requires indexes to be created in Firebase Console
        const expSnap = await getDocs(query(collectionGroup(db, 'transactions')));
        expSnap.forEach(doc => expTotal += doc.data().amount || 0);

        const udhaarSnap = await getDocs(query(collectionGroup(db, 'udhaar')));
        udhaarSnap.forEach(doc => udhaarTotal += doc.data().amount || 0);

        const feesSnap = await getDocs(query(collectionGroup(db, 'college_fees')));
        feesSnap.forEach(doc => feesTotal += doc.data().amount || 0);

        setStats({
          totalUsers: users.length,
          activeUsers: active,
          blockedUsers: blocked,
          totalExpenses: expTotal,
          totalUdhaar: udhaarTotal,
          totalFees: feesTotal
        });
      } catch (error) {
        console.error('Error fetching global stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchGlobalStats();
  }, []);

  if (loading) return <div className="animate-pulse flex space-x-4">Loading stats...</div>;

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: <Users />, color: 'text-blue-500', bg: 'bg-blue-100' },
    { title: 'Global Expenses', value: `₹${stats.totalExpenses.toLocaleString()}`, icon: <CreditCard />, color: 'text-rose-500', bg: 'bg-rose-100' },
    { title: 'Global Udhaar', value: `₹${stats.totalUdhaar.toLocaleString()}`, icon: <Landmark />, color: 'text-amber-500', bg: 'bg-amber-100' },
    { title: 'Total Fees', value: `₹${stats.totalFees.toLocaleString()}`, icon: <GraduationCap />, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, idx) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="glass dark:glass-dark p-6 rounded-3xl border border-white/40 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} dark:bg-opacity-20`}>
              {stat.icon}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{stat.title}</p>
            <h3 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white">
              {stat.value}
            </h3>
          </div>
        </motion.div>
      ))}

      <div className="md:col-span-2 glass dark:glass-dark p-6 rounded-3xl border border-white/40 dark:border-white/10 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight italic mb-2">User Status Distribution</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"></span>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{stats.activeUsers} Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span>
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{stats.blockedUsers} Blocked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
