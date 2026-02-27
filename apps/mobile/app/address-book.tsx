import { useState } from 'react';
import { View, Text, Pressable, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { useContacts } from '@/hooks/use-contacts';
import { ContactItem } from '@/components/contacts/contact-item';
import { ContactFormModal } from '@/components/contacts/contact-form-modal';
import { Contact, ContactFormData } from '@/types/contacts';

export default function AddressBookScreen() {
  const router = useRouter();
  const {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
  } = useContacts();

  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleAdd = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleDelete = (contact: Contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete "${contact.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteContact(contact.id);
            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('Error', result.error || 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const handleSave = async (data: ContactFormData) => {
    if (editingContact) {
      return updateContact(editingContact.id, data);
    }
    return addContact(data);
  };

  const renderContact = ({ item: contact }: { item: Contact }) => (
    <ContactItem
      contact={contact}
      onEdit={() => handleEdit(contact)}
      onDelete={() => handleDelete(contact)}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>

        <Text className="text-xl font-bold text-wallet-text">
          Address Book
        </Text>

        <Pressable
          onPress={handleAdd}
          className="w-10 h-10 rounded-full bg-wallet-accent items-center justify-center"
        >
          <Feather name="plus" size={20} color="#0A0A0A" />
        </Pressable>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-wallet-text-secondary">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={(contact) => contact.id}
          className="flex-1 px-5"
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 40,
            gap: 12,
          }}
          ListEmptyComponent={
            <View className="items-center py-16 px-6">
              <View className="w-20 h-20 rounded-full bg-wallet-card items-center justify-center mb-6">
                <Feather name="users" size={36} color="#5C6660" />
              </View>
              <Text className="text-wallet-text text-xl font-semibold mb-2">
                No External Contacts
              </Text>
              <Text className="text-wallet-text-secondary text-center mb-6">
                Your wallet accounts appear automatically. Add external addresses for quick access when sending tokens.
              </Text>
              <Pressable
                onPress={handleAdd}
                className="flex-row items-center gap-2 bg-wallet-accent px-6 py-3 rounded-xl"
              >
                <Feather name="plus" size={18} color="#0A0A0A" />
                <Text className="text-wallet-bg font-semibold">Add Contact</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Contact Form Modal */}
      <ContactFormModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        contact={editingContact}
      />
    </SafeAreaView>
  );
}
