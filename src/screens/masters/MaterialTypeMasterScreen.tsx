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
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import { Layers, Plus, X, Trash2, Edit2 } from 'lucide-react-native';

interface MaterialType {
  id: number;
  Name: string;
  DefaultUnit?: string;
  Price?: number;
}

export default function MaterialTypeMasterScreen() {
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState<MaterialType | null>(null);
  const [name, setName] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('nos');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/material-types');
      setMaterialTypes(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch material types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const openAddModal = () => {
    setEditingType(null);
    setName('');
    setDefaultUnit('nos');
    setPrice('');
    setModalVisible(true);
  };

  const openEditModal = (type: MaterialType) => {
    setEditingType(type);
    setName(type.Name || '');
    setDefaultUnit(type.DefaultUnit || 'nos');
    setPrice(type.Price ? type.Price.toString() : '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Material Type Name is required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        Name: name.trim(),
        DefaultUnit: defaultUnit.trim(),
        Price: parseFloat(price) || 0,
      };

      if (editingType) {
        await api.put(`/material-types/${editingType.id}`, payload);
      } else {
        await api.post('/material-types', payload);
      }

      setModalVisible(false);
      fetchTypes();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save material type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (type: MaterialType) => {
    Alert.alert('Delete Material Type', `Are you sure you want to delete "${type.Name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/material-types/${type.id}`);
            fetchTypes();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.msg || 'Failed to delete');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Text style={styles.headerTitle}>Material Types Master</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={materialTypes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <Layers color={colors.dark.accent} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.typeName}>{item.Name}</Text>
                  <Text style={styles.typeSub}>
                    Unit: {item.DefaultUnit || 'nos'} | Base Price: ₹{item.Price || 0}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openEditModal(item)} style={{ padding: 6, marginRight: 6 }}>
                  <Edit2 color={colors.dark.textSecondary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 6 }}>
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

      {/* Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingType ? 'Edit Material Type' : 'Add Material Type'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Material Type Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Cement, Steel, Sand"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Default Unit</Text>
            <TextInput
              style={styles.input}
              value={defaultUnit}
              onChangeText={setDefaultUnit}
              placeholder="e.g. nos, bags, tons, sqft"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Base Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="e.g. 450"
              placeholderTextColor={colors.dark.textMuted}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Save Material Type</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
    marginBottom: 16,
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
  typeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  typeSub: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
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
