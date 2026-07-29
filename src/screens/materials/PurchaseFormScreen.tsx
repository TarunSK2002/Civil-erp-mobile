import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';

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

  // Dropdown Modals State
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [dealerSearch, setDealerSearch] = useState('');

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
        if (materialsRes.data?.length > 0) {
          setMaterialId(materialsRes.data[0].id);
          setSupplierName(materialsRes.data[0].Name || '');
        }
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

  const selectedSite = sites.find((s) => (s.Id || s.id) === siteId);
  const selectedDealer = materials.find((m) => m.id === materialId);

  const filteredSites = sites.filter((s) =>
    (s.SiteName || '').toLowerCase().includes(siteSearch.toLowerCase())
  );

  const filteredDealers = materials.filter((m) =>
    (m.Name || '').toLowerCase().includes(dealerSearch.toLowerCase())
  );

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
        SupplierName: supplierName.trim() || selectedDealer?.Name || '',
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>New Material Purchase</Text>

        {/* Select Site Dropdown Field */}
        <Text style={styles.label}>Select Site *</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => {
            setSiteSearch('');
            setSiteModalOpen(true);
          }}
        >
          <Text style={styles.dropdownSelectorText}>
            {selectedSite ? selectedSite.SiteName : 'Choose a site...'}
          </Text>
          <ChevronDown color={colors.dark.textSecondary} size={20} />
        </TouchableOpacity>

        {/* Select Dealer Dropdown Field */}
        <Text style={styles.label}>Material Dealer / Supplier *</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => {
            setDealerSearch('');
            setDealerModalOpen(true);
          }}
        >
          <Text style={styles.dropdownSelectorText}>
            {selectedDealer ? selectedDealer.Name : 'Choose a dealer / supplier...'}
          </Text>
          <ChevronDown color={colors.dark.textSecondary} size={20} />
        </TouchableOpacity>

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

      {/* Searchable Site Modal */}
      <Modal visible={siteModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Construction Site</Text>
              <TouchableOpacity onPress={() => setSiteModalOpen(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Search color={colors.dark.textMuted} size={18} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={siteSearch}
                onChangeText={setSiteSearch}
                placeholder="Search sites..."
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <FlatList
              data={filteredSites}
              keyExtractor={(item) => (item.Id || item.id).toString()}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const sId = item.Id || item.id;
                const isSelected = siteId === sId;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, isSelected && styles.listItemActive]}
                    onPress={() => {
                      setSiteId(sId);
                      setSiteModalOpen(false);
                    }}
                  >
                    <Text style={[styles.listItemText, isSelected && styles.listItemTextActive]}>
                      {item.SiteName}
                    </Text>
                    {isSelected && <Check color={colors.dark.accent} size={18} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Searchable Dealer Modal */}
      <Modal visible={dealerModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Material Dealer</Text>
              <TouchableOpacity onPress={() => setDealerModalOpen(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Search color={colors.dark.textMuted} size={18} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={dealerSearch}
                onChangeText={setDealerSearch}
                placeholder="Search dealers..."
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <FlatList
              data={filteredDealers}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const isSelected = materialId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, isSelected && styles.listItemActive]}
                    onPress={() => {
                      setMaterialId(item.id);
                      setSupplierName(item.Name || '');
                      setDealerModalOpen(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.listItemText, isSelected && styles.listItemTextActive]}>
                        {item.Name}
                      </Text>
                      {item.MaterialTypeName && (
                        <Text style={styles.listItemSub}>{item.MaterialTypeName}</Text>
                      )}
                    </View>
                    {isSelected && <Check color={colors.dark.accent} size={18} />}
                  </TouchableOpacity>
                );
              }}
            />
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
    marginBottom: 6,
    marginTop: 4,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  dropdownSelectorText: {
    fontSize: 14,
    color: colors.dark.textPrimary,
    fontWeight: '500',
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
    maxHeight: '80%',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  searchInput: {
    flex: 1,
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  listItemActive: {
    backgroundColor: 'rgba(255,179,0,0.08)',
    borderRadius: 8,
  },
  listItemText: {
    fontSize: 14,
    color: colors.dark.textPrimary,
  },
  listItemTextActive: {
    color: colors.dark.accent,
    fontWeight: 'bold',
  },
  listItemSub: {
    fontSize: 11,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
});
