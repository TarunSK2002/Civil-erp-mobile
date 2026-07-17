import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Calendar, Plus, Trash2, HardHat, ChevronDown, Check, Briefcase, PlusCircle, Clock, Ruler, X } from 'lucide-react-native';

interface ShiftType {
  id: number;
  ShiftType: string;
  ShiftMultiplier: number;
}

interface PersonType {
  id: number;
  Name: string;
  RateUnit: string;
  DailyRate: number;
}

interface AttendanceSheet {
  id: number;
  Title: string;
  WeekStartDate: string;
  WeekEndDate: string;
}

export default function AttendancePaySheetScreen() {
  const queryClient = useQueryClient();
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Selection references
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedPayeeId, setSelectedPayeeId] = useState('');
  
  // Dropdown selector state toggles for a cleaner mobile layout
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);

  // Form State
  const [calcMode, setCalcMode] = useState<'Shift' | 'Hour' | 'SqFt'>('Shift');
  const [selectedPersonType, setSelectedPersonType] = useState('');
  const [selectedShiftType, setSelectedShiftType] = useState('');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [labourCount, setLabourCount] = useState('1');
  const [hours, setHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [ratePerSqFt, setRatePerSqFt] = useState('');

  // Fetch Sheets
  const { data: sheets, isLoading: sheetsLoading } = useQuery<AttendanceSheet[]>({
    queryKey: ['attendance-sheets'],
    queryFn: async () => {
      const res = await api.get('/attendance-sheets');
      if (res.data.length > 0 && !selectedSheetId) {
        setSelectedSheetId(res.data[0].id);
      }
      return res.data;
    }
  });

  // Fetch sheet details
  const { data: sheetDetails, isFetching: detailsLoading } = useQuery({
    queryKey: ['sheet-detail', selectedSheetId],
    queryFn: async () => {
      if (!selectedSheetId) return null;
      const res = await api.get(`/attendance-sheets/${selectedSheetId}`);
      return res.data;
    },
    enabled: !!selectedSheetId
  });

  const { data: payees } = useQuery({
    queryKey: ['payees-dropdown'],
    queryFn: async () => {
      const res = await api.get('/payees');
      return res.data;
    }
  });

  const { data: sites } = useQuery({
    queryKey: ['sites-dropdown'],
    queryFn: async () => {
      const res = await api.get('/sites');
      return res.data;
    }
  });

  const { data: shiftTypes } = useQuery<ShiftType[]>({
    queryKey: ['shift-types'],
    queryFn: async () => {
      const res = await api.get('/shift-master');
      return res.data;
    }
  });

  const { data: personTypes } = useQuery<PersonType[]>({
    queryKey: ['person-types'],
    queryFn: async () => {
      const res = await api.get('/person-types');
      return res.data;
    }
  });

  const saveRecordMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        PayeeId: parseInt(selectedPayeeId),
        SiteId: parseInt(selectedSiteId),
        AttendanceDate: entryDate,
        CalculationMode: calcMode,
        LabourCount: parseInt(labourCount) || 1,
      };

      if (calcMode === 'Shift') {
        const selectedShift = shiftTypes?.find(s => s.ShiftType === selectedShiftType);
        payload.PersonType = selectedPersonType;
        payload.ShiftType = selectedShiftType;
        payload.ShiftMultiplier = selectedShift ? selectedShift.ShiftMultiplier : 1.0;
      } else if (calcMode === 'Hour') {
        payload.PersonType = selectedPersonType;
        payload.Hours = parseFloat(hours);
        payload.RatePerHour = parseFloat(ratePerHour);
      } else if (calcMode === 'SqFt') {
        payload.PersonType = selectedPersonType;
        payload.Length = length ? parseFloat(length) : null;
        payload.Breadth = breadth ? parseFloat(breadth) : null;
        payload.RatePerSqFt = parseFloat(ratePerSqFt);
      }

      return api.post(`/attendance-sheets/${selectedSheetId}/records`, payload);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Entry saved');
      queryClient.invalidateQueries({ queryKey: ['sheet-detail'] });
      setHours('');
      setRatePerHour('');
      setLength('');
      setBreadth('');
      setRatePerSqFt('');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save entry');
    }
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: number) => {
      return api.delete(`/attendance-sheets/${selectedSheetId}/records/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sheet-detail'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', 'Failed to remove record');
    }
  });

  const getSelectedCellTotal = () => {
    if (!sheetDetails?.grid || !selectedPayeeId || !selectedSiteId) return 0;
    const key = `${selectedPayeeId}_${selectedSiteId}`;
    const records = sheetDetails.grid[key]?.records || [];
    return records
      .filter((r: any) => r.date === entryDate)
      .reduce((sum: number, r: any) => sum + r.calculatedAmount, 0);
  };

  const getSelectedCellRecords = () => {
    if (!sheetDetails?.grid || !selectedPayeeId || !selectedSiteId) return [];
    const key = `${selectedPayeeId}_${selectedSiteId}`;
    const records = sheetDetails.grid[key]?.records || [];
    return records.filter((r: any) => r.date === entryDate);
  };

  const activeSiteName = sites?.find((s: any) => s.id.toString() === selectedSiteId)?.SiteName || 'Choose Site';
  const activePayeeName = payees?.find((p: any) => p.id.toString() === selectedPayeeId)?.Name || 'Choose Contractor';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* 🚀 Sticky Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerLeft}>
          <HardHat color={colors.dark.accent} size={24} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.bannerTitle}>Attendance Sheets</Text>
            <Text style={styles.bannerSubtitle}>Record daily logs & contractor values</Text>
          </View>
        </View>
      </View>

      {/* 📅 Weeks horizontal chip scroll */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Active Sheets</Text>
      </View>
      {sheetsLoading ? (
        <ActivityIndicator size="small" color={colors.dark.accent} style={{ marginVertical: 10 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sheetSelectorRow}>
          {sheets?.map((s) => (
            <Pressable
              key={s.id}
              style={[
                styles.sheetChip,
                selectedSheetId === s.id && styles.sheetChipActive
              ]}
              onPress={() => setSelectedSheetId(s.id)}
            >
              <Text style={[
                styles.sheetChipText,
                selectedSheetId === s.id && styles.sheetChipTextActive
              ]}>{s.Title}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* 📝 Main entry card */}
      <View style={styles.card}>
        {/* Date parameter */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
          <View style={styles.dateInputContainer}>
            <Calendar color={colors.dark.textSecondary} size={16} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.textInputStyle}
              value={entryDate}
              onChangeText={setEntryDate}
              placeholder="e.g. 2026-07-16"
              placeholderTextColor={colors.dark.textMuted}
            />
          </View>
        </View>

        {/* 🏢 Site Selector Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Site</Text>
          <Pressable 
            style={[styles.dropdownButton, showSiteDropdown && styles.dropdownButtonActive]} 
            onPress={() => { setShowSiteDropdown(!showSiteDropdown); setShowPayeeDropdown(false); }}
          >
            <Text style={selectedSiteId ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
              {activeSiteName}
            </Text>
            <ChevronDown color={colors.dark.textSecondary} size={16} />
          </Pressable>

          {showSiteDropdown && (
            <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
              {sites?.map((s: any) => (
                <Pressable
                  key={s.id}
                  style={styles.dropdownOption}
                  onPress={() => { setSelectedSiteId(s.id.toString()); setShowSiteDropdown(false); }}
                >
                  <Text style={styles.dropdownOptionText}>{s.SiteName}</Text>
                  {selectedSiteId === s.id.toString() && <Check color={colors.dark.accent} size={14} />}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* 👤 Contractor / Payee Dropdown */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Contractor / Mason</Text>
          <Pressable 
            style={[styles.dropdownButton, showPayeeDropdown && styles.dropdownButtonActive]} 
            onPress={() => { setShowPayeeDropdown(!showPayeeDropdown); setShowSiteDropdown(false); }}
          >
            <Text style={selectedPayeeId ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
              {activePayeeName}
            </Text>
            <ChevronDown color={colors.dark.textSecondary} size={16} />
          </Pressable>

          {showPayeeDropdown && (
            <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
              {payees?.map((p: any) => (
                <Pressable
                  key={p.id}
                  style={styles.dropdownOption}
                  onPress={() => { setSelectedPayeeId(p.id.toString()); setShowPayeeDropdown(false); }}
                >
                  <Text style={styles.dropdownOptionText}>{p.Name}</Text>
                  {selectedPayeeId === p.id.toString() && <Check color={colors.dark.accent} size={14} />}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ⚡ Calculation mode toggle selectors */}
        <View style={styles.tabSelector}>
          {(['Shift', 'Hour', 'SqFt'] as const).map((mode) => (
            <Pressable
              key={mode}
              style={[styles.tabButton, calcMode === mode && styles.tabButtonActive]}
              onPress={() => setCalcMode(mode)}
            >
              <Text style={[styles.tabButtonText, calcMode === mode && styles.tabButtonTextActive]}>
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 📋 Form Inputs according to calculation mode */}
        <View style={styles.modeFormWrapper}>
          {calcMode !== 'Shift' && (
            <View style={[styles.formGroup, { marginBottom: 14 }]}>
              <Text style={styles.inputLabel}>Person Type / Role</Text>
              <Pressable 
                style={[styles.dropdownButton, showRoleDropdown && styles.dropdownButtonActive]} 
                onPress={() => setShowRoleDropdown(true)}
              >
                <Text style={selectedPersonType ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                  {selectedPersonType || 'Choose Role'}
                </Text>
                <ChevronDown color={colors.dark.textSecondary} size={16} />
              </Pressable>
            </View>
          )}

          {calcMode === 'Shift' && (
            <View style={styles.formRow}>
              <View style={[styles.formCol, { flex: 1.2, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Role</Text>
                <Pressable 
                  style={[styles.rowDropdownButton, showRoleDropdown && styles.dropdownButtonActive]}
                  onPress={() => { setShowRoleDropdown(true); }}
                >
                  <Text style={selectedPersonType ? styles.rowDropdownSelectedText : styles.dropdownPlaceholderText} numberOfLines={1}>
                    {selectedPersonType || 'Choose'}
                  </Text>
                  <ChevronDown color={colors.dark.textSecondary} size={14} />
                </Pressable>
              </View>

              <View style={[styles.formCol, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Shift</Text>
                <Pressable 
                  style={[styles.rowDropdownButton, showShiftDropdown && styles.dropdownButtonActive]}
                  onPress={() => { setShowShiftDropdown(true); }}
                >
                  <Text style={selectedShiftType ? styles.rowDropdownSelectedText : styles.dropdownPlaceholderText} numberOfLines={1}>
                    {selectedShiftType || 'Choose'}
                  </Text>
                  <ChevronDown color={colors.dark.textSecondary} size={14} />
                </Pressable>
              </View>

              <View style={[styles.formCol, { width: 105 }]}>
                <Text style={styles.inputLabel}>Count</Text>
                <View style={styles.rowStepperContainer}>
                  <Pressable 
                    style={styles.rowStepperButton} 
                    onPress={() => {
                      const current = parseInt(labourCount) || 1;
                      if (current > 1) {
                        setLabourCount((current - 1).toString());
                      }
                    }}
                  >
                    <Text style={styles.rowStepperButtonText}>−</Text>
                  </Pressable>
                  <TextInput
                    style={styles.rowStepperInput}
                    value={labourCount}
                    onChangeText={(val) => {
                      const sanitized = val.replace(/[^0-9]/g, '');
                      setLabourCount(sanitized);
                    }}
                    keyboardType="number-pad"
                  />
                  <Pressable 
                    style={styles.rowStepperButton} 
                    onPress={() => {
                      const current = parseInt(labourCount) || 1;
                      setLabourCount((current + 1).toString());
                    }}
                  >
                    <Text style={styles.rowStepperButtonText}>+</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {calcMode === 'Hour' && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.rowWrapper}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Hours</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={hours}
                    onChangeText={setHours}
                    placeholder="Hours"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Rate/Hour (₹)</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={ratePerHour}
                    onChangeText={setRatePerHour}
                    placeholder="Rate/Hr"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          )}

          {calcMode === 'SqFt' && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.rowWrapper}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Length (ft)</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={length}
                    onChangeText={setLength}
                    placeholder="Length"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Breadth (ft)</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={breadth}
                    onChangeText={setBreadth}
                    placeholder="Breadth"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.formGroup, { marginTop: 8 }]}>
                <Text style={styles.inputLabel}>Rate per SqFt (₹)</Text>
                <TextInput
                  style={styles.textInputStyle}
                  value={ratePerSqFt}
                  onChangeText={setRatePerSqFt}
                  placeholder="Rate per SqFt"
                  placeholderTextColor={colors.dark.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <Pressable
            style={[
              styles.submitButton,
              (!selectedPayeeId || !selectedSiteId) && styles.submitButtonDisabled
            ]}
            onPress={() => saveRecordMutation.mutate()}
            disabled={saveRecordMutation.isPending || !selectedPayeeId || !selectedSiteId}
          >
            {saveRecordMutation.isPending ? (
              <ActivityIndicator color="#0F0F1A" />
            ) : (
              <Text style={styles.submitButtonText}>Save Daily Entry</Text>
            )}
          </Pressable>
        </View>
      </View>

      {/* 📊 Cell Log Summary Card */}
      {selectedSiteId && selectedPayeeId ? (
        <View style={styles.card}>
          <View style={styles.summaryTitleRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>Logs Registered</Text>
              <Text style={styles.cardHeaderSubtitle}>Reviewing {activeSiteName} - {activePayeeName}</Text>
            </View>
            <Text style={styles.accentVal}>₹{getSelectedCellTotal().toLocaleString('en-IN')}</Text>
          </View>

          {getSelectedCellRecords().length > 0 ? (
            getSelectedCellRecords().map((rec: any) => (
              <View key={rec.id} style={styles.recordListRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recTitle}>
                    {rec.personType} — {rec.calculationMode === 'Shift' ? `${rec.shiftType} Shift` : `${rec.calculationMode} mode`}
                  </Text>
                  <Text style={styles.recMuted}>
                    {rec.calculationMode === 'Shift' && `Multiplier: ${rec.shiftMultiplier} | Count: ${rec.labourCount}`}
                    {rec.calculationMode === 'Hour' && `${rec.hours} Hrs @ ₹${rec.ratePerHour}/Hr`}
                    {rec.calculationMode === 'SqFt' && `${rec.length}×${rec.breadth} ft @ ₹${rec.ratePerSqFt}/SqFt`}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.recAmt}>₹{rec.calculatedAmount.toLocaleString('en-IN')}</Text>
                  <Pressable style={styles.trashBtn} onPress={() => deleteRecordMutation.mutate(rec.id)}>
                    <Trash2 color={colors.dark.error} size={15} />
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noLogsPlaceholder}>No attendance registered for this date</Text>
          )}
        </View>
      ) : null}
      {/* Role Selection Sheet */}
      <Modal
        visible={showRoleDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowRoleDropdown(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Role</Text>
              <Pressable onPress={() => setShowRoleDropdown(false)} style={styles.closeSheetBtn}>
                <X color={colors.dark.textPrimary} size={18} />
              </Pressable>
            </View>
            <ScrollView style={styles.bottomSheetList} nestedScrollEnabled={true}>
              {personTypes?.map((pt: PersonType) => (
                <Pressable
                  key={pt.id}
                  style={[
                    styles.bottomSheetOption,
                    selectedPersonType === pt.Name && styles.bottomSheetOptionActive
                  ]}
                  onPress={() => {
                    setSelectedPersonType(pt.Name);
                    setShowRoleDropdown(false);
                    if (calcMode === 'Hour') {
                      setRatePerHour(pt.DailyRate.toString());
                    }
                  }}
                >
                  <Text style={[
                    styles.bottomSheetOptionText,
                    selectedPersonType === pt.Name && styles.bottomSheetOptionTextActive
                  ]}>
                    {pt.Name}
                  </Text>
                  {selectedPersonType === pt.Name && <Check color={colors.dark.accent} size={14} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Shift Selection Sheet */}
      <Modal
        visible={showShiftDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowShiftDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowShiftDropdown(false)}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Select Shift Duration</Text>
              <Pressable onPress={() => setShowShiftDropdown(false)} style={styles.closeSheetBtn}>
                <X color={colors.dark.textPrimary} size={18} />
              </Pressable>
            </View>
            <ScrollView style={styles.bottomSheetList} nestedScrollEnabled={true}>
              {shiftTypes?.map((st: ShiftType) => (
                <Pressable
                  key={st.id}
                  style={[
                    styles.bottomSheetOption,
                    selectedShiftType === st.ShiftType && styles.bottomSheetOptionActive
                  ]}
                  onPress={() => {
                    setSelectedShiftType(st.ShiftType);
                    setShowShiftDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.bottomSheetOptionText,
                    selectedShiftType === st.ShiftType && styles.bottomSheetOptionTextActive
                  ]}>
                    {st.ShiftType} (×{st.ShiftMultiplier})
                  </Text>
                  {selectedShiftType === st.ShiftType && <Check color={colors.dark.accent} size={14} />}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  headerBanner: {
    backgroundColor: colors.dark.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingVertical: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerTitle: {
    color: colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: colors.dark.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetSelectorRow: {
    flexDirection: 'row',
    paddingLeft: 20,
    marginBottom: 16,
  },
  sheetChip: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  sheetChipActive: {
    backgroundColor: colors.dark.accent,
    borderColor: colors.dark.accent,
  },
  sheetChipText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sheetChipTextActive: {
    color: '#0F0F1A',
  },
  card: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  textInputStyle: {
    flex: 1,
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownButtonActive: {
    borderColor: colors.dark.accent,
  },
  dropdownPlaceholderText: {
    color: colors.dark.textMuted,
    fontSize: 14,
  },
  dropdownSelectedText: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    marginTop: 6,
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  dropdownOptionText: {
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.dark.bgInput,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  tabButtonText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.dark.accent,
  },
  modeFormWrapper: {
    paddingTop: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  formChip: {
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  formChipActive: {
    borderColor: colors.dark.accent,
    backgroundColor: colors.dark.accent,
  },
  formChipText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  formChipTextActive: {
    color: '#0F0F1A',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    overflow: 'hidden',
    width: 150,
    marginTop: 6,
  },
  stepperButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.dark.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    color: colors.dark.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  stepperInput: {
    width: 62,
    height: 44,
    color: colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    padding: 0,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 100,
  },
  formCol: {
    position: 'relative',
  },
  rowDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
    marginTop: 6,
  },
  rowDropdownSelectedText: {
    color: colors.dark.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: colors.dark.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  bottomSheetTitle: {
    color: colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeSheetBtn: {
    padding: 4,
  },
  bottomSheetList: {
    marginBottom: 10,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    borderRadius: 8,
    marginBottom: 6,
  },
  bottomSheetOptionActive: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderColor: colors.dark.accent,
    borderWidth: 1,
  },
  bottomSheetOptionText: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSheetOptionTextActive: {
    color: colors.dark.accent,
  },
  rowStepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    overflow: 'hidden',
    height: 40,
    marginTop: 6,
    width: 105,
  },
  rowStepperButton: {
    width: 32,
    height: 38,
    backgroundColor: colors.dark.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowStepperButtonText: {
    color: colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  rowStepperInput: {
    flex: 1,
    height: 38,
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    padding: 0,
  },
  rowWrapper: {
    flexDirection: 'row',
  },
  submitButton: {
    backgroundColor: colors.dark.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#0F0F1A',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardHeaderSubtitle: {
    color: colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  accentVal: {
    color: colors.dark.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  recordListRow: {
    backgroundColor: colors.dark.bgInput,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recTitle: {
    color: colors.dark.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  recMuted: {
    color: colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  recAmt: {
    color: colors.dark.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  trashBtn: {
    marginLeft: 12,
    padding: 4,
  },
  noLogsPlaceholder: {
    color: colors.dark.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
});
