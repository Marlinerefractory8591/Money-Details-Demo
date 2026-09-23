import React, { useState, useEffect } from 'react';
import { UdhaarEntry, UdhaarType, PaymentMode } from '../types';
import UdhaarForm from './UdhaarForm';
import { Plus, Download, History, Info, Trash2, Edit2 } from 'lucide-react';
import ExportDropdown from './ExportDropdown';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { confirmAction } from '../lib/confirmToast';
import { createNotification } from '../lib/notificationsUtils';
import DetailModal from './DetailModal';
import { useAuth } from '../context/AuthContext';

import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Udhaar() {
  const { user, userDetails } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<UdhaarEntry | null>(null);
  const [entries, setEntries] = useState<UdhaarEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedForDetail, setSelectedForDetail] = useState<UdhaarEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<UdhaarType | 'All'>('All');
  const [filterMode, setFilterMode] = useState<PaymentMode | 'All'>('All');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/udhaar`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UdhaarEntry));
      setEntries(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, []);

  const filtered = entries.filter(e => 
    (filterType === 'All' || e.type === filterType) &&
    (filterMode === 'All' || e.paymentMode === filterMode) &&
    (filterDate === '' || format(new Date(e.date), 'yyyy-MM-dd') === filterDate) &&
    (e.personName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedData = filtered.filter(e => selectedIds.has(e.id));
  const exportData = selectedData.length > 0 ? selectedData : filtered;
  const exportTitle = selectedData.length > 0 
    ? `Selected Udhaar Records (${selectedData.length} items)`
    : 'Udhaar/Lending Financial Report';

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(e => e.id)));
    }
  };

  const summaries = filtered.reduce((acc, entry) => {
    if (!acc[entry.personName]) acc[entry.personName] = 0;
    acc[entry.personName] += entry.type === 'You Gave' ? entry.amount : -entry.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalToGet = Object.values<number>(summaries).filter(b => b > 0).reduce((a, b) => a + b, 0);
  const totalToGive = Math.abs(Object.values<number>(summaries).filter(b => b < 0).reduce((a, b) => a + b, 0));

  const handleDelete = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/udhaar/${id}`;
    const loadingToast = toast.loading('Deleting...');
    try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'udhaar', id));
        toast.success('Deleted successfully', { id: loadingToast });
    } catch (error) {
        toast.error('Failed to delete', { id: loadingToast });
        handleFirestoreError(error, OperationType.DELETE, path);
    }
  };


  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-3xl border border-green-100 dark:border-green-800/30 text-center shadow-sm"
        >
          <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-wider mb-1">To Get</p>
          <p className="font-black text-2xl text-green-700 dark:text-green-300">₹{totalToGet}</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 p-5 rounded-3xl border border-red-100 dark:border-red-800/30 text-center shadow-sm"
        >
          <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-wider mb-1">To Give</p>
          <p className="font-black text-2xl text-red-700 dark:text-red-300">₹{totalToGive}</p>
        </motion.div>
      </div>

      <div className="space-y-4 mb-8">
        <input 
          type="text" 
          placeholder="Search by name..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="w-full p-3.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-2xl dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow bg-white" 
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { value: filterType, setter: setFilterType, options: ['All', 'You Gave', 'You Got'], label: 'Type' },
            { value: filterMode, setter: setFilterMode, options: ['All', 'Cash', 'UPI', 'Bank', 'Card', 'Other'], label: 'Mode' }
          ].map((filter, i) => (
            <motion.select 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              value={filter.value}
              onChange={e => filter.setter(e.target.value as any)} 
              className="p-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {filter.options.map((opt, idx) => (
                <option key={idx} value={opt}>{idx === 0 ? `All ${filter.label}` : opt}</option>
              ))}
            </motion.select>
          ))}
          <motion.input 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            className="p-2.5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-xl dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white" 
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setEditingEntry(null);
            setShowForm(true);
          }} 
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 rounded-2xl font-bold shadow-lg shadow-amber-200 dark:shadow-none transition-all"
        >
          <Plus className="w-5 h-5" /> Add Entry
        </motion.button>
        <div className="flex-1">
          <ExportDropdown 
            data={exportData} 
            filename="udhaar_records" 
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
              onClick={() => {
                confirmAction(`Are you sure you want to delete ${selectedIds.size} selected entries?`, async () => {
                  const uid = auth.currentUser?.uid;
                  if (!uid) return;
                  try {
                    toast.loading(`Deleting ${selectedIds.size} items...`, { id: 'bulk-delete' });
                    const deletePromises = [...selectedIds].map((id: string) => deleteDoc(doc(db, 'users', uid, 'udhaar', id)));
                    await Promise.all(deletePromises);
                    setSelectedIds(new Set());
                    toast.success('Selected entries deleted', { id: 'bulk-delete' });
                    await createNotification('Bulk Udhaar Deletion', `Deleted ${selectedIds.size} entries`, 'Delete');
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

      {showForm && <UdhaarForm onClose={() => { setShowForm(false); setEditingEntry(null); }} initialData={editingEntry || undefined} />}
      
      <div className="mt-4 space-y-2">
        {Object.entries<number>(summaries).map(([name, balance]) => (
          <div key={name} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
            <span className="font-semibold text-gray-800 dark:text-gray-200">{name}</span>
            <span className={`font-bold ${balance > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {balance > 0 ? `To get: ₹${balance}` : `To give: ₹${Math.abs(balance)}`}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        <h3 className="font-black text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500" /> All Entries
        </h3>
        {filtered.map((entry, idx) => (
          <motion.div 
            key={entry.id} 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass dark:glass-dark p-1 rounded-[2rem] shadow-sm flex items-center border-white/40 group relative overflow-hidden transition-all duration-300 ${
              selectedIds.has(entry.id) ? 'ring-2 ring-indigo-500/50' : ''
            }`}
          >
            {/* Checkbox */}
            <div 
              className="pl-4 pr-1 cursor-pointer"
              onClick={(e) => toggleSelect(entry.id, e)}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                selectedIds.has(entry.id) 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'border-gray-300 dark:border-gray-700'
              }`}>
                {selectedIds.has(entry.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Info className="w-3 h-3 rotate-45" /></motion.div>}
              </div>
            </div>

            <div 
              className="flex p-2 sm:p-4 items-center gap-3 sm:gap-4 cursor-pointer flex-1 bg-white/50 dark:bg-gray-800/50 rounded-[1.8rem] m-0.5"
              onClick={() => setSelectedForDetail(entry)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1">
                  <p className="font-black text-gray-900 dark:text-white truncate text-sm sm:text-base tracking-tight italic">
                    {entry.personName}
                  </p>
                  <div className="w-fit px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-gray-400">
                    {entry.category || 'Other'}
                  </div>
                </div>
                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/30"></span>
                  {format(new Date(entry.date), 'dd MMM')} • {entry.paymentMode}
                </p>
                {entry.note && <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 italic truncate line-clamp-1">{entry.note}</p>}
              </div>
              <div className="text-right px-1 sm:px-2 flex-shrink-0">
                <span className={`font-black text-base sm:text-xl italic tracking-tighter ${entry.type === 'You Got' ? 'text-emerald-500' : 'text-rose-500'}`}>
                   {entry.type === 'You Got' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center pr-3">
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   setEditingEntry(entry);
                   setShowForm(true);
                }} 
                className="p-3 text-gray-300 hover:text-amber-500 transition-colors sm:opacity-0 group-hover:opacity-100"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   confirmAction('Are you sure you want to delete this entry?', async () => {
                     handleDelete(entry.id);
                     await createNotification('Udhaar Entry Deleted', `Deleted entry for ${entry.personName}`, 'Delete');
                   });
                }} 
                className="p-3 text-gray-300 hover:text-red-500 transition-colors sm:opacity-0 group-hover:opacity-100"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedForDetail && (
          <DetailModal 
            data={selectedForDetail} 
            type="Udhaar" 
            onClose={() => setSelectedForDetail(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
