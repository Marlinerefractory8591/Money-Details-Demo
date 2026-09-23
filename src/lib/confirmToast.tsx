import toast from 'react-hot-toast';
import React from 'react';

export const confirmAction = (message: string, onConfirm: () => void) => {
  toast((t) => (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => {
            toast.dismiss(t.id);
          }}
          className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            toast.dismiss(t.id);
            onConfirm();
          }}
          className="px-3 py-1.5 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  ), {
    duration: Infinity,
    position: 'top-center'
  });
};
