import React, { useState } from 'react';
import { X, CheckCircle, Trash2, Info, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { AppNotification } from '../lib/notificationsUtils';
import { deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface Props {
  onClose: () => void;
  history: AppNotification[];
  onClearAll: () => void;
}

export default function HistoryModal({ onClose, history, onClearAll }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const getIcon = (type: string) => {
    switch(type) {
      case 'Add': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelected = async () => {
    const user = auth.currentUser;
    if (!user || selectedIds.size === 0) return;
    
    try {
      await Promise.all(Array.from(selectedIds).map((id: string) => 
        deleteDoc(doc(db, "users", user.uid, "notifications", id))
      ));
      toast.success('Selected history items cleared');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      toast.error('Failed to clear selected items');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 shadow-xl relative animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center flex-shrink-0 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold dark:text-white">Activity History</h2>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {history.length > 0 && (
              <>
                {isSelectionMode ? (
                  <>
                    <button 
                      onClick={() => {
                        const newSelection = history.length === selectedIds.size ? new Set<string>() : new Set(history.map(h => h.id));
                        setSelectedIds(newSelection);
                      }}
                      className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      {selectedIds.size === history.length ? 'Deselect All' : 'Select All'}
                    </button>
                    {selectedIds.size > 0 && (
                      <button onClick={clearSelected} className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                        Clear Selected ({selectedIds.size})
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedIds(new Set());
                      }} 
                      className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsSelectionMode(true)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                      Select
                    </button>
                    <button onClick={onClearAll} className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                      Clear All
                    </button>
                  </>
                )}
              </>
            )}
            <button onClick={onClose} className="p-2 ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              No history found yet.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border ${selectedIds.has(item.id) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-gray-700'} flex gap-4 text-sm transition-colors ${isSelectionMode ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800' : ''}`}
                  onClick={() => isSelectionMode && toggleSelect(item.id)}
                >
                  {isSelectionMode && (
                    <div className="mt-1">
                      {selectedIds.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  )}
                  {!isSelectionMode && <div className="mt-1">{getIcon(item.type)}</div>}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        {isSelectionMode && <span className="inline-block mt-0.5">{getIcon(item.type)}</span>}
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                        {format(new Date(item.date), 'PP p')}
                      </p>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
