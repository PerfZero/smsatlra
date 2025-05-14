export interface User {
  iin: string;
  phoneNumber: string;
  name?: string;
  fullName?: string;
  balance: number;
  selectedPackage?: TourPackage;
  isFirstLogin: boolean;
  role: 'USER' | 'ADMIN';
}

export interface TourPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  type: 'Hajj' | 'Umrah';
  hotel: string;
}

export interface Transaction {
  id: string;
  amount: number;
  date: string;
  payerIIN: string;
  payerName: string;
  recipientIIN: string;
  paymentMethod: 'Kaspi';
}

export interface SavingsGoal {
  targetAmount: number;
  currentAmount: number;
  packageId: string;
  recipientIIN: string;
  recipientName: string;
  estimatedCompletionDate?: string;
} 