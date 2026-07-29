import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { Store, UserCheck, Clock, ShoppingBag, Wallet, ChevronRight } from 'lucide-react-native';

export default function MoreMenuScreen({ navigation }: any) {
  const menuItems = [
    {
      title: 'Material Dealers',
      subtitle: 'Supplier directory & contact details',
      icon: Store,
      screen: 'DealerList',
    },
    {
      title: 'Material Purchases',
      subtitle: 'Site purchase entries & SqFt billing',
      icon: ShoppingBag,
      screen: 'PurchaseList',
      targetStack: 'Finance',
    },
    {
      title: 'Person Types (Wage Rates)',
      subtitle: 'Mason, Helper, Painter wage settings',
      icon: UserCheck,
      screen: 'PersonType',
    },
    {
      title: 'Shift Master',
      subtitle: 'Full day, half day wage multipliers',
      icon: Clock,
      screen: 'ShiftMaster',
    },
    {
      title: 'Petty Cash & Expenses',
      subtitle: 'Track office & site cash expenses',
      icon: Wallet,
      screen: 'PettyCash',
      targetStack: 'Finance',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Secondary Modules & Masters</Text>
      <View style={styles.list}>
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.card}
              onPress={() => {
                if (item.targetStack) {
                  navigation.navigate(item.targetStack, { screen: item.screen });
                } else {
                  navigation.navigate(item.screen);
                }
              }}
            >
              <View style={styles.iconBox}>
                <Icon color={colors.dark.accent} size={22} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight color={colors.dark.textMuted} size={20} />
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
    padding: 16,
  },
  header: {
    fontSize: 14,
    color: colors.dark.textMuted,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    marginBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgSecondary,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,179,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
});
