import { View, Text, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Contact } from '@/types/contacts';
import { formatAddress } from '@/services/blockchain';

interface ContactItemProps {
  contact: Contact;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function ContactItem({
  contact,
  onPress,
  onEdit,
  onDelete,
  showActions = true,
}: ContactItemProps) {
  const initial = contact.name.charAt(0).toUpperCase();
  const truncatedAddress = formatAddress(contact.address);
  const isInternal = contact.isInternal;

  const content = (
    <View className="flex-row items-center justify-between bg-wallet-card rounded-xl p-4">
      <View className="flex-row items-center gap-3 flex-1">
        {/* Avatar */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isInternal ? 'bg-wallet-accent/30' : 'bg-wallet-accent/20'
          }`}
        >
          {isInternal ? (
            <Feather name="briefcase" size={18} color="#B8F25B" />
          ) : (
            <Text className="text-wallet-accent font-bold text-lg">{initial}</Text>
          )}
        </View>

        {/* Name and address */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-wallet-text font-semibold" numberOfLines={1}>
              {contact.name}
            </Text>
            {isInternal && (
              <View className="bg-wallet-accent/20 px-2 py-0.5 rounded">
                <Text className="text-wallet-accent text-xs font-medium">My Wallet</Text>
              </View>
            )}
          </View>
          <Text className="text-wallet-text-secondary text-sm font-mono">
            {truncatedAddress}
          </Text>
        </View>
      </View>

      {/* Actions - only for non-internal contacts */}
      {showActions && !isInternal && (onEdit || onDelete) && (
        <View className="flex-row items-center gap-2">
          {onEdit && (
            <Pressable
              onPress={onEdit}
              className="w-8 h-8 rounded-full bg-wallet-card-light items-center justify-center active:opacity-70"
              hitSlop={8}
            >
              <Feather name="edit-2" size={14} color="#8B9A92" />
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              className="w-8 h-8 rounded-full bg-wallet-card-light items-center justify-center active:opacity-70"
              hitSlop={8}
            >
              <Feather name="trash-2" size={14} color="#FF6B6B" />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-80">
        {content}
      </Pressable>
    );
  }

  return content;
}
