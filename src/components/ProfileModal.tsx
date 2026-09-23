import React, { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { X, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { createNotification } from '../lib/notificationsUtils';

interface Props {
  onClose: () => void;
  initialTab?: 'profile' | 'settings';
  isDarkMode: boolean;
  onToggleDarkMode: (val: boolean) => void;
}

export default function ProfileModal({ onClose, initialTab = 'profile', isDarkMode, onToggleDarkMode }: Props) {
  const user = auth.currentUser;
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>(initialTab);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setMobile(data.mobile || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Update Firebase Auth Profile
      await updateProfile(user, { displayName, photoURL });
      
      // Update Firestore User Document using setDoc with merge: true to ensure it works even if doc doesn't exist
      await setDoc(doc(db, 'users', user.uid), {
        fullName: displayName,
        photoURL,
        mobile: mobile
      }, { merge: true });

      await createNotification('Profile Updated', 'Your profile information has been updated successfully.', 'Profile');
      toast.success('Profile updated successfully');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        mobile: mobile
      }, { merge: true });
      await createNotification('Settings Updated', 'Your mobile number has been updated.', 'Profile');
      toast.success('Mobile number updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold mb-4 dark:text-white shrink-0">Account & Settings</h2>
        
        <div className="flex border-b border-gray-100 dark:border-gray-700 mb-6 shrink-0">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'profile' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            Preferences
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
          {activeTab === 'profile' ? (
            <form onSubmit={handleUpdate} className="space-y-4 pb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (Read Only)</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  readOnly 
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900/50 rounded-xl text-gray-500 dark:text-gray-500 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-0" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)} 
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
                  placeholder="Your Name" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photo URL</label>
                <input 
                  type="url" 
                  value={photoURL} 
                  onChange={e => setPhotoURL(e.target.value)} 
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
                  placeholder="https://example.com/photo.jpg" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  value={mobile} 
                  onChange={e => setMobile(e.target.value)} 
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
                  placeholder="+91 99999 99999" 
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 pb-4">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 font-mono text-[10px] uppercase tracking-widest text-indigo-500">Contact Details</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                      <Phone className="w-3 h-3" /> Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="tel" 
                        value={mobile} 
                        onChange={e => setMobile(e.target.value)} 
                        className="flex-1 p-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-xl text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-sm" 
                        placeholder="+91 99999 99999" 
                      />
                      <button 
                        onClick={handleUpdateSettings}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 font-mono text-[10px] uppercase tracking-widest text-indigo-500">Interface</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Customize how the application looks and feels.</p>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">Dark Mode</p>
                    <p className="text-xs text-gray-500">Toggle dark theme for the app</p>
                  </div>
                  <button 
                    onClick={() => onToggleDarkMode(!isDarkMode)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'translate-x-6' : ''}`}></div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Notifications</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notification preferences will be available soon.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
