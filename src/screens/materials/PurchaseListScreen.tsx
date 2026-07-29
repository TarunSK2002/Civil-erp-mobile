import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import { ShoppingBag, Plus, Calendar, Store, Trash2 } from 'lucide-react-native';

interface SiteMaterial {
  id: number;
  SiteId: number;
  SiteName?: string;
  MaterialId: number;
  MaterialName?: string;
  SupplierName?: string;
  BillNo?: string;
  PurchaseDate?: string;
  TotalAmount: number;
  PaidAmount: number;
  PaymentStatus: string;
  Remarks?: string;
}

export default function PurchaseListScreen({ navigation }: any) {
  const [purchases, setPurchases] = useState<SiteMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/site-materials');
      setPurchases(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPurchases();
    });
    return unsubscribe;
  }, [navigation, fetchPurchases]);

  const handleDelete = (item: SiteMaterial) => {
    Alert.alert('Delete Purchase', `Delete purchase entry #${item.id}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/site-materials/${item.id}`);
            fetchPurchases();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const filteredPurchases = purchases.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.SiteName?.toLowerCase().includes(term) ||
      p.MaterialName?.toLowerCase().includes(term) ||
      p.SupplierName?.toLowerCase().includes(term) ||
      p.BillNo?.toLowerCase().includes(term)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return colors.dark.success;
      case 'PARTIAL':
        return colors.dark.warning;
      default:
        return colors.dark.error;
    }
  };

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search site purchases..." />

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPurchases}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <ShoppingBag color={colors.dark.accent} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.siteName}>{item.SiteName || 'Site Purchase'}</Text>
                  <Text style={styles.materialName}>{item.MaterialName || 'Material'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amount}>₹{(item.TotalAmount || 0).toLocaleString('en-IN')}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.PaymentStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.PaymentStatus) }]}>
                      {item.PaymentStatus || 'UNPAID'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                {item.SupplierName ? (
                  <View style={styles.infoRow}>
                    <Store color={colors.dark.textMuted} size={14} />
                    <Text style={styles.infoText}>{item.SupplierName}</Text>
                  </View>
                ) : null}
                {item.PurchaseDate ? (
                  <View style={styles.infoRow}>
                    <Calendar color={colors.dark.textMuted} size={14} />
                    <Text style={styles.infoText}>
                      {new Date(item.PurchaseDate).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Trash2 color={colors.dark.error} size={16} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PurchaseForm')}
      >
        <Plus color="#000" size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
    padding: 16,
  },
  card: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255,179,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  siteName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  materialName: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.accent,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginLeft: 6,
  },
  deleteBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    padding: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
