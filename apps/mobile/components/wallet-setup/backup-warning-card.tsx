import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface BackupWarningCardProps {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  variant?: 'warning' | 'info';
}

export function BackupWarningCard({ icon, text, variant = 'warning' }: BackupWarningCardProps) {
  const isWarning = variant === 'warning';

  return (
    <View style={[styles.container, isWarning ? styles.containerWarning : styles.containerInfo]}>
      <View style={[styles.iconContainer, isWarning ? styles.iconWarning : styles.iconInfo]}>
        <Feather
          name={icon}
          size={20}
          color={isWarning ? '#EF4444' : '#B8F25B'}
        />
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
  },
  containerWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  containerInfo: {
    backgroundColor: 'rgba(184, 242, 91, 0.08)',
    borderColor: 'rgba(184, 242, 91, 0.2)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  iconInfo: {
    backgroundColor: 'rgba(184, 242, 91, 0.15)',
  },
  text: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
});
