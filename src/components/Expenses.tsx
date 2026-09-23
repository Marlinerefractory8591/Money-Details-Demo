import { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMode } from '../types';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import { Plus, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ExportDropdown from './ExportDropdown';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, setDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createNotification } from '../lib/notificationsUtils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { confirmAction } from '../lib/confirmToast';

import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function Expenses() {
  const { user, userDetails } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'All'>('All');
  const [filterMode, setFilterMode] = useState<PaymentMode | 'All'>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/transactions`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, []);

  const categories = Array.from(new Set(transactions.map(t => t.category))).sort();

  const filtered = transactions.filter(t => 
    (filterType === 'All' || t.type === filterType) &&
    (filterMode === 'All' || t.paymentMode === filterMode) &&
    (filterCategory === 'All' || t.category === filterCategory) &&
    (filterDate === '' || format(new Date(t.date), 'yyyy-MM-dd') === filterDate) &&
    (t.note.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedData = filtered.filter(t => selectedIds.has(t.id));
  const exportData = selectedData.length > 0 ? selectedData : filtered;
  const exportTitle = selectedData.length > 0 
    ? `Selected Transactions Report (${selectedData.length} items)`
    : 'Financial Transactions Report';

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)));
    }
  };

  const handleSubmit = async (t: Transaction) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/transactions`;
    const loadingToast = toast.loading(editingTransaction ? 'Updating...' : 'Adding...');
    
    try {
        const payload = { ...t };
        delete (payload as any).id; // don't store id inside the document

        if (editingTransaction) {
            if (!t.id) throw new Error("Missing document ID for updating");
            await updateDoc(doc(db, 'users', auth.currentUser.uid, 'transactions', t.id), payload);
            await createNotification('Transaction Updated', `Updated ${t.type} of ₹${t.amount}`, 'Edit');
            toast.success('Updated successfully', { id: loadingToast });
        } else {
            await addDoc(collection(db, path), payload);
            await createNotification('Transaction Added', `Added ${t.type} of ₹${t.amount}`, 'Add');
            toast.success('Added successfully', { id: loadingToast });
        }
        setEditingTransaction(null);
        setShowForm(false);
    } catch (error) {
        console.error("Save failed:", error);
        toast.error('Failed to save transaction', { id: loadingToast });
        handleFirestoreError(error, editingTransaction ? OperationType.WRITE : OperationType.CREATE, path);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setShowForm(true);
  };

  const handleDelete = async (id: string, t: Transaction) => {
    if (!auth.currentUser) return;
    if (!id) {
        toast.error("Error: Missing document ID");
        return;
    }
    const path = `users/${auth.currentUser.uid}/transactions/${id}`;
    
    // Optimistic UI could be done, but we'll use a loading toast
    const loadingToast = toast.loading('Deleting...');
    
    try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'transactions', id));
        await createNotification('Transaction Deleted', `Deleted ${t?.type || ''} of ₹${t?.amount || ''}`, 'Delete');
        toast.success('Deleted successfully', { id: loadingToast });
    } catch (error) {
        console.error("Delete failed:", error);
        toast.error('Failed to delete transaction', { id: loadingToast });
        handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div>
      <div className="space-y-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative group"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Plus className="w-5 h-5 text-indigo-500 origin-center group-focus-within:rotate-90 transition-transform rotate-45" />
          </div>
          <input 
            type="text" 
            placeholder="Search notes, categories, or tags..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full p-4 pl-12 glass dark:glass-dark rounded-[2rem] dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-bold" 
          />
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: filterType, setter: setFilterType, options: ['All', 'Income', 'Expense'], label: 'Type', bg: 'bg-blue-500/10 text-blue-600' },
            { value: filterCategory, setter: setFilterCategory, options: ['All', ...categories], label: 'Category', bg: 'bg-emerald-500/10 text-emerald-600' },
            { value: filterMode, setter: setFilterMode, options: ['All', 'Cash', 'UPI', 'Bank', 'Card', 'Other'], label: 'Mode', bg: 'bg-amber-500/10 text-amber-600' }
          ].map((filter, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <select 
                value={filter.value}
                onChange={e => filter.setter(e.target.value as any)} 
                className={`w-full p-3.5 pl-4 pr-10 appearance-none glass dark:glass-dark rounded-2xl dark:text-gray-100 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${filter.bg}`}
              >
                {filter.options.map((opt, idx) => (
                  <option key={idx} value={opt} className="dark:bg-gray-900 text-gray-900 dark:text-white capitalize font-sans tracking-normal overflow-hidden">{idx === 0 ? `All ${filter.label}` : opt}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                 <Plus className="w-3 h-3 rotate-45" />
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="ml-auto w-full"
          >
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)} 
              className="w-full p-3.5 glass dark:glass-dark rounded-2xl dark:text-gray-100 text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-indigo-600" 
            />
          </motion.div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingTransaction(null);
            setShowForm(true);
          }} 
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white p-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all"
        >
          <Plus className="w-5 h-5" /> Add Transaction
        </motion.button>
        <div className="flex-1">
          <ExportDropdown 
            data={exportData} 
            filename="transactions" 
            title={exportTitle} 
            userInfo={{
              fullName: userDetails?.fullName || user?.displayName,
              email: userDetails?.email || user?.email,
              mobile: userDetails?.mobile
            }}
          />
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="flex justify-between items-center px-4 mb-2">
          <button 
            onClick={toggleSelectAll}
            className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
            <span className="bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">{selectedIds.size}/{filtered.length} Selected</span>
          </button>

          {selectedIds.size > 0 && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={async () => {
                confirmAction(`Are you sure you want to delete ${selectedIds.size} selected transactions?`, async () => {
                  const uid = auth.currentUser?.uid;
                  if (!uid) return;
                  try {
                    toast.loading(`Deleting ${selectedIds.size} items...`, { id: 'bulk-delete' });
                    const deletePromises = [...selectedIds].map((id: string) => deleteDoc(doc(db, 'users', uid, 'transactions', id)));
                    await Promise.all(deletePromises);
                    setSelectedIds(new Set());
                    toast.success('Selected transactions deleted', { id: 'bulk-delete' });
                    await createNotification('Bulk Transaction Deletion', `Deleted ${selectedIds.size} records`, 'Delete');
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

      {showForm && (
        <TransactionForm 
            onAdd={handleSubmit} 
            onClose={() => {
                setShowForm(false);
                setEditingTransaction(null);
            }} 
            initialData={editingTransaction || undefined}
        />
      )}
      <TransactionList 
        transactions={filtered} 
        onDelete={handleDelete} 
        onEdit={handleEdit}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />
    </div>
  );
}
