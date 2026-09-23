import { useState } from 'react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ArrowUpRight, ArrowDownLeft, Edit2, Info } from 'lucide-react';
import DetailModal from './DetailModal';
import { confirmAction } from '../lib/confirmToast';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string, t: Transaction) => void;
  onEdit: (t: Transaction) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete, onEdit, selectedIds, onToggleSelect }: Props) {
  const [selectedForDetail, setSelectedForDetail] = useState<Transaction | null>(null);

  return (
    <div className="space-y-3 mt-6">
      <AnimatePresence mode='popLayout'>
        {transactions.map((t, idx) => (
            <motion.div 
              key={t.id} 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="glass dark:glass-dark p-1 rounded-[2rem] shadow-sm flex items-center border-white/40 group relative overflow-hidden transition-all duration-300"
            >
              <div 
                className="pl-4 pr-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(t.id);
                }}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  selectedIds.has(t.id) 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'border-gray-300 dark:border-gray-700'
                }`}>
                  {selectedIds.has(t.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Info className="w-3 h-3 rotate-45" /></motion.div>}
                </div>
              </div>
              <div 
                className="flex p-2 sm:p-4 items-center gap-3 sm:gap-4 cursor-pointer flex-1 bg-white/50 dark:bg-gray-800/50 rounded-[1.8rem] m-0.5"
                onClick={() => setSelectedForDetail(t)}
              >
                <div className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-inner flex-shrink-0 ${t.type === 'Income' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white' : 'bg-gradient-to-br from-rose-400 to-red-500 text-white'}`}>
                  {t.type === 'Income' ? <ArrowUpRight className="w-5 h-5 font-black" /> : <ArrowDownLeft className="w-5 h-5 font-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1">
                    <p className="font-black text-gray-900 dark:text-white truncate text-sm sm:text-base tracking-tight italic">
                      {t.note || t.category}
                    </p>
                    <div className="w-fit px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-gray-400">
                      {t.category}
                    </div>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/30"></span>
                    {format(new Date(t.date), 'dd MMM')} • {t.paymentMode}
                  </p>
                </div>
                <div className="text-right px-1 sm:px-2 flex-shrink-0">
                  <span className={`font-black text-base sm:text-xl italic tracking-tighter ${t.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {t.type === 'Income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center pr-3">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(t);
                  }}
                  className="p-3 text-gray-300 hover:text-indigo-500 transition-colors sm:opacity-0 group-hover:opacity-100"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmAction('Are you sure you want to delete this transaction?', () => {
                      onDelete(t.id, t);
                    });
                  }} 
                  className="p-3 text-gray-300 hover:text-rose-500 transition-colors sm:opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {selectedForDetail && (
          <DetailModal 
            data={selectedForDetail} 
            type="Transaction" 
            onClose={() => setSelectedForDetail(null)} 
          />
        )}
      </AnimatePresence>
      {transactions.length === 0 && (
        <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem]">
          No matching transactions
        </div>
      )}
    </div>
  );
}
