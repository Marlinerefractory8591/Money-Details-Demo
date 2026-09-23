import { useState } from 'react';
import React from 'react';
import { CollegeFee, PaymentMode, PaymentSource } from '../types';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createNotification } from '../lib/notificationsUtils';
import { motion } from 'motion/react';
import { X, GraduationCap, Edit2 } from 'lucide-react';
import CategorySelector from './CategorySelector';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
  initialData?: CollegeFee;
}

export default function CollegeFeeForm({ onClose, initialData }: Props) {
  const [formData, setFormData] = useState({
    collegeName: initialData?.collegeName || '',
    paymentType: initialData?.paymentType || 'Semester Fee',
    amount: initialData?.amount.toString() || '',
    paymentMode: initialData?.paymentMode || 'Cash' as PaymentMode,
    paymentSource: initialData?.paymentSource || 'Self' as PaymentSource,
    note: initialData?.note || '',
    busNumber: initialData?.busNumber || '',
    paymentDuration: initialData?.paymentDuration || 'Monthly' as 'Monthly' | 'Yearly',
    date: initialData ? format(new Date(initialData.date), "yyyy-MM-dd'T'HH:mm") : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    const path = `users/${auth.currentUser.uid}/college_fees`;
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
        await updateDoc(doc(db, 'users', auth.currentUser.uid, 'college_fees', initialData.id), payload);
        await createNotification('Fee Payment Updated', `Updated ${formData.paymentType} of ₹${formData.amount}`, 'Edit');
      } else {
        await addDoc(collection(db, path), payload);
        await createNotification('Fee Payment Added', `Added ${formData.paymentType} of ₹${formData.amount}`, 'Add');
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
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-2xl text-gray-900 dark:text-white flex items-center gap-3">
          {initialData ? <Edit2 className="w-6 h-6 text-indigo-500" /> : <GraduationCap className="w-6 h-6 text-indigo-500" />} {initialData ? 'Update' : 'New'} College Fee Record
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">College/Institution</label>
            <input type="text" placeholder="IIT Bombay" value={formData.collegeName} onChange={e => setFormData({...formData, collegeName: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" required />
          </div>
          <CategorySelector 
             type="College" 
             selected={formData.paymentType} 
             onSelect={(cat) => setFormData({...formData, paymentType: cat})} 
             label="Fee Category"
          />
        </div>

        {formData.paymentType === 'Bus Fee' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Bus Route / No.</label>
              <input type="text" placeholder="Route 45A" value={formData.busNumber} onChange={e => setFormData({...formData, busNumber: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Duration</label>
              <select value={formData.paymentDuration} onChange={e => setFormData({...formData, paymentDuration: e.target.value as 'Monthly' | 'Yearly'})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold bg-white dark:bg-gray-900">
                <option>Monthly</option>
                <option>Yearly</option>
              </select>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
            <input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-xl" required />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Mode</label>
            <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value as PaymentMode})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold bg-white dark:bg-gray-900">
              <option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Funds Source</label>
            <select value={formData.paymentSource} onChange={e => setFormData({...formData, paymentSource: e.target.value as PaymentSource})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold bg-white dark:bg-gray-900">
              <option>Self</option><option>Family</option><option>Loan</option><option>Scholarship</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date Paid</label>
            <input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" required />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Remarks</label>
          <input type="text" placeholder="Any additional details..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" />
        </div>

        <div className="flex gap-4 pt-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white p-4 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
          >
            {initialData ? 'Update' : 'Save'} Record
          </motion.button>
          <button type="button" onClick={onClose} className="px-8 text-gray-400 font-bold hover:text-gray-600 transition-colors">Cancel</button>
        </div>
      </form>
    </motion.div>
  );
}
