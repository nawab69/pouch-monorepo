export interface Contact {
  id: string;
  name: string;
  address: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  lastUsedAt?: number;
  isInternal?: boolean; // true for wallet accounts
  accountIndex?: number; // index of the wallet account (for internal contacts)
}

export interface ContactFormData {
  name: string;
  address: string;
  notes?: string;
}
