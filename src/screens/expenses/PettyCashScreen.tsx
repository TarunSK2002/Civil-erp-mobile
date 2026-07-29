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
import { colors } from '../../theme/colors';
import api from '../../api/client';
import { DollarSign, Plus, Calendar, Trash2, X, Wallet } from 'lucide-react-native';

interface PersonalExpense {
  id: number;
  Category: string;
  Amount: number;
  ExpenseDate: string;
  Description?: string;
}

export default function PettyCashScreen() {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [pettyCashSummary, setPettyCashSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState('Office');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = ['Office', 'Transport', 'Food', 'Personal', 'Site Misc'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resExpenses, resPetty] = await Promise.all([
        api.get('/personal-expenses'),
        api.get('/petty-cash'),
      ]);
      setExpenses(resExpenses.data || []);
      setPettyCashSummary(resPetty.data || null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch petty cash expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddExpense = async () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      Alert.alert('Validation', 'Please enter a valid expense amount');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        Category: category,
        Amount: amt,
        Description: description.trim(),
        ExpenseDate: new Date().toISOString().split('T')[0],
      };

      await api.post('/personal-expenses', payload);
      setModalVisible(false);
      setAmount('');
      setDescription('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to log expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: number) => {
    Alert.alert('Delete Expense', 'Delete this logged expense entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/personal-expenses/${id}`);
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete');
          }
        },
      },
    ]);
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + (curr.Amount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Balance Banner Header */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Wallet color={colors.dark.accent} size={24} />
          <Text style={styles.balanceTitle}>Petty Cash Overview</Text>
        </View>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Total Logged Expenses</Text>
            <Text style={styles.balanceAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
          </View>
          {pettyCashSummary?.CurrentBalance !== undefined && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.balanceLabel}>Petty Cash Balance</Text>
              <Text style={[styles.balanceAmount, { color: colors.dark.success }]}>
                ₹{(pettyCashSummary.CurrentBalance || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.sectionHeader}>Expense History</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.dark.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                  <DollarSign color={colors.dark.accent} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.catText}>{item.Category}</Text>
                  {item.Description ? (
                    <Text style={styles.descText}>{item.Description}</Text>
                  ) : null}
                  <View style={styles.dateRow}>
                    <Calendar color={colors.dark.textMuted} size={12} />
                    <Text style={styles.dateText}>
                      {new Date(item.ExpenseDate).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.amountText}>₹{(item.Amount || 0).toLocaleString('en-IN')}</Text>
                <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} style={{ padding: 6, marginLeft: 8 }}>
                  <Trash2 color={colors.dark.error} size={16} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="#000" size={24} />
      </TouchableOpacity>

      {/* Modal Form */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Personal / Petty Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Category</Text>
            <View style={styles.catContainer}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Amount (₹) *</Text>
            <TextInput
              style={[styles.input, { fontSize: 18, fontWeight: 'bold', color: colors.dark.accent }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.dark.textMuted}
            />

            <Text style={styles.label}>Description / Details</Text>
            <TextInput
              style={[styles.input, { height: 60 }]}
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="e.g. Fuel for site visit / Tea snacks"
              placeholderTextColor={colors.dark.textMuted}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddExpense} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Save Expense Log</Text>
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
  balanceCard: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.dark.accent,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
    marginLeft: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 11,
    color: colors.dark.textSecondary,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark.accent,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 12,
    padding: 14,
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
  catText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  descText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: colors.dark.textMuted,
    marginLeft: 4,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.error,
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
  catContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.dark.bgInput,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  catChipActive: {
    backgroundColor: colors.dark.accent,
    borderColor: colors.dark.accent,
  },
  catChipText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  catChipTextActive: {
    color: '#000',
    fontWeight: 'bold',
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
