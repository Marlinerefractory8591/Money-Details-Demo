import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, CreditCard, Tag, User, FileText, Info, IndianRupee, Hash } from 'lucide-react';
import { format } from 'date-fns';

interface DetailFieldProps {
  icon: any;
  label: string;
  value: string | number | React.ReactNode;
  color?: string;
}

const DetailField = ({ icon: Icon, label, value, color = "text-gray-400" }: DetailFieldProps) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
    <div className={`p-2 rounded-xl bg-white dark:bg-gray-900 shadow-sm ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{label}</p>
      <div className="font-bold text-gray-900 dark:text-gray-100 italic">
        {value}
      </div>
    </div>
  </div>
);

interface Props {
  data: any;
  type: 'Transaction' | 'Udhaar' | 'College';
  onClose: () => void;
}

export default function DetailModal({ data, type, onClose }: Props) {
  if (!data) return null;

  const isIncome = data.type === 'Income' || data.type === 'You Got';
  const isExpense = data.type === 'Expense' || data.type === 'You Gave';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-gray-800"
        >
          {/* Header/Banner */}
          <div className={`h-32 relative flex items-center justify-center ${
            isIncome ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 
            isExpense ? 'bg-gradient-to-br from-rose-400 to-red-500' :
            'bg-gradient-to-br from-indigo-500 to-purple-600'
          }`}>
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
                {type} Details
              </p>
              <h2 className="text-4xl font-black text-white italic tracking-tighter">
                ₹{data.amount?.toLocaleString()}
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 gap-4">
              {type === 'Transaction' && (
                <>
                  <DetailField icon={Tag} label="Category" value={data.category} color="text-indigo-500" />
                  <DetailField icon={FileText} label="Note / Remark" value={data.note || 'No description provided'} color="text-amber-500" />
                  <DetailField icon={CreditCard} label="Payment Mode" value={data.paymentMode} color="text-blue-500" />
                  <DetailField icon={Calendar} label="Date & Time" value={format(new Date(data.date), 'PPPP p')} color="text-purple-500" />
                </>
              )}

              {type === 'Udhaar' && (
                <>
                  <DetailField icon={User} label="Person Name" value={data.personName} color="text-indigo-500" />
                  <DetailField icon={Hash} label="Operation" value={data.type} color={isIncome ? "text-emerald-500" : "text-rose-500"} />
                  <DetailField icon={Tag} label="Category" value={data.category || 'Other'} color="text-amber-500" />
                  <DetailField icon={CreditCard} label="Payment Mode" value={data.paymentMode} color="text-blue-500" />
                  {data.phoneNumber && <DetailField icon={Info} label="Phone Number" value={data.phoneNumber} color="text-teal-500" />}
                  <DetailField icon={FileText} label="Note" value={data.note || 'No note added'} color="text-gray-500" />
                  <DetailField icon={Calendar} label="Date" value={format(new Date(data.date), 'PPPP p')} color="text-purple-500" />
                </>
              )}

              {type === 'College' && (
                <>
                  <DetailField icon={Info} label="College Name" value={data.collegeName} color="text-indigo-500" />
                  <DetailField icon={Tag} label="Fee Type" value={data.paymentType} color="text-amber-500" />
                  <DetailField icon={IndianRupee} label="Payment Source" value={data.paymentSource} color="text-teal-500" />
                  <DetailField icon={CreditCard} label="Payment Mode" value={data.paymentMode} color="text-blue-500" />
                  <DetailField icon={Calendar} label="Date" value={format(new Date(data.date), 'PPPP p')} color="text-purple-500" />
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 p-4 bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
