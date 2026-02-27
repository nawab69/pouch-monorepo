import { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Account } from '@/types/blockchain';
import { formatAddress } from '@/services/blockchain';
import { PinConfirmModal } from '@/components/pin-confirm-modal';

interface AccountSwitcherProps {
  visible: boolean;
  onClose: () => void;
  onOpen: () => void;
  accounts: Account[];
  selectedAccount: Account | null;
  onSelectAccount: (index: number) => void;
  onAddAccount: (pin: string) => Promise<Account>;
  onRenameAccount: (index: number, name: string) => void;
}

export function AccountSwitcher({
  visible,
  onClose,
  onOpen,
  accounts,
  selectedAccount,
  onSelectAccount,
  onAddAccount,
  onRenameAccount,
}: AccountSwitcherProps) {
  const [isAdding, _setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleSelectAccount = (index: number) => {
    onSelectAccount(index);
    onClose();
  };

  const handleAddAccountPress = () => {
    // Close account switcher before opening PIN modal to avoid nested modal issues
    onClose();
    // Small delay to let the account switcher close before opening PIN modal
    setTimeout(() => {
      setShowPinModal(true);
    }, 150);
  };

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    try {
      await onAddAccount(pin);
      // Success - close PIN modal and reopen account switcher
      setShowPinModal(false);
      // Small delay to let PIN modal close before reopening account switcher
      setTimeout(() => {
        onOpen();
      }, 150);
      return true;
    } catch (error) {
      console.error('Error adding account:', error);
      // PIN was wrong or other error - return false to show error in modal
      return false;
    }
  };

  const handlePinClose = () => {
    setShowPinModal(false);
  };

  const handleStartEdit = (account: Account) => {
    setEditingIndex(account.index);
    setEditName(account.name);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editName.trim()) {
      onRenameAccount(editingIndex, editName.trim());
    }
    setEditingIndex(null);
    setEditName('');
  };

  const handleCopyAddress = async (address: string, index: number) => {
    await Clipboard.setStringAsync(address);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable
          className="flex-1 bg-black/60 justify-end"
          onPress={onClose}
        >
          <Pressable
            className="bg-wallet-card rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-5">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-xl font-bold text-wallet-text">
                  Accounts
                </Text>
                <Pressable
                  onPress={onClose}
                  className="w-8 h-8 rounded-full bg-wallet-card-light items-center justify-center"
                >
                  <Feather name="x" size={18} color="#8E8E93" />
                </Pressable>
              </View>

              {/* Account List */}
              <View className="gap-2 mb-4">
                {accounts.map((account) => {
                  const isSelected = selectedAccount?.index === account.index;
                  const isEditing = editingIndex === account.index;
                  const isCopied = copiedIndex === account.index;

                  return (
                    <Pressable
                      key={account.index}
                      onPress={() => handleSelectAccount(account.index)}
                      className={`p-4 rounded-xl ${
                        isSelected
                          ? 'bg-wallet-accent/10 border border-wallet-accent'
                          : 'bg-wallet-card-light'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3 flex-1">
                          {/* Avatar */}
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center"
                            style={{
                              backgroundColor: isSelected ? '#B8F25B' : '#3A3A3C',
                            }}
                          >
                            <Text
                              className="font-bold"
                              style={{ color: isSelected ? '#0A0A0A' : '#FFFFFF' }}
                            >
                              {account.index + 1}
                            </Text>
                          </View>

                          {/* Name & Address */}
                          <View className="flex-1">
                            {isEditing ? (
                              <TextInput
                                value={editName}
                                onChangeText={setEditName}
                                onBlur={handleSaveEdit}
                                onSubmitEditing={handleSaveEdit}
                                autoFocus
                                className="text-wallet-text font-medium text-base py-0"
                                placeholderTextColor="#8E8E93"
                              />
                            ) : (
                              <Pressable onLongPress={() => handleStartEdit(account)}>
                                <Text className="text-wallet-text font-medium">
                                  {account.name}
                                </Text>
                              </Pressable>
                            )}
                            <Text className="text-wallet-text-secondary text-sm font-mono">
                              {formatAddress(account.address, 8, 6)}
                            </Text>
                          </View>
                        </View>

                        {/* Actions */}
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => handleCopyAddress(account.address, account.index)}
                            className="w-8 h-8 rounded-full bg-wallet-bg/50 items-center justify-center"
                          >
                            <Feather
                              name={isCopied ? 'check' : 'copy'}
                              size={14}
                              color={isCopied ? '#B8F25B' : '#8E8E93'}
                            />
                          </Pressable>

                          {isSelected && (
                            <View className="w-6 h-6 rounded-full bg-wallet-accent items-center justify-center">
                              <Feather name="check" size={14} color="#0A0A0A" />
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Add Account Button */}
              <Pressable
                onPress={handleAddAccountPress}
                disabled={isAdding}
                className="flex-row items-center justify-center gap-2 py-4 bg-wallet-card-light rounded-xl active:opacity-70"
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#B8F25B" />
                ) : (
                  <>
                    <Feather name="plus" size={18} color="#B8F25B" />
                    <Text className="text-wallet-accent font-medium">
                      Add New Account
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Hint */}
              <Text className="text-wallet-text-secondary text-xs text-center mt-4">
                Long press account name to rename
              </Text>

              <View className="h-6" />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* PIN Confirmation Modal */}
      <PinConfirmModal
        visible={showPinModal}
        title="Add Account"
        description="Enter your PIN to derive a new account from your wallet"
        onClose={handlePinClose}
        onConfirm={handlePinConfirm}
      />
    </>
  );
}
