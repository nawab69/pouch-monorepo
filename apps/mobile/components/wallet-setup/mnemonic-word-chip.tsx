import { View, Text, StyleSheet } from 'react-native';

interface MnemonicWordChipProps {
  index: number;
  word: string;
  isBlurred?: boolean;
}

export function MnemonicWordChip({ index, word, isBlurred = false }: MnemonicWordChipProps) {
  return (
    <View style={styles.container}>
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{index}</Text>
      </View>
      <Text style={[styles.word, isBlurred && styles.wordBlurred]}>
        {isBlurred ? '••••••' : word}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F1D',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A332F',
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(184, 242, 91, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#B8F25B',
  },
  word: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  wordBlurred: {
    color: '#5C6660',
  },
});
