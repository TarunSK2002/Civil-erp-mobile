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
} from 'react-native';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import { Clock, Plus, Edit2, Trash2, X } from 'lucide-react-native';

interface ShiftMaster {
  id: number;
  ShiftName: string;
  Multiplier: number;
  Description?: string;
}

export default function ShiftMasterScreen() {
  const [shifts, setShifts] = useState<ShiftMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftMaster | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [multiplier, setMultiplier] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/shift-master');
      setShifts(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const openAddModal = () => {
    setEditingShift(null);
    setShiftName('');
    setMultiplier('1.0');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (item: ShiftMaster) => {
    setEditingShift(item);
    setShiftName(item.ShiftName || '');
    setMultiplier(item.Multiplier ? item.Multiplier.toString() : '1.0');
    setDescription(item.Description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!shiftName.trim()) {
      Alert.alert('Validation', 'Shift Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ShiftName: shiftName.trim(),
        Multiplier: parseFloat(multiplier) || 1.0,
        Description: description.trim(),
      };

      if (editingShift) {
        await api.put(`/shift-master/${editingShift.id}`, payload);
      } else {
        await api.post('/shift-master', payload);
      }

      setModalVisible(false);
      fetchShifts();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save shift');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: ShiftMaster) => {
    Alert.alert('Delete Shift', `Delete "${item.ShiftName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/shift-master/${item.id}`);
            fetchShifts();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const filteredShifts = shifts.filter((s) =>
    s.ShiftName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search shifts..." />

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredShifts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Clock color={colors.dark.accent} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.shiftName}>{item.ShiftName}</Text>
                  {item.Description ? (
                    <Text style={styles.shiftDesc}>{item.Description}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                  <Text style={styles.multLabel}>Multiplier</Text>
                  <Text style={styles.multValue}>{item.Multiplier}x</Text>
                </View>
                <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 4, marginRight: 6 }}>
                  <Edit2 color={colors.dark.textSecondary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 4 }}>
                  <Trash2 color={colors.dark.error} size={18} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Plus color="#000" size={24} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingShift ? 'Edit Shift' : 'Add Shift'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Shift Name *</Text>
            <TextInput
              style={styles.input}
              value={shiftName}
              onChangeText={setShiftName}
              placeholder="e.g. Full Day, Half Day, Night Shift"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Wage Multiplier (e.g. 1.0 = 100%, 0.5 = 50%, 1.5 = 150%)</Text>
            <TextInput
              style={styles.input}
              value={multiplier}
              onChangeText={setMultiplier}
              keyboardType="numeric"
              placeholder="1.0"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Optional notes"
              placeholderTextColor={colors.dark.textMuted}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Save Shift</Text>
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
  card: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
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
  shiftName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  shiftDesc: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  multLabel: {
    fontSize: 10,
    color: colors.dark.textMuted,
  },
  multValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.dark.accent,
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
