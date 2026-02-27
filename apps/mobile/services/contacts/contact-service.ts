import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAddress } from 'ethers';
import { Contact, ContactFormData } from '@/types/contacts';
import { Account } from '@/types/blockchain';
import { isValidAddress } from '@/services/blockchain';

const CONTACTS_STORAGE_KEY = '@pouch/address_book';
const MAX_NAME_LENGTH = 50;
const MAX_NOTES_LENGTH = 200;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getInternalContactId(accountIndex: number): string {
  return `internal-account-${accountIndex}`;
}

function checksumAddress(address: string): string {
  try {
    return getAddress(address);
  } catch {
    return address;
  }
}

function validateContactData(data: ContactFormData): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (data.name.length > MAX_NAME_LENGTH) {
    return { valid: false, error: `Name must be ${MAX_NAME_LENGTH} characters or less` };
  }

  if (!data.address || data.address.trim().length === 0) {
    return { valid: false, error: 'Address is required' };
  }

  if (!isValidAddress(data.address)) {
    return { valid: false, error: 'Invalid Ethereum address' };
  }

  if (data.notes && data.notes.length > MAX_NOTES_LENGTH) {
    return { valid: false, error: `Notes must be ${MAX_NOTES_LENGTH} characters or less` };
  }

  return { valid: true };
}

/**
 * Get stored (user-created) contacts only
 */
async function getStoredContacts(): Promise<Contact[]> {
  try {
    const data = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting stored contacts:', error);
    return [];
  }
}

/**
 * Get all contacts including internal wallet accounts
 */
export async function getContacts(accounts?: Account[]): Promise<Contact[]> {
  try {
    const storedContacts = await getStoredContacts();

    // Create internal contacts from wallet accounts
    const internalContacts: Contact[] = (accounts || []).map((account) => ({
      id: getInternalContactId(account.index),
      name: account.name,
      address: account.address,
      notes: 'My wallet account',
      createdAt: 0,
      updatedAt: 0,
      usageCount: 0,
      isInternal: true,
      accountIndex: account.index,
    }));

    // Combine and sort: internal contacts first, then by usage count, then by name
    const allContacts = [...internalContacts, ...storedContacts];

    return allContacts.sort((a, b) => {
      // Internal contacts first
      if (a.isInternal && !b.isInternal) return -1;
      if (!a.isInternal && b.isInternal) return 1;

      // Then by usage count (descending)
      if (b.usageCount !== a.usageCount) {
        return b.usageCount - a.usageCount;
      }

      // Then by name
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
}

export async function addContact(
  data: ContactFormData,
  accounts?: Account[]
): Promise<{ contact?: Contact; error?: string }> {
  const validation = validateContactData(data);
  if (!validation.valid) {
    return { error: validation.error };
  }

  try {
    const storedContacts = await getStoredContacts();
    const checksummedAddress = checksumAddress(data.address.trim());

    // Check for duplicate address in stored contacts
    const existingContact = storedContacts.find(
      (c) => c.address.toLowerCase() === checksummedAddress.toLowerCase()
    );
    if (existingContact) {
      return { error: `Address already saved as "${existingContact.name}"` };
    }

    // Check if address belongs to an internal account
    const internalAccount = (accounts || []).find(
      (acc) => acc.address.toLowerCase() === checksummedAddress.toLowerCase()
    );
    if (internalAccount) {
      return { error: `This is your own wallet address (${internalAccount.name})` };
    }

    const now = Date.now();
    const newContact: Contact = {
      id: generateId(),
      name: data.name.trim(),
      address: checksummedAddress,
      notes: data.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      isInternal: false,
    };

    const updated = [newContact, ...storedContacts];
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updated));

    return { contact: newContact };
  } catch (error) {
    console.error('Error adding contact:', error);
    return { error: 'Failed to save contact' };
  }
}

export async function updateContact(
  id: string,
  data: Partial<ContactFormData>,
  accounts?: Account[]
): Promise<{ contact?: Contact; error?: string }> {
  // Prevent updating internal contacts
  if (id.startsWith('internal-')) {
    return { error: 'Cannot edit wallet account contacts' };
  }

  try {
    const storedContacts = await getStoredContacts();
    const index = storedContacts.findIndex((c) => c.id === id);

    if (index === -1) {
      return { error: 'Contact not found' };
    }

    const existing = storedContacts[index];
    const updatedData: ContactFormData = {
      name: data.name ?? existing.name,
      address: data.address ?? existing.address,
      notes: data.notes ?? existing.notes,
    };

    const validation = validateContactData(updatedData);
    if (!validation.valid) {
      return { error: validation.error };
    }

    const checksummedAddress = checksumAddress(updatedData.address.trim());

    // Check for duplicate address (excluding current contact)
    const duplicate = storedContacts.find(
      (c) => c.id !== id && c.address.toLowerCase() === checksummedAddress.toLowerCase()
    );
    if (duplicate) {
      return { error: `Address already saved as "${duplicate.name}"` };
    }

    // Check if new address belongs to an internal account
    const internalAccount = (accounts || []).find(
      (acc) => acc.address.toLowerCase() === checksummedAddress.toLowerCase()
    );
    if (internalAccount) {
      return { error: `This is your own wallet address (${internalAccount.name})` };
    }

    const updatedContact: Contact = {
      ...existing,
      name: updatedData.name.trim(),
      address: checksummedAddress,
      notes: updatedData.notes?.trim() || undefined,
      updatedAt: Date.now(),
    };

    storedContacts[index] = updatedContact;
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(storedContacts));

    return { contact: updatedContact };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { error: 'Failed to update contact' };
  }
}

export async function deleteContact(id: string): Promise<{ success: boolean; error?: string }> {
  // Prevent deleting internal contacts
  if (id.startsWith('internal-')) {
    return { success: false, error: 'Cannot delete wallet account contacts' };
  }

  try {
    const storedContacts = await getStoredContacts();
    const index = storedContacts.findIndex((c) => c.id === id);

    if (index === -1) {
      return { success: false, error: 'Contact not found' };
    }

    storedContacts.splice(index, 1);
    await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(storedContacts));

    return { success: true };
  } catch (error) {
    console.error('Error deleting contact:', error);
    return { success: false, error: 'Failed to delete contact' };
  }
}

export async function getContactByAddress(
  address: string,
  accounts?: Account[]
): Promise<Contact | null> {
  try {
    const contacts = await getContacts(accounts);
    return contacts.find(
      (c) => c.address.toLowerCase() === address.toLowerCase()
    ) || null;
  } catch (error) {
    console.error('Error getting contact by address:', error);
    return null;
  }
}

export async function getContactById(
  id: string,
  accounts?: Account[]
): Promise<Contact | null> {
  try {
    const contacts = await getContacts(accounts);
    return contacts.find((c) => c.id === id) || null;
  } catch (error) {
    console.error('Error getting contact by id:', error);
    return null;
  }
}

export async function incrementUsage(id: string): Promise<void> {
  // Don't track usage for internal contacts
  if (id.startsWith('internal-')) {
    return;
  }

  try {
    const storedContacts = await getStoredContacts();
    const index = storedContacts.findIndex((c) => c.id === id);

    if (index !== -1) {
      storedContacts[index] = {
        ...storedContacts[index],
        usageCount: storedContacts[index].usageCount + 1,
        lastUsedAt: Date.now(),
      };
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(storedContacts));
    }
  } catch (error) {
    console.error('Error incrementing contact usage:', error);
  }
}

export async function clearContacts(): Promise<void> {
  await AsyncStorage.removeItem(CONTACTS_STORAGE_KEY);
}
