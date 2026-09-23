import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, ChevronDown } from 'lucide-react';
import { exportToCSV, exportToExcel, exportToPDF } from '../lib/exportUtils';
import { motion, AnimatePresence } from 'motion/react';
import { createNotification } from '../lib/notificationsUtils';

interface ExportDropdownProps {
  data: any[];
  filename: string;
  title: string;
  userInfo?: { fullName?: string | null, email?: string | null, mobile?: string | null };
}

export default function ExportDropdown({ data, filename, title, userInfo }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { 
      label: 'Export to CSV', 
      icon: FileJson, 
      color: 'text-blue-500', 
      action: async () => {
        exportToCSV(data, filename);
        await createNotification('Data Exported', `Successfully exported ${title} as CSV`, 'Export');
      } 
    },
    { 
      label: 'Export to Excel', 
      icon: FileSpreadsheet, 
      color: 'text-emerald-500', 
      action: async () => {
        exportToExcel(data, filename);
        await createNotification('Data Exported', `Successfully exported ${title} as Excel`, 'Export');
      } 
    },
    { 
      label: 'Export to PDF', 
      icon: FileText, 
      color: 'text-rose-500', 
      action: async () => {
        exportToPDF(data, filename, title, userInfo);
        await createNotification('Data Exported', `Successfully exported ${title} as PDF`, 'Export');
      } 
    },
  ];

  return (
    <div className="relative inline-block w-full" ref={dropdownRef}>
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 p-3.5 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-600"
      >
        <Download className="w-5 h-5" /> Export Data <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-20 bottom-full left-0 right-0 mb-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden p-1.5"
          >
            {options.map((opt, i) => (
              <motion.button 
                key={i}
                whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.02)' }}
                onClick={() => { opt.action(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left rounded-xl"
              >
                <opt.icon className={`w-4 h-4 ${opt.color}`} />
                {opt.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
