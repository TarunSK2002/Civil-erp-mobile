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

const UNITS = [
  'nos', 'unit', 'kg', 'litr', 'running feet', 'ton', 'bill',
  'cu ft', 'sq ft', 'cu m', 'sq m', 'meter', 'running meter', 'box',
  'PVC door', 'PVC Window', 'UPVC door', 'UPVC window',
  'Aluminium door', 'aluminium window', 'steel door', 'steel window',
  'wpc door', 'teekwood door', 'flush door', 'mahakani door',
  'wood Ventilator', 'upvc ventilator'
];

export default function PurchaseFormScreen({ navigation }: any) {
  const [sites, setSites] = useState<any[]>([]);
  const [materialTypes, setMaterialTypes] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Form State matching Win App schema
  const [siteId, setSiteId] = useState<number | null>(null);
  const [materialId, setMaterialId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('nos');
  const [dealerName, setDealerName] = useState('');
  const [ratePerUnit, setRatePerUnit] = useState('');
  const [amount, setAmount] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // SqFt specific fields
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [sqFt, setSqFt] = useState('');
  const [wastagePercent, setWastagePercent] = useState('0');

  // Optional Section / Project fields
  const [sections, setSections] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Modal State for Dropdowns
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [siteSearch, setSiteSearch] = useState('');
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState('');
  const [unitModalOpen, setUnitModalOpen] = useState(false);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [sitesRes, typesRes] = await Promise.all([
          api.get('/sites'),
          api.get('/material-types'),
        ]);
        setSites(sitesRes.data || []);
        setMaterialTypes(typesRes.data || []);
        if (sitesRes.data?.length > 0) setSiteId(sitesRes.data[0].Id || sitesRes.data[0].id);
      } catch (err: any) {
        Alert.alert('Error', 'Failed to load sites and material types');
      } finally {
        setLoadingDropdowns(false);
      }
    }
    loadDropdowns();
  }, []);

  // Fetch sections and projects when siteId changes
  useEffect(() => {
    if (siteId) {
      api.get(`/site-sections/site/${siteId}`).then(res => setSections(res.data || [])).catch(() => {});
      api.get(`/site-projects/site/${siteId}`).then(res => setProjects(res.data || [])).catch(() => {});
    } else {
      setSections([]);
      setProjects([]);
    }
  }, [siteId]);

  const selectedMatType = materialTypes.find(t => String(t.id) === String(materialId));
  const currentCalcMode = selectedMatType?.CalculationMode || 'Manual';

  // Handle calculations based on CalculationMode and inputs (Win App logic)
  useEffect(() => {
    if (!selectedMatType) return;
    const rate = ratePerUnit !== '' ? parseFloat(ratePerUnit) : parseFloat(selectedMatType.Price || 0);

    if (currentCalcMode === 'SqFtRate') {
      const len = parseFloat(length || '0');
      const brd = parseFloat(breadth || '0');
      const wastage = parseFloat(wastagePercent || '0');
      
      const computedSqFt = len * brd;
      setSqFt(computedSqFt > 0 ? computedSqFt.toFixed(2) : '');

      const billableSqFt = computedSqFt * (1 + wastage / 100);
      setQuantity(billableSqFt > 0 ? billableSqFt.toFixed(2) : '');

      const computedAmount = billableSqFt * rate;
      setAmount(computedAmount > 0 ? computedAmount.toFixed(2) : '');
    } else if (currentCalcMode === 'QuantityRate') {
      const qty = parseFloat(quantity || '0');
      const computedAmount = qty * rate;
      setAmount(computedAmount > 0 ? computedAmount.toFixed(2) : '');
    } else {
      const qty = parseFloat(quantity || '0');
      if (qty > 0 && rate > 0) {
        setAmount((qty * rate).toFixed(2));
      }
    }
  }, [materialId, quantity, length, breadth, wastagePercent, ratePerUnit, selectedMatType, currentCalcMode]);

  const selectedSite = sites.find(s => (s.Id || s.id) === siteId);

  const filteredSites = sites.filter(s =>
    (s.SiteName || '').toLowerCase().includes(siteSearch.toLowerCase())
  );

  const filteredMaterials = materialTypes.filter(m =>
    (m.Name || '').toLowerCase().includes(materialSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!siteId || !materialId) {
      Alert.alert('Validation Error', 'Please select a Site and Material');
      return;
    }
    const tot = parseFloat(amount) || 0;
    if (tot <= 0) {
      Alert.alert('Validation Error', 'Total Amount must be greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        SiteId: siteId,
        MaterialId: materialId,
        Quantity: parseFloat(quantity) || 0,
        Unit: unit,
        Amount: tot,
        DealerName: dealerName.trim(),
        PurchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
        Length: length ? parseFloat(length) : null,
        Breadth: breadth ? parseFloat(breadth) : null,
        SqFt: sqFt ? parseFloat(sqFt) : null,
        WastagePercent: wastagePercent ? parseFloat(wastagePercent) : 0,
        RatePerUnit: ratePerUnit ? parseFloat(ratePerUnit) : 0,
        CalculationMode: currentCalcMode,
        SectionId: sectionId || null,
        ProjectId: projectId || null,
      };

      await api.post('/site-materials', payload);
      Alert.alert('Success', 'Record Purchase successfully saved', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.msg || err.response?.data?.message || 'Failed to record purchase');
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
        <Text style={styles.title}>Record Purchase</Text>

        {/* 1. Site Dropdown */}
        <Text style={styles.label}>Site *</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => {
            setSiteSearch('');
            setSiteModalOpen(true);
          }}
        >
          <Text style={styles.dropdownSelectorText}>
            {selectedSite ? selectedSite.SiteName : 'Select Site'}
          </Text>
          <ChevronDown color={colors.dark.textSecondary} size={20} />
        </TouchableOpacity>

        {/* 2. Material Dropdown */}
        <Text style={styles.label}>Material *</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          onPress={() => {
            setMaterialSearch('');
            setMaterialModalOpen(true);
          }}
        >
          <Text style={styles.dropdownSelectorText}>
            {selectedMatType ? selectedMatType.Name : 'Select Material'}
          </Text>
          <ChevronDown color={colors.dark.textSecondary} size={20} />
        </TouchableOpacity>

        {/* Calculation Mode Banner if selected */}
        {selectedMatType && (
          <View style={styles.modeInfoBanner}>
            <Text style={styles.modeInfoText}>
              Calculation Mode: <Text style={{ fontWeight: 'bold', color: colors.dark.accent }}>{currentCalcMode}</Text> (Rate: ₹{parseFloat(selectedMatType.Price || 0).toLocaleString('en-IN')} per {selectedMatType.DefaultUnit || 'nos'})
            </Text>
          </View>
        )}

        {/* Conditional SqFt Inputs */}
        {currentCalcMode === 'SqFtRate' ? (
          <View style={styles.sqFtBox}>
            <View style={styles.row}>
              <View style={{ flex: 0.48 }}>
                <Text style={styles.label}>Length (ft) *</Text>
                <TextInput
                  style={styles.input}
                  value={length}
                  onChangeText={setLength}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.dark.textMuted}
                />
              </View>
              <View style={{ flex: 0.48 }}>
                <Text style={styles.label}>Breadth (ft) *</Text>
                <TextInput
                  style={styles.input}
                  value={breadth}
                  onChangeText={setBreadth}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.dark.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 0.48 }}>
                <Text style={styles.label}>Calculated Area (SqFt)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.dark.bgPrimary, color: colors.dark.textMuted }]}
                  value={sqFt}
                  editable={false}
                  placeholder="0.00"
                />
              </View>
              <View style={{ flex: 0.48 }}>
                <Text style={styles.label}>Wastage %</Text>
                <TextInput
                  style={styles.input}
                  value={wastagePercent}
                  onChangeText={setWastagePercent}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.dark.textMuted}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Quantity & Unit Row */
          <View style={styles.row}>
            <View style={{ flex: 0.48 }}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>
            <View style={{ flex: 0.48 }}>
              <Text style={styles.label}>Unit *</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setUnitModalOpen(true)}
              >
                <Text style={styles.dropdownSelectorText}>{unit}</Text>
                <ChevronDown color={colors.dark.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dealer / Vendor & Rate per Unit */}
        <View style={styles.row}>
          <View style={{ flex: 0.48 }}>
            <Text style={styles.label}>Dealer / Vendor *</Text>
            <TextInput
              style={styles.input}
              value={dealerName}
              onChangeText={setDealerName}
              placeholder="Enter dealer name"
              placeholderTextColor={colors.dark.textMuted}
            />
          </View>
          <View style={{ flex: 0.48 }}>
            <Text style={styles.label}>
              {currentCalcMode === 'SqFtRate' ? 'Rate per SqFt (₹) *' : 'Rate per Unit (₹) *'}
            </Text>
            <TextInput
              style={styles.input}
              value={ratePerUnit}
              onChangeText={setRatePerUnit}
              keyboardType="numeric"
              placeholder="Rate"
              placeholderTextColor={colors.dark.textMuted}
            />
          </View>
        </View>

        {/* Total Amount & Purchase Date */}
        <View style={styles.row}>
          <View style={{ flex: 0.48 }}>
            <Text style={styles.label}>Total Amount (₹) *</Text>
            <TextInput
              style={[styles.input, { fontWeight: 'bold', color: colors.dark.accent }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Total cost"
              placeholderTextColor={colors.dark.textMuted}
            />
          </View>
          <View style={{ flex: 0.48 }}>
            <Text style={styles.label}>Purchase Date *</Text>
            <TextInput
              style={styles.input}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.dark.textMuted}
            />
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitBtnText}>Record Purchase</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 1. Searchable Site Modal */}
      <Modal visible={siteModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Site</Text>
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

      {/* 2. Searchable Material Modal */}
      <Modal visible={materialModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Material</Text>
              <TouchableOpacity onPress={() => setMaterialModalOpen(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Search color={colors.dark.textMuted} size={18} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={materialSearch}
                onChangeText={setMaterialSearch}
                placeholder="Search material types..."
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>
            <FlatList
              data={filteredMaterials}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const isSelected = materialId === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, isSelected && styles.listItemActive]}
                    onPress={() => {
                      setMaterialId(item.id);
                      setUnit(item.DefaultUnit || 'nos');
                      setRatePerUnit(item.Price ? String(item.Price) : '');
                      setLength('');
                      setBreadth('');
                      setSqFt('');
                      setWastagePercent('0');
                      setAmount('');
                      setMaterialModalOpen(false);
                    }}
                  >
                    <View>
                      <Text style={[styles.listItemText, isSelected && styles.listItemTextActive]}>
                        {item.Name}
                      </Text>
                      <Text style={styles.listItemSub}>
                        {item.CalculationMode || 'Manual'} | ₹{item.Price || 0} / {item.DefaultUnit || 'nos'}
                      </Text>
                    </View>
                    {isSelected && <Check color={colors.dark.accent} size={18} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* 3. Unit Selector Modal */}
      <Modal visible={unitModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Unit</Text>
              <TouchableOpacity onPress={() => setUnitModalOpen(false)}>
                <X color={colors.dark.textPrimary} size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={UNITS}
              keyExtractor={(item) => item}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => {
                const isSelected = unit === item;
                return (
                  <TouchableOpacity
                    style={[styles.listItem, isSelected && styles.listItemActive]}
                    onPress={() => {
                      setUnit(item);
                      setUnitModalOpen(false);
                    }}
                  >
                    <Text style={[styles.listItemText, isSelected && styles.listItemTextActive]}>
                      {item}
                    </Text>
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
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  dropdownSelectorText: {
    fontSize: 14,
    color: colors.dark.textPrimary,
  },
  input: {
    backgroundColor: colors.dark.bgSecondary,
    borderRadius: 10,
    padding: 12,
    color: colors.dark.textPrimary,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  modeInfoBanner: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 0, 0.2)',
  },
  modeInfoText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  sqFtBox: {
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  submitBtn: {
    backgroundColor: colors.dark.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F0F1A',
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
