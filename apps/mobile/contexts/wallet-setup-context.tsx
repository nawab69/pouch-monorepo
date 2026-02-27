import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WalletSetupContextType {
  pin: string | null;
  mnemonic: string[] | null;
  setPin: (pin: string) => void;
  setMnemonic: (mnemonic: string[]) => void;
  clear: () => void;
}

const WalletSetupContext = createContext<WalletSetupContextType | null>(null);

export function WalletSetupProvider({ children }: { children: ReactNode }) {
  const [pin, setPinState] = useState<string | null>(null);
  const [mnemonic, setMnemonicState] = useState<string[] | null>(null);

  const setPin = useCallback((newPin: string) => {
    setPinState(newPin);
  }, []);

  const setMnemonic = useCallback((newMnemonic: string[]) => {
    setMnemonicState(newMnemonic);
  }, []);

  const clear = useCallback(() => {
    setPinState(null);
    setMnemonicState(null);
  }, []);

  return (
    <WalletSetupContext.Provider value={{ pin, mnemonic, setPin, setMnemonic, clear }}>
      {children}
    </WalletSetupContext.Provider>
  );
}

export function useWalletSetup() {
  const context = useContext(WalletSetupContext);
  if (!context) {
    throw new Error('useWalletSetup must be used within a WalletSetupProvider');
  }
  return context;
}
