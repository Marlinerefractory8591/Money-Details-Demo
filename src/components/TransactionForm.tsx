import { useState, useEffect } from 'react';
import React from 'react';
import { Transaction, PaymentMode, TransactionType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import CategorySelector from './CategorySelector';
import { format } from 'date-fns';

interface Props {
  onAdd: (t: Transaction) => void;
  onClose: () => void;
  initialData?: Transaction;
}

export default function TransactionForm({ onAdd, onClose, initialData }: Props) {
  const [formData, setFormData] = useState({
    amount: initialData?.amount.toString() || '',
    type: initialData?.type || 'Expense' as TransactionType,
    category: initialData?.category || '',
    note: initialData?.note || '',
    paymentMode: initialData?.paymentMode || 'Cash' as PaymentMode,
    date: initialData 
      ? format(new Date(initialData.date), "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  });

  // Set default category when type changes if not already set or if it's a default one
  useEffect(() => {
    if (!formData.category || formData.category === 'General') {
      setFormData(prev => ({ 
        ...prev, 
        category: prev.type === 'Expense' ? 'Food' : 'Salary' 
      }));
    }
  }, [formData.type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add real-world seconds and ms to ensure proper chronological sorting for items added in the same minute
    const finalDate = new Date(formData.date);
    const now = new Date();
    finalDate.setSeconds(now.getSeconds());
    finalDate.setMilliseconds(now.getMilliseconds());

    onAdd({
      id: initialData?.id || uuidv4(),
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      note: formData.note,
      date: finalDate.toISOString(),
      paymentMode: formData.paymentMode,
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-[2.5rem] shadow-2xl space-y-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl"></div>
      
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-2xl text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-500" /> {initialData ? 'Update' : 'New'} Transaction
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl">
              {(['Income', 'Expense'] as TransactionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    formData.type === type 
                      ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-8">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Amount (₹)</label>
            <input type="number" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-xl" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CategorySelector 
            type={formData.type} 
            selected={formData.category} 
            onSelect={(cat) => setFormData({...formData, category: cat})} 
          />
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Payment Mode</label>
            <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value as PaymentMode})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold bg-white dark:bg-gray-900">
              <option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option><option>Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date & Time</label>
          <input type="datetime-local" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" required />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Note (Optional)</label>
          <input type="text" placeholder="Add a description..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" />
        </div>

        <div className="flex gap-4 pt-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white p-4 rounded-2xl font-black shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
          >
            {initialData ? 'Update' : 'Add'} Transaction
          </motion.button>
          <button type="button" onClick={onClose} className="px-8 text-gray-400 font-bold hover:text-gray-600 transition-colors">Cancel</button>
        </div>
      </form>
    </motion.div>
  );
}
