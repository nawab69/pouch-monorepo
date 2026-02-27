import { useState } from 'react';
import { View, Text, Pressable, Alert, Switch, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { NetworkSelector } from '@/components/network-selector';
import { RecoveryPhraseViewer } from '@/components/settings/recovery-phrase-viewer';
import { PinConfirmModal } from '@/components/pin-confirm-modal';
import { verifyPin } from '@/services/auth/pin-service';
import { clearContacts } from '@/services/contacts/contact-service';

export default function SettingsScreen() {
  const router = useRouter();
  const { resetOnboarding } = useOnboarding();
  const { resetWallet } = useWallet();
  const { lockSettings, removePin } = useAuth();
  const { isEnabled: notificationsEnabled, enableNotifications, disableNotifications, isLoading: notificationsLoading } = useNotifications();
  const {
    selectedNetworkId,
    selectedNetwork,
    chainId,
    isTestnet,
    isLoading,
    changeNetwork,
    toggleNetworkType,
  } = useNetwork();

  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  // Show loading state while context initializes
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-wallet-bg items-center justify-center" edges={['top']}>
        <Text className="text-wallet-text-secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    Alert.alert(
      'Onboarding Reset',
      'Restart the app to see the onboarding flow again.',
      [{ text: 'OK' }]
    );
  };

  const handleResetWallet = async () => {
    await resetWallet();
    Alert.alert(
      'Wallet Reset',
      'Restart the app to see the wallet setup flow again.',
      [{ text: 'OK' }]
    );
  };

  const handleResetAll = async () => {
    Alert.alert(
      'Reset Everything',
      'This will delete your wallet, PIN, and all data. You will need your recovery phrase to restore access. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await removePin();
            await resetOnboarding();
            await resetWallet();
            Alert.alert(
              'Full Reset Complete',
              'Restart the app to start fresh.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-2xl font-bold text-wallet-text">Settings</Text>
        </View>

        {/* Network Section */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-wallet-text mb-4">
            Network
          </Text>

          {/* Network Selector */}
          <View className="mb-4">
            <Text className="text-wallet-text-secondary text-sm mb-2">
              Select Network
            </Text>
            <NetworkSelector
              selectedNetworkId={selectedNetworkId}
              onSelect={changeNetwork}
            />
          </View>

          {/* Environment Toggle */}
          <View className="bg-wallet-card rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-wallet-text font-medium">
                  Testnet Mode
                </Text>
                <Text className="text-wallet-text-secondary text-sm mt-0.5">
                  Use test networks for development
                </Text>
              </View>
              <Switch
                value={isTestnet}
                onValueChange={toggleNetworkType}
                trackColor={{ false: '#3A3A3C', true: '#B8F25B' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Chain ID Display */}
          <View className="bg-wallet-card-light rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-wallet-text-secondary">Chain ID</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-wallet-text font-mono">{chainId}</Text>
                {isTestnet && (
                  <View className="bg-wallet-accent/20 px-2 py-0.5 rounded">
                    <Text className="text-wallet-accent text-xs font-medium">
                      {selectedNetwork.testnetName}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-wallet-text mb-4">
            Notifications
          </Text>

          <View className="bg-wallet-card rounded-xl p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="w-9 h-9 rounded-full bg-wallet-card-light items-center justify-center">
                  <Feather name="bell" size={18} color="#8E8E93" />
                </View>
                <View className="flex-1">
                  <Text className="text-wallet-text font-medium">
                    Transaction Alerts
                  </Text>
                  <Text className="text-wallet-text-secondary text-sm">
                    Get notified when you send or receive
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={async (value) => {
                  if (value) {
                    await enableNotifications();
                  } else {
                    await disableNotifications();
                  }
                }}
                disabled={notificationsLoading}
                trackColor={{ false: '#3A3A3C', true: '#B8F25B' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-wallet-text mb-4">
            Security
          </Text>

          <SettingsItem
            icon="shield"
            label="Recovery Phrase"
            description="View your secret recovery phrase"
            onPress={() => setShowRecoveryPhrase(true)}
          />

          <SettingsItem
            icon="lock"
            label="App Lock"
            description={lockSettings.isEnabled ? 'Enabled' : 'Disabled'}
            onPress={() => router.push('/app-lock')}
          />

          <SettingsItem
            icon="users"
            label="Address Book"
            description="Manage saved addresses"
            onPress={() => router.push('/address-book')}
          />

          <SettingsItem
            icon="link"
            label="WalletConnect"
            description="Connect to dApps"
            onPress={() => router.push('/walletconnect')}
          />
        </View>

        {/* About Section */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-wallet-text mb-4">
            About
          </Text>

          <SettingsItem
            icon="info"
            label="Version"
            value="1.0.0"
          />

          <SettingsItem
            icon="external-link"
            label="Terms of Service"
            onPress={() => {}}
          />

          <SettingsItem
            icon="external-link"
            label="Privacy Policy"
            onPress={() => {}}
          />
        </View>

        {/* Reset Wallet */}
        <View className="px-5 mb-6">
          <Pressable
            onPress={() => setShowResetModal(true)}
            className="bg-wallet-negative/10 rounded-xl p-4 active:opacity-70"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-wallet-negative/20 items-center justify-center">
                <Feather name="alert-triangle" size={18} color="#FF3B30" />
              </View>
              <View className="flex-1">
                <Text className="text-wallet-negative font-semibold">
                  Reset Wallet
                </Text>
                <Text className="text-wallet-negative/70 text-sm">
                  Erase all data and start over
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#FF3B30" />
            </View>
          </Pressable>
        </View>

        {/* Dev: Reset Buttons */}
        {__DEV__ && (
          <View className="px-5 mb-8">
            <Text className="text-lg font-semibold text-wallet-text mb-4">
              Developer Tools
            </Text>

            <View className="gap-3">
              <Pressable
                onPress={() => router.push('/assistant')}
                className="flex-row items-center gap-3 px-4 py-3 bg-blue-900/30 rounded-xl active:opacity-70"
              >
                <Feather name="cpu" size={18} color="#66BBFF" />
                <Text className="text-blue-400 font-medium">
                  AI Assistant (Test)
                </Text>
              </Pressable>

              <Pressable
                onPress={handleResetOnboarding}
                className="flex-row items-center gap-3 px-4 py-3 bg-wallet-card rounded-xl active:opacity-70"
              >
                <Feather name="refresh-cw" size={18} color="#B8F25B" />
                <Text className="text-wallet-accent font-medium">
                  Reset Onboarding
                </Text>
              </Pressable>

              <Pressable
                onPress={handleResetWallet}
                className="flex-row items-center gap-3 px-4 py-3 bg-wallet-card rounded-xl active:opacity-70"
              >
                <Feather name="trash-2" size={18} color="#B8F25B" />
                <Text className="text-wallet-accent font-medium">
                  Reset Wallet
                </Text>
              </Pressable>

              <Pressable
                onPress={handleResetAll}
                className="flex-row items-center gap-3 px-4 py-3 bg-wallet-negative/20 rounded-xl active:opacity-70"
              >
                <Feather name="alert-triangle" size={18} color="#FF3B30" />
                <Text className="text-wallet-negative font-medium">
                  Reset All
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Bottom Padding for Tab Bar */}
        <View className="h-32" />
      </ScrollView>

      {/* Recovery Phrase Viewer Modal */}
      <RecoveryPhraseViewer
        visible={showRecoveryPhrase}
        onClose={() => setShowRecoveryPhrase(false)}
      />

      {/* Reset Wallet Warning Modal */}
      <Modal
        visible={showResetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View className="flex-1 bg-wallet-bg">
          <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
            {/* Close button */}
            <View className="flex-row justify-end px-5 pt-2">
              <Pressable
                onPress={() => setShowResetModal(false)}
                className="w-8 h-8 rounded-full bg-wallet-card items-center justify-center active:opacity-70"
              >
                <Feather name="x" size={18} color="#8E8E93" />
              </Pressable>
            </View>

            <View className="flex-1 px-6 pt-8 items-center">
              {/* Warning Icon */}
              <View className="w-16 h-16 rounded-full bg-wallet-negative/15 items-center justify-center mb-6">
                <Feather name="alert-triangle" size={32} color="#FF3B30" />
              </View>

              <Text className="text-2xl font-bold text-wallet-text text-center mb-3">
                Reset Wallet?
              </Text>

              <Text className="text-wallet-text-secondary text-center text-base leading-6 mb-8">
                This action cannot be undone. All of the following will be permanently deleted:
              </Text>

              {/* Consequences list */}
              <View className="w-full bg-wallet-card rounded-xl p-4 gap-3 mb-8">
                <View className="flex-row items-center gap-3">
                  <Feather name="key" size={16} color="#FF3B30" />
                  <Text className="text-wallet-text text-sm flex-1">
                    Your PIN and security settings
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Feather name="credit-card" size={16} color="#FF3B30" />
                  <Text className="text-wallet-text text-sm flex-1">
                    All wallet accounts and keys
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Feather name="users" size={16} color="#FF3B30" />
                  <Text className="text-wallet-text text-sm flex-1">
                    Saved contacts and addresses
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Feather name="bell" size={16} color="#FF3B30" />
                  <Text className="text-wallet-text text-sm flex-1">
                    Notification preferences
                  </Text>
                </View>
              </View>

              <View className="w-full bg-wallet-accent/10 rounded-xl p-4 mb-8">
                <Text className="text-wallet-accent text-sm text-center leading-5">
                  Make sure you have your recovery phrase saved before continuing. Without it, you will not be able to restore your wallet.
                </Text>
              </View>
            </View>

            {/* Bottom buttons */}
            <View className="px-6 pb-4 gap-3">
              <Pressable
                onPress={() => {
                  setShowResetModal(false);
                  setShowPinConfirm(true);
                }}
                className="bg-wallet-negative rounded-xl py-4 items-center active:opacity-70"
              >
                <Text className="text-white font-semibold text-base">
                  Reset Wallet
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setShowResetModal(false)}
                className="rounded-xl py-4 items-center active:opacity-70"
              >
                <Text className="text-wallet-text-secondary font-medium text-base">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* PIN Confirmation for Reset */}
      <PinConfirmModal
        visible={showPinConfirm}
        title="Confirm Reset"
        description="Enter your PIN to reset wallet"
        onClose={() => setShowPinConfirm(false)}
        onConfirm={async (pin: string) => {
          const isValid = await verifyPin(pin);
          if (!isValid) return false;

          await removePin();
          await resetWallet();
          await resetOnboarding();
          await clearContacts();
          await AsyncStorage.multiRemove([
            '@pouch/notifications_enabled',
            '@pouch/notification_device_id',
          ]);

          setShowPinConfirm(false);
          router.replace('/onboarding');
          return true;
        }}
      />
    </SafeAreaView>
  );
}

interface SettingsItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
}

function SettingsItem({
  icon,
  label,
  description,
  value,
  onPress,
}: SettingsItemProps) {
  const content = (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-9 h-9 rounded-full bg-wallet-card-light items-center justify-center">
          <Feather name={icon} size={18} color="#8E8E93" />
        </View>
        <View className="flex-1">
          <Text className="text-wallet-text font-medium">{label}</Text>
          {description && (
            <Text className="text-wallet-text-secondary text-sm">
              {description}
            </Text>
          )}
        </View>
      </View>
      {value ? (
        <Text className="text-wallet-text-secondary">{value}</Text>
      ) : onPress ? (
        <Feather name="chevron-right" size={20} color="#8E8E93" />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {content}
      </Pressable>
    );
  }

  return content;
}
