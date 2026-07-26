import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, Pressable,
  FlatList, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Search, Plus, Edit2, Trash2, X, Briefcase, Phone } from 'lucide-react-native';

interface Payee {
  id: number;
  Name: string;
  MobileNumber?: string;
  PayeeType?: string; // e.g. 'Subcontractor', 'Vendor'
}

export default function PayeeListScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [payeeType, setPayeeType] = useState('Subcontractor');

  const { data: payees, isLoading, isFetching, refetch } = useQuery<Payee[]>({
    queryKey: ['payees', search],
    queryFn: async () => {
      const response = await api.get(`/payees?search=${search}`);
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { Name: name, MobileNumber: mobileNumber, PayeeType: payeeType };
      if (selectedPayee) {
        return api.put(`/payees/${selectedPayee.id}`, payload);
      }
      return api.post('/payees', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payees'] });
      closeForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save payee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/payees/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payees'] }),
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to delete payee');
    },
  });

  const openForm = (payee?: Payee) => {
    if (payee) {
      setSelectedPayee(payee);
      setName(payee.Name);
      setMobileNumber(payee.MobileNumber || '');
      setPayeeType(payee.PayeeType || 'Subcontractor');
    } else {
      setSelectedPayee(null);
      setName('');
      setMobileNumber('');
      setPayeeType('Subcontractor');
    }
    setModalOpen(true);
  };

  const closeForm = () => {
    setModalOpen(false);
    setSelectedPayee(null);
    setName('');
    setMobileNumber('');
    setPayeeType('Subcontractor');
  };

  const handleDelete = (payee: Payee) => {
    Alert.alert(
      'Confirm Delete',
      `Delete "${payee.Name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(payee.id) },
      ]
    );
  };

  const payeeTypeOptions = ['Subcontractor', 'Vendor', 'Supplier', 'Other'];

  const badgeColor = (type?: string) => {
    switch (type) {
      case 'Subcontractor': return '#7C3AED';
      case 'Vendor': return '#0EA5E9';
      case 'Supplier': return '#059669';
      default: return colors.dark.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <Search color={colors.dark.textMuted} size={18} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search payees..."
          placeholderTextColor={colors.dark.textMuted}
        />
        {isFetching && <ActivityIndicator size="small" color={colors.dark.accent} />}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={payees}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Briefcase color={colors.dark.textMuted} size={48} />
              <Text style={styles.emptyText}>No payees found</Text>
              <Text style={styles.emptySubText}>Tap + to add a payee</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: badgeColor(item.PayeeType) + '33' }]}>
                  <Briefcase color={badgeColor(item.PayeeType)} size={20} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.Name}</Text>
                  {item.MobileNumber ? (
                    <View style={styles.phoneRow}>
                      <Phone color={colors.dark.textMuted} size={12} />
                      <Text style={styles.cardSub}> {item.MobileNumber}</Text>
                    </View>
                  ) : null}
                  <View style={[styles.typeBadge, { backgroundColor: badgeColor(item.PayeeType) + '22', borderColor: badgeColor(item.PayeeType) + '66' }]}>
                    <Text style={[styles.typeBadgeText, { color: badgeColor(item.PayeeType) }]}>{item.PayeeType || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable style={styles.actionBtn} onPress={() => openForm(item)}>
                  <Edit2 color={colors.dark.accent} size={16} />
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => handleDelete(item)}>
                  <Trash2 color={colors.dark.error} size={16} />
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => openForm()}>
        <Plus color="#0F0F1A" size={24} />
      </Pressable>

      {/* Modal */}
      {modalOpen && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedPayee ? 'Edit Payee' : 'Add Payee'}</Text>
              <Pressable onPress={closeForm}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={mobileNumber}
              onChangeText={setMobileNumber}
              placeholder="10-digit number"
              placeholderTextColor={colors.dark.textMuted}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Payee Type</Text>
            <View style={styles.typeRow}>
              {payeeTypeOptions.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typeChip, payeeType === t && styles.typeChipActive]}
                  onPress={() => setPayeeType(t)}
                >
                  <Text style={[styles.typeChipText, payeeType === t && styles.typeChipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.saveBtn, (!name || saveMutation.isPending) && styles.saveBtnDisabled]}
              onPress={() => saveMutation.mutate()}
              disabled={!name || saveMutation.isPending}
            >
              {saveMutation.isPending
                ? <ActivityIndicator size="small" color="#0F0F1A" />
                : <Text style={styles.saveBtnText}>{selectedPayee ? 'Update' : 'Save'}</Text>}
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.dark.bgCard, margin: 16, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.dark.border,
  },
  searchInput: { flex: 1, color: colors.dark.textPrimary, fontSize: 15 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { color: colors.dark.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubText: { color: colors.dark.textMuted, fontSize: 13 },
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.dark.bgCard, borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.dark.border,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { color: colors.dark.textPrimary, fontSize: 15, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  cardSub: { color: colors.dark.textMuted, fontSize: 12 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, marginTop: 2 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
  },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.dark.accent, justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.dark.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.dark.bgSecondary, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.dark.textPrimary, fontSize: 18, fontWeight: '700' },
  label: { color: colors.dark.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.dark.bgInput, color: colors.dark.textPrimary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    borderWidth: 1, borderColor: colors.dark.border,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    backgroundColor: colors.dark.bgInput, borderWidth: 1, borderColor: colors.dark.border,
  },
  typeChipActive: { backgroundColor: colors.dark.accent + '22', borderColor: colors.dark.accent },
  typeChipText: { color: colors.dark.textSecondary, fontSize: 13 },
  typeChipTextActive: { color: colors.dark.accent, fontWeight: '600' },
  saveBtn: {
    backgroundColor: colors.dark.accent, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#0F0F1A', fontSize: 16, fontWeight: '700' },
});
