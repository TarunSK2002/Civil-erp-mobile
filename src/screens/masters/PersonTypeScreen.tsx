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
import { UserCheck, Plus, Edit2, Trash2, X } from 'lucide-react-native';

interface PersonType {
  id: number;
  PersonTypeName: string;
  DefaultWage?: number;
  Description?: string;
}

export default function PersonTypeScreen() {
  const [types, setTypes] = useState<PersonType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<PersonType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [defaultWage, setDefaultWage] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/person-types');
      setTypes(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch person types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const openAddModal = () => {
    setEditingType(null);
    setTypeName('');
    setDefaultWage('');
    setDescription('');
    setModalVisible(true);
  };

  const openEditModal = (item: PersonType) => {
    setEditingType(item);
    setTypeName(item.PersonTypeName || '');
    setDefaultWage(item.DefaultWage ? item.DefaultWage.toString() : '');
    setDescription(item.Description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!typeName.trim()) {
      Alert.alert('Validation', 'Person Type Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        PersonTypeName: typeName.trim(),
        DefaultWage: parseFloat(defaultWage) || 0,
        Description: description.trim(),
      };

      if (editingType) {
        await api.put(`/person-types/${editingType.id}`, payload);
      } else {
        await api.post('/person-types', payload);
      }

      setModalVisible(false);
      fetchTypes();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save person type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: PersonType) => {
    Alert.alert('Delete Person Type', `Delete "${item.PersonTypeName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/person-types/${item.id}`);
            fetchTypes();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const filteredTypes = types.filter((t) =>
    t.PersonTypeName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search person types..." />

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredTypes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <UserCheck color={colors.dark.accent} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.typeName}>{item.PersonTypeName}</Text>
                  {item.Description ? (
                    <Text style={styles.typeDesc}>{item.Description}</Text>
                  ) : null}
                </View>
                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                  <Text style={styles.wageLabel}>Default Wage</Text>
                  <Text style={styles.wageValue}>₹{(item.DefaultWage || 0).toLocaleString('en-IN')}</Text>
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
              <Text style={styles.modalTitle}>{editingType ? 'Edit Person Type' : 'Add Person Type'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Type Name *</Text>
            <TextInput
              style={styles.input}
              value={typeName}
              onChangeText={setTypeName}
              placeholder="e.g. Mason, Helper, Painter"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Default Daily Wage (₹)</Text>
            <TextInput
              style={styles.input}
              value={defaultWage}
              onChangeText={setDefaultWage}
              keyboardType="numeric"
              placeholder="e.g. 850"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Optional details"
              placeholderTextColor={colors.dark.textMuted}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Save Person Type</Text>
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
  typeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  typeDesc: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  wageLabel: {
    fontSize: 10,
    color: colors.dark.textMuted,
  },
  wageValue: {
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
