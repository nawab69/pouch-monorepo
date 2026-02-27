import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { useContacts } from '@/hooks/use-contacts';
import { isValidAddress } from '@/services/blockchain';
import { Token } from '@/types/blockchain';
import { Contact } from '@/types/contacts';
import { ContactPickerModal } from '@/components/contacts/contact-picker-modal';

export default function SendAmountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    tokenDecimals: string;
    tokenBalance: string;
    tokenBalanceFormatted: string;
    isNative: string;
  }>();

  const { walletAddress } = useWallet();
  const { selectedNetwork, networkType } = useNetwork();
  const { contacts, findByAddress, recordUsage } = useContacts();

  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactPicker, setShowContactPicker] = useState(false);

  // Reconstruct token from params
  const token: Token = {
    contractAddress: params.tokenAddress === 'native' ? null : params.tokenAddress,
    symbol: params.tokenSymbol ?? 'ETH',
    name: params.tokenName ?? 'Ethereum',
    decimals: parseInt(params.tokenDecimals ?? '18'),
    balance: params.tokenBalance ?? '0',
    balanceFormatted: params.tokenBalanceFormatted ?? '0',
    balanceUsd: null,
    isNative: params.isNative === 'true',
  };

  const maxBalance = parseFloat(token.balanceFormatted);

  // Check if entered address matches a saved contact
  useEffect(() => {
    const checkContact = async () => {
      if (recipient && isValidAddress(recipient)) {
        const contact = await findByAddress(recipient);
        setSelectedContact(contact);
      } else {
        setSelectedContact(null);
      }
    };
    checkContact();
  }, [recipient, findByAddress]);

  const validateAmount = useCallback(
    (value: string): boolean => {
      if (!value || value === '') {
        setAmountError('Please enter an amount');
        return false;
      }

      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        setAmountError('Please enter a valid amount');
        return false;
      }

      if (numValue > maxBalance) {
        setAmountError('Insufficient balance');
        return false;
      }

      setAmountError(null);
      return true;
    },
    [maxBalance]
  );

  const validateRecipient = useCallback((address: string): boolean => {
    if (!address || address === '') {
      setRecipientError('Please enter a recipient address');
      return false;
    }

    if (!isValidAddress(address)) {
      setRecipientError('Invalid Ethereum address');
      return false;
    }

    setRecipientError(null);
    return true;
  }, []);

  const handleAmountChange = (value: string) => {
    // Only allow numbers and one decimal point
    const filtered = value.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    const formatted =
      parts.length > 2
        ? parts[0] + '.' + parts.slice(1).join('')
        : filtered;

    setAmount(formatted);
    if (amountError) {
      validateAmount(formatted);
    }
  };

  const handleRecipientChange = (value: string) => {
    setRecipient(value.trim());
    if (recipientError) {
      validateRecipient(value.trim());
    }
  };

  const handleMax = () => {
    setAmount(token.balanceFormatted);
    setAmountError(null);
  };

  const handleContactSelect = (contact: Contact) => {
    setRecipient(contact.address);
    setSelectedContact(contact);
    setRecipientError(null);
  };

  const handleContinue = async () => {
    const isAmountValid = validateAmount(amount);
    const isRecipientValid = validateRecipient(recipient);

    if (!isAmountValid || !isRecipientValid) {
      return;
    }

    // Check if sending to self
    if (recipient.toLowerCase() === walletAddress?.toLowerCase()) {
      Alert.alert('Warning', 'You are about to send to your own address');
    }

    // Record usage if sending to a saved contact
    if (selectedContact) {
      await recordUsage(selectedContact.id);
    }

    // Navigate to confirm screen
    router.push({
      pathname: '/send/confirm',
      params: {
        ...params,
        amount,
        recipient,
      },
    });
  };

  const canContinue = amount !== '' && recipient !== '';

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>

          <Text className="text-xl font-bold text-wallet-text">
            Send {token.symbol}
          </Text>

          <View className="w-10" />
        </View>

        {/* Content */}
        <View className="flex-1 px-5 pt-4">
          {/* Amount Input */}
          <View className="mb-6">
            <Text className="text-wallet-text-secondary text-sm mb-2">Amount</Text>
            <View
              className={`bg-wallet-card rounded-xl p-4 border ${
                amountError ? 'border-wallet-negative' : 'border-transparent'
              }`}
            >
              <View className="flex-row items-center">
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor="#8E8E93"
                  keyboardType="decimal-pad"
                  className="flex-1 text-wallet-text text-2xl font-medium"
                />
                <View className="flex-row items-center gap-2">
                  <Text className="text-wallet-text-secondary text-lg">
                    {token.symbol}
                  </Text>
                  <Pressable
                    onPress={handleMax}
                    className="bg-wallet-accent/20 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-wallet-accent font-medium text-sm">
                      MAX
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-wallet-text-secondary text-sm">
                  Balance: {token.balanceFormatted} {token.symbol}
                </Text>
              </View>
            </View>
            {amountError && (
              <Text className="text-wallet-negative text-sm mt-2">
                {amountError}
              </Text>
            )}
          </View>

          {/* Recipient Input */}
          <View className="mb-6">
            <Text className="text-wallet-text-secondary text-sm mb-2">
              Recipient Address
            </Text>
            <View
              className={`bg-wallet-card rounded-xl p-4 border ${
                recipientError ? 'border-wallet-negative' : 'border-transparent'
              }`}
            >
              {/* Contact name if matched */}
              {selectedContact && (
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather name="user" size={12} color="#B8F25B" />
                  <Text className="text-wallet-accent text-sm font-medium">
                    {selectedContact.name}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={recipient}
                  onChangeText={handleRecipientChange}
                  placeholder="0x..."
                  placeholderTextColor="#8E8E93"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 text-wallet-text text-base font-mono"
                />
                <Pressable
                  onPress={() => setShowContactPicker(true)}
                  className="w-9 h-9 rounded-full bg-wallet-card-light items-center justify-center"
                  hitSlop={8}
                >
                  <Feather name="users" size={16} color="#8B9A92" />
                </Pressable>
              </View>
            </View>
            {recipientError && (
              <Text className="text-wallet-negative text-sm mt-2">
                {recipientError}
              </Text>
            )}
          </View>

          {/* Network Info */}
          <View className="bg-wallet-card-light rounded-xl p-4">
            <View className="flex-row items-center gap-2">
              <Feather name="info" size={16} color="#8E8E93" />
              <Text className="text-wallet-text-secondary text-sm">
                Sending on {selectedNetwork.name}{' '}
                {networkType === 'testnet' && `(${selectedNetwork.testnetName})`}
              </Text>
            </View>
          </View>
        </View>

        {/* Continue Button */}
        <View className="px-5 pb-8">
          <Pressable
            onPress={handleContinue}
            disabled={!canContinue}
            className={`py-4 rounded-xl items-center ${
              canContinue ? 'bg-wallet-accent' : 'bg-wallet-card-light'
            }`}
          >
            <Text
              className={`font-semibold text-lg ${
                canContinue ? 'text-wallet-bg' : 'text-wallet-text-secondary'
              }`}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Contact Picker Modal */}
      <ContactPickerModal
        visible={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelect={handleContactSelect}
        contacts={contacts}
      />
    </SafeAreaView>
  );
}
