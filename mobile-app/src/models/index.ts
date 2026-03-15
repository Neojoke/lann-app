import { Injectable } from '@angular/core';
import { User } from '../models';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isVerified: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
  dueDate: Date;
  remainingAmount: number;
}

export interface CreditInfo {
  total: number;
  used: number;
  available: number;
}
