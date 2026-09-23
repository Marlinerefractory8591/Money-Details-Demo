import { useState } from 'react';
import { CollegeFee } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import DetailModal from './DetailModal';
import { confirmAction } from '../lib/confirmToast';

import { Info, Trash2, Edit2 } from 'lucide-react';

interface Props {
  fees: CollegeFee[];
  onDelete: (id: string) => void;
  onEdit: (fee: CollegeFee) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

export default function CollegeFeeList({ fees, onDelete, onEdit, selectedIds, onToggleSelect }: Props) {
  const [selectedForDetail, setSelectedForDetail] = useState<CollegeFee | null>(null);

  return (
    <div className="space-y-4 mt-4">
      {fees.map(f => (
        <div 
          key={f.id} 
          className={`glass dark:glass-dark p-1 rounded-[2rem] shadow-sm flex items-center border-white/40 group relative overflow-hidden transition-all duration-300 ${
            selectedIds.has(f.id) ? 'ring-2 ring-indigo-500/50' : ''
          }`}
        >
          {/* Checkbox */}
          <div 
            className="pl-4 pr-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(f.id);
            }}
          >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              selectedIds.has(f.id) 
                ? 'bg-indigo-600 border-indigo-600 text-white' 
                : 'border-gray-300 dark:border-gray-700'
            }`}>
              {selectedIds.has(f.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Info className="w-3 h-3 rotate-45" /></motion.div>}
            </div>
          </div>

          <div 
            className="flex p-2 sm:p-4 items-center gap-3 sm:gap-4 cursor-pointer flex-1 bg-white/50 dark:bg-gray-800/50 rounded-[1.8rem] m-0.5"
            onClick={() => setSelectedForDetail(f)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 mb-1">
                <p className="font-black text-gray-900 dark:text-white truncate text-sm sm:text-base tracking-tight italic">
                  {f.collegeName}
                </p>
                <div className="w-fit px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-gray-400">
                  {f.paymentType}
                </div>
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/30"></span>
                {format(new Date(f.date), 'dd MMM')} • {f.paymentMode}
              </p>
            </div>
            <div className="text-right px-1 sm:px-2 flex-shrink-0">
              <span className="font-black text-base sm:text-xl italic tracking-tighter text-indigo-500">
                ₹{f.amount.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center pr-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(f);
              }} 
              className="p-3 text-gray-300 hover:text-indigo-500 transition-colors sm:opacity-0 group-hover:opacity-100"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                confirmAction('Are you sure you want to delete this payment record?', () => {
                  onDelete(f.id);
                });
              }} 
              className="p-3 text-gray-300 hover:text-rose-500 transition-colors sm:opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <AnimatePresence>
        {selectedForDetail && (
          <DetailModal 
            data={selectedForDetail} 
            type="College" 
            onClose={() => setSelectedForDetail(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
