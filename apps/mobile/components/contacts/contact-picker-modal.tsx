import { useState, useMemo } from 'react';
import { View, Text, Pressable, TextInput, FlatList, Modal } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Contact } from '@/types/contacts';
import { formatAddress } from '@/services/blockchain';

interface ContactPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: Contact) => void;
  contacts: Contact[];
}

export function ContactPickerModal({
  visible,
  onClose,
  onSelect,
  contacts,
}: ContactPickerModalProps) {
  const [search, setSearch] = useState('');

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;

    const searchLower = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.address.toLowerCase().includes(searchLower)
    );
  }, [contacts, search]);

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
    setSearch('');
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const renderContact = ({ item: contact }: { item: Contact }) => {
    const initial = contact.name.charAt(0).toUpperCase();
    const truncatedAddress = formatAddress(contact.address);
    const isInternal = contact.isInternal;

    return (
      <Pressable
        onPress={() => handleSelect(contact)}
        className="flex-row items-center gap-3 py-4 px-4 active:bg-wallet-card-light"
      >
        {/* Avatar */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isInternal ? 'bg-wallet-accent/30' : 'bg-wallet-accent/20'
          }`}
        >
          {isInternal ? (
            <Feather name="briefcase" size={18} color="#B8F25B" />
          ) : (
            <Text className="text-wallet-accent font-bold text-lg">{initial}</Text>
          )}
        </View>

        {/* Name and address */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-wallet-text font-semibold" numberOfLines={1}>
              {contact.name}
            </Text>
            {isInternal && (
              <View className="bg-wallet-accent/20 px-2 py-0.5 rounded">
                <Text className="text-wallet-accent text-xs font-medium">My Wallet</Text>
              </View>
            )}
          </View>
          <Text className="text-wallet-text-secondary text-sm font-mono">
            {truncatedAddress}
          </Text>
        </View>

        {/* Chevron */}
        <Feather name="chevron-right" size={18} color="#5C6660" />
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/60">
        <View className="flex-1 mt-20 bg-wallet-bg rounded-t-3xl overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-wallet-card">
            <Text className="text-wallet-text text-lg font-semibold">
              Select Contact
            </Text>
            <Pressable
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-wallet-card items-center justify-center"
            >
              <Feather name="x" size={18} color="#8B9A92" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="px-5 py-3">
            <View className="flex-row items-center bg-wallet-card rounded-xl px-4">
              <Feather name="search" size={18} color="#8B9A92" />
              <TextInput
                className="flex-1 text-wallet-text py-3 ml-3"
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or address"
                placeholderTextColor="#5C6660"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')}>
                  <Feather name="x-circle" size={16} color="#8B9A92" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Contact list */}
          <FlatList
            data={filteredContacts}
            renderItem={renderContact}
            keyExtractor={(contact) => contact.id}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="items-center py-10 px-6">
                <View className="w-16 h-16 rounded-full bg-wallet-card items-center justify-center mb-4">
                  <Feather name="users" size={28} color="#5C6660" />
                </View>
                <Text className="text-wallet-text-secondary text-center">
                  {search
                    ? 'No contacts found'
                    : 'No saved contacts yet.\nAdd contacts from Settings > Address Book'}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => (
              <View className="h-px bg-wallet-card mx-4" />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}
