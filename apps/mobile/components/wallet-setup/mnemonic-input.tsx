import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useMnemonic } from '@/hooks/use-mnemonic';

interface MnemonicInputProps {
  wordCount: 12 | 24;
  onMnemonicChange: (words: string[], isValid: boolean) => void;
}

export function MnemonicInput({ wordCount, onMnemonicChange }: MnemonicInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [invalidWords, setInvalidWords] = useState<Set<number>>(new Set());
  const { validateWord, validateMnemonic, getWordSuggestions } = useMnemonic();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const handleInputChange = (text: string) => {
    setInputValue(text);

    // Parse words from input
    const parsedWords = text
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(w => w.length > 0);

    setWords(parsedWords);

    // Validate each word
    const invalid = new Set<number>();
    parsedWords.forEach((word, index) => {
      if (!validateWord(word)) {
        invalid.add(index);
      }
    });
    setInvalidWords(invalid);

    // Get suggestions for last word if incomplete
    const lastWord = parsedWords[parsedWords.length - 1];
    if (lastWord && !text.endsWith(' ') && !validateWord(lastWord)) {
      setSuggestions(getWordSuggestions(lastWord, 4));
    } else {
      setSuggestions([]);
    }

    // Check overall validity
    const isComplete = parsedWords.length === wordCount;
    const allValid = invalid.size === 0;
    const isMnemonicValid = isComplete && allValid && validateMnemonic(parsedWords);

    onMnemonicChange(parsedWords, isMnemonicValid);
  };

  const handleSuggestionPress = (suggestion: string) => {
    const wordsInInput = inputValue.split(/[\s,]+/);
    wordsInInput[wordsInInput.length - 1] = suggestion;
    const newValue = wordsInInput.join(' ') + ' ';
    setInputValue(newValue);
    handleInputChange(newValue);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInputValue('');
    setWords([]);
    setInvalidWords(new Set());
    setSuggestions([]);
    onMnemonicChange([], false);
  };

  return (
    <View style={styles.container}>
      {/* Word count indicator */}
      <View style={styles.countContainer}>
        <Text style={[styles.count, words.length === wordCount ? styles.countComplete : null]}>
          {words.length}/{wordCount} words
        </Text>
        {words.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <Feather name="x" size={16} color="#8B9A92" />
          </Pressable>
        )}
      </View>

      {/* Input area */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder="Enter your recovery phrase..."
          placeholderTextColor="#5C6660"
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
        />
      </View>

      {/* Word suggestions */}
      {suggestions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={index}
              onPress={() => handleSuggestionPress(suggestion)}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Invalid words indicator */}
      {invalidWords.size > 0 && (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={14} color="#EF4444" />
          <Text style={styles.errorText}>
            {invalidWords.size} invalid word{invalidWords.size > 1 ? 's' : ''} detected
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  countContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#8B9A92',
  },
  countComplete: {
    color: '#B8F25B',
  },
  clearButton: {
    padding: 4,
  },
  inputContainer: {
    backgroundColor: '#1A1F1D',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A332F',
    padding: 16,
    minHeight: 160,
  },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(184, 242, 91, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 91, 0.2)',
  },
  suggestionText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#B8F25B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#EF4444',
  },
});
