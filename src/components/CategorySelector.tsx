import { useState, useEffect } from 'react';
import { 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES, 
  DEFAULT_UDHAAR_CATEGORIES, 
  DEFAULT_COLLEGE_CATEGORIES,
  CategoryType
} from '../constants';
import { fetchCustomCategories, saveCustomCategory } from '../lib/categoryUtils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Plus, HelpCircle } from 'lucide-react';

interface Props {
  type: CategoryType;
  selected: string;
  onSelect: (category: string) => void;
  label?: string;
  required?: boolean;
  allowAll?: boolean;
}

export default function CategorySelector({ type, selected, onSelect, label = 'Category', required = false, allowAll = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');

  let defaults = 
    type === 'Expense' ? DEFAULT_EXPENSE_CATEGORIES :
    type === 'Income' ? DEFAULT_INCOME_CATEGORIES :
    type === 'Udhaar' ? DEFAULT_UDHAAR_CATEGORIES :
    DEFAULT_COLLEGE_CATEGORIES;

  if (allowAll) {
    defaults = [{ name: 'All', icon: HelpCircle }, ...defaults];
  }

  useEffect(() => {
    const loadCustom = async () => {
      const cats = await fetchCustomCategories(type === 'Expense' || type === 'Income' ? type : (type as any));
      setCustomCategories(cats);
    };
    loadCustom();
  }, [type]);

  const allCategoryNames = [...defaults.map(d => d.name), ...customCategories];

  const handleSelect = (category: string) => {
    if (category === 'Other') {
      setShowCustomInput(true);
      setIsOpen(false);
    } else {
      onSelect(category);
      setIsOpen(false);
      setShowCustomInput(false);
    }
  };

  const handleAddCustom = async () => {
    if (customValue.trim()) {
      await saveCustomCategory(customValue.trim(), type === 'Expense' || type === 'Income' ? type : (type as any));
      setCustomCategories([...customCategories, customValue.trim()]);
      onSelect(customValue.trim());
      setCustomValue('');
      setShowCustomInput(false);
    }
  };

  const SelectedIcon = defaults.find(d => d.name === selected)?.icon || HelpCircle;

  return (
    <div className="relative">
      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
        {label}
      </label>

      {showCustomInput ? (
        <div className="flex gap-2">
          <input 
            autoFocus
            type="text" 
            placeholder="Custom category name..." 
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            className="flex-1 p-4 border border-indigo-200 dark:border-indigo-900 dark:bg-gray-900 rounded-2xl dark:text-gray-100 outline-none font-bold"
          />
          <button 
            type="button"
            onClick={handleAddCustom}
            className="bg-indigo-600 text-white px-6 rounded-2xl font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Save
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-4 border border-gray-100 dark:border-gray-700 dark:bg-gray-900 rounded-2xl dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                <SelectedIcon className="w-4 h-4 text-indigo-500" />
              </div>
              <span>{selected || 'Select Category'}</span>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute z-20 top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl max-h-64 overflow-y-auto p-2 grid grid-cols-2 gap-1"
                >
                  {defaults.map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => handleSelect(cat.name)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                        selected === cat.name 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <cat.icon className="w-4 h-4 opacity-70" />
                      {cat.name}
                    </button>
                  ))}
                  {customCategories.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelect(name)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                        selected === name 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Plus className="w-4 h-4 opacity-70" />
                      {name}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
