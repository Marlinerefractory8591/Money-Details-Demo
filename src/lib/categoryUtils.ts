import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Category } from '../types';

export const saveCustomCategory = async (name: string, type: Category['type']) => {
  if (!auth.currentUser) return;
  
  const path = `users/${auth.currentUser.uid}/categories`;
  
  // Check if it already exists
  const q = query(collection(db, path), where('name', '==', name), where('type', '==', type));
  const existing = await getDocs(q);
  
  if (existing.empty) {
    await addDoc(collection(db, path), {
      name,
      type,
      isCustom: true,
      createdAt: new Date().toISOString()
    });
  }
};

export const fetchCustomCategories = async (type: Category['type']): Promise<string[]> => {
  if (!auth.currentUser) return [];
  
  const path = `users/${auth.currentUser.uid}/categories`;
  const q = query(collection(db, path), where('type', '==', type));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => doc.data().name as string);
};
