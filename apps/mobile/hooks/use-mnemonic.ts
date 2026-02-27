import { useCallback } from 'react';
import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

export function useMnemonic() {
  const generateMnemonic = useCallback((): string[] => {
    // Generate 12-word mnemonic (128 bits of entropy)
    const mnemonic = bip39.generateMnemonic(wordlist, 128);
    return mnemonic.split(' ');
  }, []);

  const generateMnemonic24 = useCallback((): string[] => {
    // Generate 24-word mnemonic (256 bits of entropy)
    const mnemonic = bip39.generateMnemonic(wordlist, 256);
    return mnemonic.split(' ');
  }, []);

  const validateMnemonic = useCallback((words: string[]): boolean => {
    const mnemonic = words.join(' ').toLowerCase().trim();
    return bip39.validateMnemonic(mnemonic, wordlist);
  }, []);

  const validateWord = useCallback((word: string): boolean => {
    return wordlist.includes(word.toLowerCase().trim());
  }, []);

  const getWordSuggestions = useCallback((partial: string, limit: number = 5): string[] => {
    if (!partial || partial.length < 1) return [];

    const lowercasePartial = partial.toLowerCase();
    return wordlist
      .filter((word: string) => word.startsWith(lowercasePartial))
      .slice(0, limit);
  }, []);

  const getRandomWords = useCallback((count: number, exclude: string[] = []): string[] => {
    const available = wordlist.filter((word: string) => !exclude.includes(word));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, []);

  return {
    generateMnemonic,
    generateMnemonic24,
    validateMnemonic,
    validateWord,
    getWordSuggestions,
    getRandomWords,
  };
}
