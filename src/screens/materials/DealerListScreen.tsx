import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import { Store, Plus, Phone, MapPin, X, Trash2, Edit2 } from 'lucide-react-native';

interface Dealer {
  id: number;
  Name: string;
  Phone?: string;
  Address?: string;
  MaterialTypeId?: number;
  MaterialTypeName?: string;
}

interface MaterialType {
  id: number;
  Name: string;
}

export default function DealerListScreen() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<number | 'ALL'>('ALL');

  // Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTypeId, setFormTypeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resDealers, resTypes] = await Promise.all([
        api.get('/materials'),
        api.get('/material-types'),
      ]);
      setDealers(resDealers.data || []);
      setMaterialTypes(resTypes.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch dealers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openAddModal = () => {
    setEditingDealer(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormTypeId(materialTypes.length > 0 ? materialTypes[0].id : null);
    setModalVisible(true);
  };

  const openEditModal = (dealer: Dealer) => {
    setEditingDealer(dealer);
    setFormName(dealer.Name || '');
    setFormPhone(dealer.Phone || '');
    setFormAddress(dealer.Address || '');
    setFormTypeId(dealer.MaterialTypeId || (materialTypes.length > 0 ? materialTypes[0].id : null));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Validation', 'Dealer Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        Name: formName.trim(),
        Phone: formPhone.trim(),
        Address: formAddress.trim(),
        MaterialTypeId: formTypeId,
      };

      if (editingDealer) {
        await api.put(`/materials/${editingDealer.id}`, payload);
      } else {
        await api.post('/materials', payload);
      }

      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save dealer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (dealer: Dealer) => {
    Alert.alert('Delete Dealer', `Are you sure you want to delete ${dealer.Name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/materials/${dealer.id}`);
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const filteredDealers = dealers.filter((d) => {
    const matchesSearch = d.Name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'ALL' || d.MaterialTypeId === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search dealers..." />

      {/* Filter Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, selectedType === 'ALL' && styles.filterChipActive]}
          onPress={() => setSelectedType('ALL')}
        >
          <Text style={[styles.filterChipText, selectedType === 'ALL' && styles.filterChipTextActive]}>All Types</Text>
        </TouchableOpacity>
        {materialTypes.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.filterChip, selectedType === t.id && styles.filterChipActive]}
            onPress={() => setSelectedType(t.id)}
          >
            <Text style={[styles.filterChipText, selectedType === t.id && styles.filterChipTextActive]}>{t.Name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredDealers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Store color={colors.dark.accent} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.dealerName}>{item.Name}</Text>
                  {item.MaterialTypeName && (
                    <Text style={styles.dealerType}>{item.MaterialTypeName}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 4, marginRight: 8 }}>
                  <Edit2 color={colors.dark.textSecondary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 4 }}>
                  <Trash2 color={colors.dark.error} size={18} />
                </TouchableOpacity>
              </View>

              {(item.Phone || item.Address) && (
                <View style={styles.cardDetails}>
                  {item.Phone ? (
                    <View style={styles.detailRow}>
                      <Phone color={colors.dark.textMuted} size={14} />
                      <Text style={styles.detailText}>{item.Phone}</Text>
                    </View>
                  ) : null}
                  {item.Address ? (
                    <View style={styles.detailRow}>
                      <MapPin color={colors.dark.textMuted} size={14} />
                      <Text style={styles.detailText}>{item.Address}</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Plus color="#000" size={24} />
      </TouchableOpacity>

      {/* Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingDealer ? 'Edit Dealer' : 'Add Dealer'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Dealer / Supplier Name *</Text>
            <TextInput
              style={styles.input}
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. Sri Lakshmi Hardware"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formPhone}
              onChangeText={setFormPhone}
              keyboardType="phone-pad"
              placeholder="e.g. 9876543210"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Material Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {materialTypes.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeBadge, formTypeId === t.id && styles.typeBadgeActive]}
                  onPress={() => setFormTypeId(t.id)}
                >
                  <Text style={[styles.typeBadgeText, formTypeId === t.id && styles.typeBadgeTextActive]}>{t.Name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Address / Location</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={formAddress}
              onChangeText={setFormAddress}
              multiline
              placeholder="e.g. Main Road, Salem"
              placeholderTextColor={colors.dark.textMuted}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Save Dealer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
    padding: 16,
  },
  filterScroll: {
    maxHeight: 40,
    marginBottom: 12,
  },
  filterContainer: {
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.dark.accent,
    borderColor: colors.dark.accent,
  },
  filterChipText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
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
  dealerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  dealerType: {
    fontSize: 12,
    color: colors.dark.accent,
    marginTop: 2,
  },
  cardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    marginLeft: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.dark.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  label: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.dark.bgInput,
    borderRadius: 8,
    padding: 12,
    color: colors.dark.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.dark.bgInput,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  typeBadgeActive: {
    backgroundColor: colors.dark.accent,
  },
  typeBadgeText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  typeBadgeTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: colors.dark.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
