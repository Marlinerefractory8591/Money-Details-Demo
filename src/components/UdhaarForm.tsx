import { useState } from 'react';
import React from 'react';
import { UdhaarEntry, UdhaarType, PaymentMode } from '../types';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createNotification } from '../lib/notificationsUtils';
import { motion } from 'motion/react';
import { X, UserPlus, Edit2 } from 'lucide-react';
import CategorySelector from './CategorySelector';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
  initialData?: UdhaarEntry;
}

export default function UdhaarForm({ onClose, initialData }: Props) {
  const [formData, setFormData] = useState({
    personName: initialData?.personName || '',
    category: initialData?.category || 'Personal',
    phoneNumber: initialData?.phoneNumber || '',
    amount: initialData?.amount.toString() || '',
    type: initialData?.type || 'You Gave' as UdhaarType,
    paymentMode: initialData?.paymentMode || 'Cash' as PaymentMode,
    note: initialData?.note || '',
    date: initialData ? format(new Date(initialData.date), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/udhaar`;
    try {
        // Add real-world seconds and ms to ensure proper chronological sorting for items added in the same minute
        const finalDate = new Date(formData.date);
        const now = new Date();
        finalDate.setSeconds(now.getSeconds());
        finalDate.setMilliseconds(now.getMilliseconds());

        const payload = {
          ...formData,
          amount: parseFloat(formData.amount),
          date: finalDate.toISOString(),
        };

        if (initialData?.id) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid, 'udhaar', initialData.id), payload);
          await createNotification('Udhaar Entry Updated', `Updated entry for ${formData.personName}`, 'Edit');
        } else {
          await addDoc(collection(db, path), payload);
          await createNotification('Udhaar Entry Added', `Added ${formData.type} for ${formData.personName} of ₹${formData.amount}`, 'Add');
        }
        onClose();
    } catch (error) {
        console.error('Firestore Error: ', error);
        throw new Error(JSON.stringify({ error: error instanceof Error ? error.message : String(error), operationType: initialData?.id ? 'update' : 'create', path }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl"></div>
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-2xl text-gray-900 dark:text-white flex items-center gap-3">
          {initialData ? <Edit2 className="w-6 h-6 text-amber-500" /> : <UserPlus className="w-6 h-6 text-amber-500" />} {initialData ? 'Update' : 'New'} Udhaar Entry
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Person Name</label>
            <input type="text" placeholder="Aditya Kumar" value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold" required />
          </div>
          <CategorySelector 
             type="Udhaar" 
             selected={formData.category} 
             onSelect={(cat) => setFormData({...formData, category: cat})} 
             label="Category (Optional)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone (Optional)</label>
            <input type="tel" placeholder="+91..." value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Action Type</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl">
              {(['You Gave', 'You Got'] as UdhaarType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`py-2 text-[10px] font-black rounded-xl transition-all ${
                    formData.type === type 
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-amber-600 dark:text-amber-400' 
                      : 'text-gray-400'
                  }`}
                >
                  {type === 'You Gave' ? 'GAVE (-) ' : 'GOT (+)'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
            <input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-black text-xl" required />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Mode</label>
            <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value as PaymentMode})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold bg-white dark:bg-gray-900">
              <option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option><option>Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date</label>
            <input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold" required />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Private Note</label>
          <input type="text" placeholder="What's this for?" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold" />
        </div>

        <div className="flex gap-4 pt-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 rounded-2xl font-black shadow-lg shadow-amber-100 dark:shadow-none transition-all"
          >
            {initialData ? 'Update' : 'Create'} Entry
          </motion.button>
          <button type="button" onClick={onClose} className="px-8 text-gray-400 font-bold hover:text-gray-600 transition-colors">Cancel</button>
        </div>
      </form>
    </motion.div>
  );
}
