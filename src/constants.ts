import { 
  Utensils, ShoppingBag, MapPin, Fuel, Home, FileText, 
  Zap, GraduationCap, HeartPulse, ShoppingCart, Clapperboard, 
  HelpCircle, Briefcase, TrendingUp, Gift, Landmark, 
  Users, User, Store, BookOpen, Clock, AlertTriangle, Bus
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export type CategoryType = 'Expense' | 'Income' | 'Udhaar' | 'College';

export interface CategoryDefinition {
  name: string;
  icon: LucideIcon;
}

export const DEFAULT_EXPENSE_CATEGORIES: CategoryDefinition[] = [
  { name: 'Food', icon: Utensils },
  { name: 'Grocery', icon: ShoppingBag },
  { name: 'Travel', icon: MapPin },
  { name: 'Fuel', icon: Fuel },
  { name: 'Rent', icon: Home },
  { name: 'Bills', icon: FileText },
  { name: 'Recharge', icon: Zap },
  { name: 'Education', icon: GraduationCap },
  { name: 'Medical', icon: HeartPulse },
  { name: 'Shopping', icon: ShoppingCart },
  { name: 'Entertainment', icon: Clapperboard },
  { name: 'Other', icon: HelpCircle },
];

export const DEFAULT_INCOME_CATEGORIES: CategoryDefinition[] = [
  { name: 'Salary', icon: Landmark },
  { name: 'Freelance', icon: Briefcase },
  { name: 'Business', icon: TrendingUp },
  { name: 'Gift', icon: Gift },
  { name: 'Interest', icon: TrendingUp },
  { name: 'Investment Return', icon: Landmark },
  { name: 'Family Support', icon: Users },
  { name: 'Other', icon: HelpCircle },
];

export const DEFAULT_UDHAAR_CATEGORIES: CategoryDefinition[] = [
  { name: 'Personal', icon: User },
  { name: 'Friends', icon: Users },
  { name: 'Family', icon: Users },
  { name: 'Shop', icon: Store },
  { name: 'Other', icon: HelpCircle },
];

export const DEFAULT_COLLEGE_CATEGORIES: CategoryDefinition[] = [
  { name: 'Semester Fee', icon: BookOpen },
  { name: 'Exam Fee', icon: FileText },
  { name: 'Late Fine', icon: AlertTriangle },
  { name: 'Hostel Fee', icon: Home },
  { name: 'Bus Fee', icon: Bus },
  { name: 'Other', icon: HelpCircle },
];
