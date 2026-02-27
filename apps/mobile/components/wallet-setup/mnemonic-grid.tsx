import { View, StyleSheet, Pressable } from 'react-native';
import { MnemonicWordChip } from './mnemonic-word-chip';

interface MnemonicGridProps {
  words: string[];
  isBlurred?: boolean;
  onReveal?: () => void;
}

export function MnemonicGrid({ words, isBlurred = false, onReveal }: MnemonicGridProps) {
  const leftColumn = words.filter((_, i) => i % 2 === 0);
  const rightColumn = words.filter((_, i) => i % 2 === 1);

  const content = (
    <View style={styles.container}>
      <View style={styles.column}>
        {leftColumn.map((word, i) => (
          <MnemonicWordChip
            key={i * 2}
            index={i * 2 + 1}
            word={word}
            isBlurred={isBlurred}
          />
        ))}
      </View>
      <View style={styles.column}>
        {rightColumn.map((word, i) => (
          <MnemonicWordChip
            key={i * 2 + 1}
            index={i * 2 + 2}
            word={word}
            isBlurred={isBlurred}
          />
        ))}
      </View>
    </View>
  );

  if (isBlurred && onReveal) {
    return (
      <Pressable onPress={onReveal}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 10,
  },
});
