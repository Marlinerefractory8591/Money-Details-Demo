import { useState, useEffect } from 'react';
import { CollegeFee } from '../types';
import CollegeFeeForm from './CollegeFeeForm';
import CollegeFeeList from './CollegeFeeList';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { confirmAction } from '../lib/confirmToast';
import { createNotification } from '../lib/notificationsUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ExportDropdown from './ExportDropdown';
import { useAuth } from '../context/AuthContext';

import { motion } from 'motion/react';

export default function CollegeFees() {
  const { user, userDetails } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<CollegeFee | null>(null);
  const [fees, setFees] = useState<CollegeFee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/college_fees`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollegeFee));
      setFees(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/college_fees/${id}`;
    const feeToDelete = fees.find(f => f.id === id);
    const loadingToast = toast.loading('Deleting...');
    try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'college_fees', id));
        if (feeToDelete) {
          await createNotification('Fee Payment Deleted', `Deleted ${feeToDelete.paymentType} of ₹${feeToDelete.amount}`, 'Delete');
        }
        toast.success('Deleted successfully', { id: loadingToast });
    } catch (error) {
        toast.error('Failed to delete', { id: loadingToast });
        handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const totalPaid = fees.reduce((acc, f) => acc + f.amount, 0);

  const typeData = fees.reduce((acc, f) => {
    acc[f.paymentType] = (acc[f.paymentType] || 0) + f.amount;
    return acc;
  }, {} as Record<string, number>);
  const pieTypeData = Object.entries(typeData).map(([name, value]) => ({ name, value }));

  const sourceData = fees.reduce((acc, f) => {
    acc[f.paymentSource] = (acc[f.paymentSource] || 0) + f.amount;
    return acc;
  }, {} as Record<string, number>);
  const pieSourceData = Object.entries(sourceData).map(([name, value]) => ({ name, value }));

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const selectedData = fees.filter(f => selectedIds.has(f.id));
  const exportData = selectedData.length > 0 ? selectedData : fees;
  const exportTitle = selectedData.length > 0 
    ? `Selected Fees Records (${selectedData.length} items)`
    : 'College Fees Payment Report';

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === fees.length && fees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(fees.map(f => f.id)));
    }
  };

  return (
    <div className='p-6 space-y-8'>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <p className="text-indigo-100 text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">Total Fees Paid</p>
        <h2 className="text-5xl font-black mt-1">₹ {totalPaid.toLocaleString()}</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm h-72 flex flex-col"
        >
            <h3 className="font-black text-sm uppercase tracking-wider mb-4 text-center text-gray-400">Type-wise Breakdown</h3>
            <div className="flex-1">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} fill="#8884d8">
                    {pieTypeData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={4} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#F3F4F6' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm h-72 flex flex-col"
        >
            <h3 className="font-black text-sm uppercase tracking-wider mb-4 text-center text-gray-400">Source-wise Breakdown</h3>
            <div className="flex-1">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieSourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} fill="#8884d8">
                    {pieSourceData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={4} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#F3F4F6' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingFee(null);
            setShowForm(true);
          }} 
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white p-4.5 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
        >
          <Plus className="w-5 h-5 stroke-[3px]" /> Add Fee Payment
        </motion.button>
        <div className="flex flex-col">
          <ExportDropdown 
            data={exportData} 
            filename="college_fees" 
            title={exportTitle} 
            userInfo={{
              fullName: userDetails?.fullName || user?.displayName,
              email: userDetails?.email || user?.email,
              mobile: userDetails?.mobile
            }}
          />
        </div>
      </div>

      {fees.length > 0 && (
        <div className="flex justify-between items-center px-4 mb-2">
          <button 
            onClick={toggleSelectAll}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            {selectedIds.size === fees.length ? 'Deselect All' : 'Select All'}
            <span className="bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">{selectedIds.size}/{fees.length} Selected</span>
          </button>

          {selectedIds.size > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => {
                confirmAction(`Are you sure you want to delete ${selectedIds.size} selected records?`, async () => {
                  const uid = auth.currentUser?.uid;
                  if (!uid) return;
                  try {
                    toast.loading(`Deleting ${selectedIds.size} items...`, { id: 'bulk-delete' });
                    const deletePromises = [...selectedIds].map((id: string) => deleteDoc(doc(db, 'users', uid, 'college_fees', id)));
                    await Promise.all(deletePromises);
                    setSelectedIds(new Set());
                    toast.success('Selected records deleted', { id: 'bulk-delete' });
                    await createNotification('Bulk Fees Deletion', `Deleted ${selectedIds.size} records`, 'Delete');
                  } catch (error) {
                    toast.error('Bulk delete failed', { id: 'bulk-delete' });
                  }
                });
              }}
              className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-900/30"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </motion.button>
          )}
        </div>
      )}

      {showForm && <CollegeFeeForm onClose={() => { setShowForm(false); setEditingFee(null); }} initialData={editingFee || undefined} />}
      <CollegeFeeList 
        fees={fees} 
        onDelete={handleDelete} 
        onEdit={(fee: CollegeFee) => {
          setEditingFee(fee);
          setShowForm(true);
        }}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />
    </div>
  );
}

