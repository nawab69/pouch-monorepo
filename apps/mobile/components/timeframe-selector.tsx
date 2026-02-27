import { View, Text, Pressable } from 'react-native';
import { ChartTimeframe } from '@/types/coingecko';

interface TimeframeSelectorProps {
  selected: ChartTimeframe;
  onChange: (timeframe: ChartTimeframe) => void;
}

const TIMEFRAMES: ChartTimeframe[] = ['1D', '1W', '1M', '1Y', 'ALL'];

export function TimeframeSelector({
  selected,
  onChange,
}: TimeframeSelectorProps) {
  return (
    <View className="flex-row justify-center gap-2">
      {TIMEFRAMES.map((timeframe) => {
        const isSelected = timeframe === selected;
        return (
          <Pressable
            key={timeframe}
            onPress={() => onChange(timeframe)}
            className={`px-4 py-2 rounded-full ${
              isSelected
                ? 'bg-wallet-accent'
                : 'bg-wallet-card-light'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected
                  ? 'text-black'
                  : 'text-wallet-text-secondary'
              }`}
            >
              {timeframe}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
