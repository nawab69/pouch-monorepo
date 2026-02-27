import { useState, useEffect, useCallback } from 'react';
import { Contact, ContactFormData } from '@/types/contacts';
import { useWallet } from '@/hooks/use-wallet';
import {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  getContactByAddress,
  incrementUsage,
} from '@/services/contacts';

export function useContacts() {
  const { accounts } = useWallet();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getContacts(accounts);
      setContacts(data);
    } catch (err) {
      setError('Failed to load contacts');
      console.error('Error loading contacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [accounts]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const add = useCallback(async (data: ContactFormData): Promise<{ success: boolean; error?: string }> => {
    const result = await addContact(data, accounts);
    if (result.contact) {
      await loadContacts();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [loadContacts, accounts]);

  const update = useCallback(async (
    id: string,
    data: Partial<ContactFormData>
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await updateContact(id, data, accounts);
    if (result.contact) {
      await loadContacts();
      return { success: true };
    }
    return { success: false, error: result.error };
  }, [loadContacts, accounts]);

  const remove = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    const result = await deleteContact(id);
    if (result.success) {
      await loadContacts();
    }
    return result;
  }, [loadContacts]);

  const findByAddress = useCallback(async (address: string): Promise<Contact | null> => {
    return getContactByAddress(address, accounts);
  }, [accounts]);

  const recordUsage = useCallback(async (id: string): Promise<void> => {
    await incrementUsage(id);
    await loadContacts();
  }, [loadContacts]);

  return {
    contacts,
    isLoading,
    error,
    refresh: loadContacts,
    addContact: add,
    updateContact: update,
    deleteContact: remove,
    findByAddress,
    recordUsage,
  };
}
