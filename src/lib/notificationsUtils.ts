import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from './firebase';
import toast from 'react-hot-toast';

export type NotificationAction = 'Add' | 'Edit' | 'Delete' | 'Login' | 'Logout' | 'Export' | 'Signup' | 'Profile';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationAction;
  date: string;
  read: boolean;
}

export async function createNotification(title: string, message: string, type: NotificationAction) {
  if (!auth.currentUser) return;

  const notification = {
    title,
    message,
    type,
    date: new Date().toISOString(),
    read: false,
  };

  try {
    await addDoc(collection(db, 'users', auth.currentUser.uid, 'notifications'), notification);
    toast(message, {
      icon: type === 'Delete' ? '🗑️' : type === 'Add' ? '✅' : 'ℹ️',
      id: title + message + type
    });
  } catch (error) {
    console.error('Failed to save notification', error);
  }
}
