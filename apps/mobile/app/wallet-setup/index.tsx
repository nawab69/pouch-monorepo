import { WalletCreateIllustration } from '@/components/wallet-setup/illustrations/wallet-create-illustration';
import { WalletChoiceCard } from '@/components/wallet-setup/wallet-choice-card';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WalletSetupChoiceScreen() {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push('/wallet-setup/create/generate');
  };

  const handleImportExisting = () => {
    router.push('/wallet-setup/import');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Illustration area */}
        <View style={styles.illustrationArea}>
          <WalletCreateIllustration />
        </View>

        {/* Content area */}
        <View style={styles.contentArea}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.accentWord}>Pouch</Text>
          </View>

          <Text style={styles.description}>A non-custodial wallet built for true ownership. Create or import your wallet to get started.</Text>

          {/* Choice cards */}
          <View style={styles.cardsContainer}>
            <WalletChoiceCard
              title="Create New Wallet"
              description="Generate a new recovery phrase"
              icon="plus-circle"
              variant="primary"
              onPress={handleCreateNew}
            />

            <WalletChoiceCard
              title="Import Existing"
              description="Use your 12 or 24 word phrase"
              icon="download"
              variant="secondary"
              onPress={handleImportExisting}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1411',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  illustrationArea: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 40,
    color: '#FFFFFF',
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  accentWord: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 44,
    color: '#B8F25B',
    lineHeight: 52,
    fontStyle: 'italic',
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#8B9A92',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 320,
  },
  cardsContainer: {
    gap: 14,
  },
});
