import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import { Check } from 'lucide-react-native';

export default function PurchaseFormScreen({ navigation }: any) {
  const [sites, setSites] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Form State
  const [siteId, setSiteId] = useState<number | null>(null);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [billNo, setBillNo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitRate, setUnitRate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [sitesRes, materialsRes] = await Promise.all([
          api.get('/sites'),
          api.get('/materials'),
        ]);
        setSites(sitesRes.data || []);
        setMaterials(materialsRes.data || []);
        if (sitesRes.data?.length > 0) setSiteId(sitesRes.data[0].Id || sitesRes.data[0].id);
        if (materialsRes.data?.length > 0) setMaterialId(materialsRes.data[0].id);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to load sites and material dealers');
      } finally {
        setLoadingDropdowns(false);
      }
    }
    loadDropdowns();
  }, []);

  // Auto-calculate Total Amount when Qty or UnitRate changes
  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(unitRate) || 0;
    if (q > 0 && r > 0) {
      setTotalAmount((q * r).toString());
    }
  }, [quantity, unitRate]);

  const handleSubmit = async () => {
    if (!siteId || !materialId) {
      Alert.alert('Validation Error', 'Please select a Site and Material Dealer');
      return;
    }
    const tot = parseFloat(totalAmount) || 0;
    if (tot <= 0) {
      Alert.alert('Validation Error', 'Total Amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        SiteId: siteId,
        MaterialId: materialId,
        SupplierName: supplierName.trim(),
        BillNo: billNo.trim(),
        Quantity: parseFloat(quantity) || 0,
        UnitRate: parseFloat(unitRate) || 0,
        TotalAmount: tot,
        PaidAmount: parseFloat(paidAmount) || 0,
        Remarks: remarks.trim(),
        PurchaseDate: new Date().toISOString().split('T')[0],
      };

      await api.post('/site-materials', payload);
      Alert.alert('Success', 'Purchase recorded successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create purchase record');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDropdowns) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>New Material Purchase</Text>

      {/* Select Site */}
      <Text style={styles.label}>Select Site *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {sites.map((s) => {
          const sId = s.Id || s.id;
          const isSelected = siteId === sId;
          return (
            <TouchableOpacity
              key={sId}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => setSiteId(sId)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{s.SiteName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Select Dealer */}
      <Text style={styles.label}>Material Dealer / Supplier *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {materials.map((m) => {
          const isSelected = materialId === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => {
                setMaterialId(m.id);
                if (m.Name) setSupplierName(m.Name);
              }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{m.Name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.label}>Bill / Invoice Number</Text>
      <TextInput
        style={styles.input}
        value={billNo}
        onChangeText={setBillNo}
        placeholder="e.g. INV-2026-089"
        placeholderTextColor={colors.dark.textMuted}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 0.48 }}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="e.g. 100"
            placeholderTextColor={colors.dark.textMuted}
          />
        </View>
        <View style={{ flex: 0.48 }}>
          <Text style={styles.label}>Unit Rate (₹)</Text>
          <TextInput
            style={styles.input}
            value={unitRate}
            onChangeText={setUnitRate}
            keyboardType="numeric"
            placeholder="e.g. 450"
            placeholderTextColor={colors.dark.textMuted}
          />
        </View>
      </View>

      <Text style={styles.label}>Total Amount (₹) *</Text>
      <TextInput
        style={[styles.input, { fontWeight: 'bold', color: colors.dark.accent }]}
        value={totalAmount}
        onChangeText={setTotalAmount}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={colors.dark.textMuted}
      />

      <Text style={styles.label}>Paid Amount (Advance/Partial) (₹)</Text>
      <TextInput
        style={styles.input}
        value={paidAmount}
        onChangeText={setPaidAmount}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={colors.dark.textMuted}
      />

      <Text style={styles.label}>Remarks / Notes</Text>
      <TextInput
        style={[styles.input, { height: 60 }]}
        value={remarks}
        onChangeText={setRemarks}
        multiline
        placeholder="e.g. Delivered 50 bags OPC cement"
        placeholderTextColor={colors.dark.textMuted}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Check color="#000" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.submitBtnText}>Save Purchase Entry</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.dark.bgPrimary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.dark.accent,
    borderColor: colors.dark.accent,
  },
  chipText: {
    fontSize: 13,
    color: colors.dark.textSecondary,
  },
  chipTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 10,
    padding: 12,
    color: colors.dark.textPrimary,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  submitBtn: {
    backgroundColor: colors.dark.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});
