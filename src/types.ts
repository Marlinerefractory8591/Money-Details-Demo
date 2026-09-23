export type TransactionType = 'Income' | 'Expense';
export type UdhaarType = 'You Gave' | 'You Got';
export type PaymentMode = 'Cash' | 'UPI' | 'Bank' | 'Card' | 'Other';
export type PaymentSource = 'Self' | 'Family' | 'Loan' | 'Scholarship' | 'Other';

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'Udhaar' | 'College';
  isCustom: boolean;
}

export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  mobile?: string;
  photoURL?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  note: string;
  date: string; // ISO string
  paymentMode: PaymentMode;
  userId?: string; 
}

export interface UdhaarEntry {
  id: string;
  personName: string;
  category?: string; // Optional as per prompt
  phoneNumber?: string;
  amount: number;
  type: UdhaarType;
  paymentMode: PaymentMode;
  note: string;
  date: string; // ISO string
}

export interface Budget {
  id: string;
  name?: string;
  category: string;
  amount: number;
  period: 'Daily' | 'Weekly' | 'Monthly';
  startDate: string; // ISO string
}

export interface CollegeFee {
  id: string;
  collegeName: string;
  paymentType: string;
  amount: number;
  date: string; // ISO string
  paymentMode: PaymentMode;
  paymentSource: PaymentSource;
  note: string;
  busNumber?: string;
  paymentDuration?: 'Monthly' | 'Yearly';
}
