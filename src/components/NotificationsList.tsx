import React, { useState } from 'react';
import { AppNotification } from '../lib/notificationsUtils';
import { format } from 'date-fns';
import { Bell, Info, CheckCircle, Trash2, LogIn, LogOut, CheckSquare, Square, Download, UserPlus, User } from 'lucide-react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

interface NotificationsListProps {
  notifications: AppNotification[];
  onClearAll: () => void;
}

export default function NotificationsList({ notifications, onClearAll }: NotificationsListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const getIcon = (type: string) => {
    switch(type) {
      case 'Add': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Delete': return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'Edit': return <Info className="w-4 h-4 text-blue-500" />;
      case 'Login': return <LogIn className="w-4 h-4 text-indigo-500" />;
      case 'Logout': return <LogOut className="w-4 h-4 text-gray-500" />;
      case 'Signup': return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'Export': return <Download className="w-4 h-4 text-purple-500" />;
      case 'Profile': return <User className="w-4 h-4 text-indigo-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
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
      toast.success('Selected notifications cleared');
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      toast.error('Failed to clear selected notifications');
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
        <h3 className="font-bold text-gray-700 dark:text-gray-200">Notifications</h3>
        <div className="flex items-center gap-3">
          {notifications.length > 0 && (
            <>
              {isSelectionMode ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newSelection = notifications.length === selectedIds.size ? new Set<string>() : new Set(notifications.map(n => n.id));
                      setSelectedIds(newSelection);
                    }}
                    className="text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {selectedIds.size === notifications.length ? 'None' : 'All'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelected();
                      }} 
                      className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSelectionMode(false);
                      setSelectedIds(new Set());
                    }} 
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSelectionMode(true);
                    }} 
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors"
                  >
                    Select
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearAll();
                    }} 
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="max-h-[350px] overflow-y-auto overflow-x-hidden custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              className={`p-3 border-b ${n.read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50/30 dark:bg-blue-900/10'} ${selectedIds.has(n.id) ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-inset ring-blue-200 dark:ring-blue-800' : 'border-gray-100 dark:border-gray-700'} hover:bg-gray-50 dark:hover:bg-gray-700/50 flex gap-3 text-sm transition-all duration-200 ${isSelectionMode ? 'cursor-pointer' : ''}`}
              onClick={() => isSelectionMode && toggleSelect(n.id)}
            >
              {isSelectionMode && (
                <div className="mt-0.5 flex-shrink-0">
                  {selectedIds.has(n.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              )}
              {!isSelectionMode && <div className="mt-0.5 flex-shrink-0">{getIcon(n.type)}</div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  {isSelectionMode && <span className="inline-block flex-shrink-0">{getIcon(n.type)}</span>}
                  <span className="truncate">{n.title}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400 break-words">{n.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{format(new Date(n.date), 'PP p')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
