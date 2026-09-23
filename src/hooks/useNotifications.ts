import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppNotification } from '../lib/notificationsUtils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { User } from 'firebase/auth';

export function useNotifications(user: User | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const path = `users/${user.uid}/notifications`;
    const q = query(
      collection(db, path),
      orderBy('date', 'desc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
      setNotifications(data);
      setUnreadCount(data.filter(n => n.read === false).length);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    const unreads = notifications.filter(n => n.read === false);
    try {
      await Promise.all(unreads.map(n => 
        updateDoc(doc(db, "users", user.uid, "notifications", n.id), {
          read: true
        })
      ));
    } catch (error) {
      console.error('Error updating notifications', error);
    }
  };

  const clearAll = async () => {
    if (!user) return;
    try {
      await Promise.all(notifications.map(n => 
        deleteDoc(doc(db, "users", user.uid, "notifications", n.id))
      ));
    } catch (error) {
      console.error('Error deleting notifications', error);
    }
  };

  return { notifications, unreadCount, markAllAsRead, clearAll };
}
