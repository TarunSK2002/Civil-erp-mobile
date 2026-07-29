import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Search color={colors.dark.textSecondary} size={20} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.dark.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
});
