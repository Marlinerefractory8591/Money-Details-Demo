import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { confirmAction } from '../../lib/confirmToast';
import { Search, ShieldAlert, ShieldCheck, UserMinus, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import ViewUserModal from './ViewUserModal';

interface UserData {
  id: string;
  fullName?: string;
  email?: string;
  status?: 'active' | 'blocked';
  role?: string;
  createdAt?: any;
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredUsers = users.filter(u => 
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const logAdminAction = async (action: string, targetUserId: string, targetEmail: string) => {
    await addDoc(collection(db, 'adminLogs'), {
      adminId: auth.currentUser?.uid,
      adminEmail: auth.currentUser?.email,
      action,
      targetUserId,
      targetEmail,
      timestamp: serverTimestamp()
    });
  };

  const handleToggleBlock = async (user: UserData) => {
    const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
    confirmAction(`Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'unblock'} ${user.fullName || user.email}?`, async () => {
      try {
        await updateDoc(doc(db, 'users', user.id), { status: newStatus });
        await logAdminAction(newStatus === 'blocked' ? 'User Blocked' : 'User Unblocked', user.id, user.email || '');
        toast.success(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
      } catch (error) {
        toast.error('Failed to update user status');
      }
    });
  };

  const handleDeleteUser = async (user: UserData) => {
    confirmAction(`CRITICAL: Are you sure you want to delete ${user.fullName || user.email}? This will remove their profile and ALL their associated data (Expenses, Udhaar, Fees). This action cannot be undone.`, async () => {
      try {
        const subcollections = ['transactions', 'udhaar', 'college_fees', 'notifications', 'budgets', 'categories'];
        
        toast.loading('Cleaning up user data...', { id: 'delete-user' });
        
        // Delete subcollections first
        for (const sub of subcollections) {
          const snap = await getDocs(collection(db, 'users', user.id, sub));
          const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'users', user.id, sub, d.id)));
          await Promise.all(deletePromises);
        }

        // Finally delete user doc
        await deleteDoc(doc(db, 'users', user.id));
        await logAdminAction('Full User Data Deletion', user.id, user.email || '');
        
        toast.success('User and all associated data wiped successfully', { id: 'delete-user' });
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to fully delete user data. Some orphans may remain.', { id: 'delete-user' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {selectedUser && (
          <ViewUserModal 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)} 
          />
        )}
      </AnimatePresence>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <h3 className="text-xl font-black italic tracking-tighter uppercase dark:text-white">User Management</h3>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="glass dark:glass-dark rounded-3xl border border-white/40 overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100/50 dark:bg-gray-900/50 border-b border-white/40 dark:border-white/10">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">User</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Role</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20 dark:divide-white/5">
            {filteredUsers.map((user, idx) => (
              <motion.tr 
                key={user.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="hover:bg-white/30 dark:hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black italic">
                      {(user.fullName?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white leading-none mb-1">{user.fullName || 'Unnamed'}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.status === 'blocked' 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {user.status || 'active'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 shadow-sm border border-purple-200 dark:border-purple-800' 
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => setSelectedUser(user)}
                      className="p-2 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleToggleBlock(user)}
                      className={`p-2 rounded-xl transition-all ${
                        user.status === 'blocked'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                      }`}
                      title={user.status === 'blocked' ? 'Unblock' : 'Block'}
                    >
                      {user.status === 'blocked' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user)}
                      className="p-2 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
                      title="Delete Profile"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filteredUsers.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">No users found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

