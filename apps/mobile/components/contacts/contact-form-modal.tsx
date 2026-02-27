import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { Contact, ContactFormData } from '@/types/contacts';
import { isValidAddress } from '@/services/blockchain';

interface ContactFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ContactFormData) => Promise<{ success: boolean; error?: string }>;
  contact?: Contact | null;
}

export function ContactFormModal({
  visible,
  onClose,
  onSave,
  contact,
}: ContactFormModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!contact;

  // Reset form when modal opens/closes or contact changes
  useEffect(() => {
    if (visible) {
      if (contact) {
        setName(contact.name);
        setAddress(contact.address);
        setNotes(contact.notes || '');
      } else {
        setName('');
        setAddress('');
        setNotes('');
      }
      setError(null);
    }
  }, [visible, contact]);

  const handlePasteAddress = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setAddress(text.trim());
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  const handleSave = async () => {
    // Validate
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!address.trim()) {
      setError('Address is required');
      return;
    }

    if (!isValidAddress(address.trim())) {
      setError('Invalid Ethereum address');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const result = await onSave({
        name: name.trim(),
        address: address.trim(),
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        setError(result.error || 'Failed to save contact');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError('Failed to save contact');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = name.trim().length > 0 && address.trim().length > 0 && !isSaving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/60">
          <View className="flex-1 mt-20 bg-wallet-bg rounded-t-3xl overflow-hidden">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-wallet-card">
              <Text className="text-wallet-text text-lg font-semibold">
                {isEditing ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-wallet-card items-center justify-center"
                disabled={isSaving}
              >
                <Feather name="x" size={18} color="#8B9A92" />
              </Pressable>
            </View>

            {/* Form */}
            <ScrollView className="flex-1 px-5 py-6" keyboardShouldPersistTaps="handled">
              {/* Error message */}
              {error && (
                <View className="bg-wallet-negative/20 rounded-xl p-4 mb-4">
                  <Text className="text-wallet-negative text-sm">{error}</Text>
                </View>
              )}

              {/* Name input */}
              <View className="mb-5">
                <Text className="text-wallet-text-secondary text-sm mb-2">
                  Name
                </Text>
                <View className="bg-wallet-card rounded-xl">
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Contact name"
                    placeholderTextColor="#5C6660"
                    className="px-4 py-4 text-wallet-text"
                    autoCapitalize="words"
                    maxLength={50}
                  />
                </View>
              </View>

              {/* Address input */}
              <View className="mb-5">
                <Text className="text-wallet-text-secondary text-sm mb-2">
                  Ethereum Address
                </Text>
                <View className="bg-wallet-card rounded-xl flex-row items-center">
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="0x..."
                    placeholderTextColor="#5C6660"
                    className="flex-1 px-4 py-4 text-wallet-text font-mono text-sm"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={handlePasteAddress}
                    className="px-4 py-4"
                    hitSlop={8}
                  >
                    <Feather name="clipboard" size={18} color="#8B9A92" />
                  </Pressable>
                </View>
              </View>

              {/* Notes input */}
              <View className="mb-5">
                <Text className="text-wallet-text-secondary text-sm mb-2">
                  Notes (optional)
                </Text>
                <View className="bg-wallet-card rounded-xl">
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Add a note..."
                    placeholderTextColor="#5C6660"
                    className="px-4 py-4 text-wallet-text"
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                  />
                </View>
                <Text className="text-wallet-text-muted text-xs mt-1 text-right">
                  {notes.length}/200
                </Text>
              </View>
            </ScrollView>

            {/* Save button */}
            <View className="px-5 pb-8 pt-4 border-t border-wallet-card">
              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                className={`py-4 rounded-xl items-center ${
                  canSave ? 'bg-wallet-accent' : 'bg-wallet-card-light'
                }`}
              >
                <Text
                  className={`font-semibold text-lg ${
                    canSave ? 'text-wallet-bg' : 'text-wallet-text-secondary'
                  }`}
                >
                  {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Contact'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
