import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, Pressable,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { Search, Plus, Edit2, Trash2, X, HardHat, Phone } from 'lucide-react-native';

interface Labour {
  id: number;
  Name: string;
  MobileNumber?: string;
  PersonType?: string;
  DailyRate?: number;
}

export default function LabourListScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [personType, setPersonType] = useState('Mason');
  const [dailyRate, setDailyRate] = useState('');

  const { data: labours, isLoading, isFetching, refetch } = useQuery<Labour[]>({
    queryKey: ['labours', search],
    queryFn: async () => {
      const response = await api.get(`/labours?search=${search}`);
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        Name: name,
        MobileNumber: mobileNumber,
        PersonType: personType,
        DailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
      };
      if (selectedLabour) {
        return api.put(`/labours/${selectedLabour.id}`, payload);
      }
      return api.post('/labours', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labours'] });
      closeForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save labour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/labours/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['labours'] }),
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to delete labour');
    },
  });

  const openForm = (labour?: Labour) => {
    if (labour) {
      setSelectedLabour(labour);
      setName(labour.Name);
      setMobileNumber(labour.MobileNumber || '');
      setPersonType(labour.PersonType || 'Mason');
      setDailyRate(labour.DailyRate?.toString() || '');
    } else {
      setSelectedLabour(null);
      setName('');
      setMobileNumber('');
      setPersonType('Mason');
      setDailyRate('');
    }
    setModalOpen(true);
  };

  const closeForm = () => {
    setModalOpen(false);
    setSelectedLabour(null);
    setName('');
    setMobileNumber('');
    setPersonType('Mason');
    setDailyRate('');
  };

  const handleDelete = (labour: Labour) => {
    Alert.alert(
      'Confirm Delete',
      `Delete "${labour.Name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(labour.id) },
      ]
    );
  };

  const personTypes = ['Mason', 'Helper', 'Carpenter', 'Painter', 'Plumber', 'Electrician', 'Supervisor'];

  const typeColor = (type?: string) => {
    const map: Record<string, string> = {
      Mason: '#F59E0B',
      Helper: '#6B7280',
      Carpenter: '#8B5CF6',
      Painter: '#EC4899',
      Plumber: '#3B82F6',
      Electrician: '#EF4444',
      Supervisor: '#10B981',
    };
    return map[type || ''] || colors.dark.textMuted;
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
          placeholder="Search labour..."
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
          data={labours}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <HardHat color={colors.dark.textMuted} size={48} />
              <Text style={styles.emptyText}>No labour found</Text>
              <Text style={styles.emptySubText}>Tap + to add a labour</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: typeColor(item.PersonType) + '22' }]}>
                  <HardHat color={typeColor(item.PersonType)} size={20} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.Name}</Text>
                  {item.MobileNumber ? (
                    <View style={styles.phoneRow}>
                      <Phone color={colors.dark.textMuted} size={12} />
                      <Text style={styles.cardSub}> {item.MobileNumber}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    <View style={[styles.typeBadge, { backgroundColor: typeColor(item.PersonType) + '22', borderColor: typeColor(item.PersonType) + '66' }]}>
                      <Text style={[styles.typeBadgeText, { color: typeColor(item.PersonType) }]}>{item.PersonType || 'N/A'}</Text>
                    </View>
                    {item.DailyRate ? (
                      <Text style={styles.rateText}>₹{item.DailyRate}/day</Text>
                    ) : null}
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedLabour ? 'Edit Labour' : 'Add Labour'}</Text>
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

            <Text style={styles.label}>Daily Rate (₹)</Text>
            <TextInput
              style={styles.input}
              value={dailyRate}
              onChangeText={setDailyRate}
              placeholder="e.g. 600"
              placeholderTextColor={colors.dark.textMuted}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Person Type</Text>
            <View style={styles.typeGrid}>
              {personTypes.map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typeChip, personType === t && styles.typeChipActive]}
                  onPress={() => setPersonType(t)}
                >
                  <Text style={[styles.typeChipText, personType === t && styles.typeChipTextActive]}>{t}</Text>
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
                : <Text style={styles.saveBtnText}>{selectedLabour ? 'Update' : 'Save'}</Text>}
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  rateText: { color: colors.dark.accent, fontSize: 12, fontWeight: '600' },
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
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
