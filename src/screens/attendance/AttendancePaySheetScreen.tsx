import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Calendar, Plus, Trash2, HardHat, ChevronDown, Check, Briefcase, PlusCircle, Clock, Ruler, X, TrendingUp, Coffee, Package, Settings } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useNavigation } from '@react-navigation/native';
import { FileSpreadsheet } from 'lucide-react-native';

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
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [selectedSheetId, setSelectedSheetId] = useState<number | null>(null);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);

  // Date Picker State & Handlers
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const getInitialDatePickerDate = () => {
    if (!entryDate) return new Date();
    const parts = entryDate.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date();
  };

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
  const [labourCount, setLabourCount] = useState('1');
  const [hours, setHours] = useState('');
  const [ratePerHour, setRatePerHour] = useState('');
  const [length, setLength] = useState('');
  const [breadth, setBreadth] = useState('');
  const [ratePerSqFt, setRatePerSqFt] = useState('');
  const [activeTab, setActiveTab] = useState<'attendance' | 'misc' | 'lifting'>('attendance');
  const [selectedSectionId, setSelectedSectionId] = useState('');

  // Sheet Creation State
  const [isCreateSheetVisible, setIsCreateSheetVisible] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [newSheetStartDate, setNewSheetStartDate] = useState('');
  const [newSheetEndDate, setNewSheetEndDate] = useState('');

  // Master Settings State
  const [isMasterSettingsVisible, setIsMasterSettingsVisible] = useState(false);
  const [editingMaster, setEditingMaster] = useState({
    TeaExpense: '20',
    BusExpense: '50',
    LatestAppVersion: '3.2.0',
    UpdateLink: 'https://drive.google.com'
  });

  // Lifting Rates State
  const [isLiftingRatesVisible, setIsLiftingRatesVisible] = useState(false);
  const [editingLiftingRates, setEditingLiftingRates] = useState<Record<string, string>>({});
  const [selectedLiftingMaterial, setSelectedLiftingMaterial] = useState<'M.Sand' | 'Jally' | 'Sengal'>('M.Sand');

  // Misc State
  const [profitPercent, setProfitPercent] = useState('');
  const [profitAmount, setProfitAmount] = useState('');
  const [newMiscName, setNewMiscName] = useState('');
  const [newMiscAmount, setNewMiscAmount] = useState('');

  // Lifting State
  const [newLiftingMat, setNewLiftingMat] = useState('M.Sand');
  const [newLiftingFloor, setNewLiftingFloor] = useState('G.Floor');
  const [newLiftingQty, setNewLiftingQty] = useState('1');
  const [newLiftingRate, setNewLiftingRate] = useState('');

  // Fetch Sheets
  const { data: sheets, isLoading: sheetsLoading } = useQuery<AttendanceSheet[]>({
    queryKey: ['attendance-sheets'],
    queryFn: async () => {
      const res = await api.get('/attendance-sheets');
      // Sort sheets by start date DESC, then ID DESC so that the latest sheet always comes first
      const sorted = [...res.data].sort((a, b) => {
        if (b.WeekStartDate !== a.WeekStartDate) {
          return b.WeekStartDate.localeCompare(a.WeekStartDate);
        }
        return b.id - a.id;
      });
      if (sorted.length > 0 && !selectedSheetId) {
        setSelectedSheetId(sorted[0].id);
      }
      return sorted;
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

  const { data: siteSections } = useQuery({
    queryKey: ['site-sections', selectedSiteId],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      const res = await api.get(`/site-sections/site/${selectedSiteId}`);
      return res.data;
    },
    enabled: !!selectedSiteId
  });

  const { data: masterSettings } = useQuery({
    queryKey: ['master-settings'],
    queryFn: async () => {
      const res = await api.get('/master-settings');
      return res.data;
    }
  });

  const { data: liftingRates } = useQuery({
    queryKey: ['lifting-rates'],
    queryFn: async () => {
      const res = await api.get('/attendance-sheets/lifting/rates');
      return res.data;
    }
  });

  const { data: liftingRecords } = useQuery({
    queryKey: ['lifting-records', selectedSheetId],
    queryFn: async () => {
      if (!selectedSheetId) return [];
      const res = await api.get(`/attendance-sheets/${selectedSheetId}/lifting-records`);
      return res.data;
    },
    enabled: !!selectedSheetId
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
        payload.SectionId = selectedSectionId ? parseInt(selectedSectionId) : null;
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
      setSelectedSectionId('');
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

  const deleteMiscMutation = useMutation({
    mutationFn: async (miscId: number) => {
      return api.delete(`/attendance-sheets/${selectedSheetId}/misc/${miscId}`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Misc charge deleted');
      queryClient.invalidateQueries({ queryKey: ['sheet-detail'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to remove misc item');
    }
  });

  const saveMiscMutation = useMutation({
    mutationFn: async (payload: { name: string; amount: number }) => {
      return api.post(`/attendance-sheets/${selectedSheetId}/misc`, {
        PayeeId: parseInt(selectedPayeeId),
        SiteId: parseInt(selectedSiteId),
        MiscName: payload.name,
        Amount: payload.amount
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Misc item saved');
      queryClient.invalidateQueries({ queryKey: ['sheet-detail'] });
      setNewMiscName('');
      setNewMiscAmount('');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save misc item');
    }
  });

  const saveLiftingMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/attendance-sheets/${selectedSheetId}/lifting-records`, {
        PayeeId: parseInt(selectedPayeeId),
        SiteId: parseInt(selectedSiteId),
        MaterialType: newLiftingMat,
        Floor: newLiftingFloor,
        Quantity: parseFloat(newLiftingQty) || 1,
        Rate: parseFloat(newLiftingRate) || 0,
        LiftingDate: entryDate
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Lifting record saved');
      queryClient.invalidateQueries({ queryKey: ['lifting-records'] });
      queryClient.invalidateQueries({ queryKey: ['sheet-detail'] });
      setNewLiftingQty('1');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save lifting record');
    }
  });

  const deleteLiftingMutation = useMutation({
    mutationFn: async (liftingId: number) => {
      return api.delete(`/attendance-sheets/${selectedSheetId}/lifting-records/${liftingId}`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Lifting record deleted');
      queryClient.invalidateQueries({ queryKey: ['lifting-records'] });
      queryClient.invalidateQueries({ queryKey: ['sheet-detail'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to remove lifting record');
    }
  });

  // Sync masterSettings data with local editing state
  React.useEffect(() => {
    if (masterSettings) {
      setEditingMaster({
        TeaExpense: masterSettings.TeaExpense ? masterSettings.TeaExpense.toString() : '20',
        BusExpense: masterSettings.BusExpense ? masterSettings.BusExpense.toString() : '50',
        LatestAppVersion: masterSettings.LatestAppVersion ? masterSettings.LatestAppVersion.toString() : '3.2.0',
        UpdateLink: masterSettings.UpdateLink ? masterSettings.UpdateLink.toString() : 'https://drive.google.com',
      });
    }
  }, [masterSettings]);

  // Sync liftingRates data with local editing state
  React.useEffect(() => {
    if (liftingRates) {
      const ratesMap: Record<string, string> = {};
      liftingRates.forEach((r: any) => {
        ratesMap[`${r.MaterialType}_${r.Floor}`] = r.Rate.toString();
      });
      setEditingLiftingRates(ratesMap);
    }
  }, [liftingRates]);

  const saveSheetMutation = useMutation({
    mutationFn: async () => {
      if (!newSheetTitle || !newSheetStartDate || !newSheetEndDate) {
        throw new Error('All fields are required');
      }
      const res = await api.post('/attendance-sheets', {
        Title: newSheetTitle,
        WeekStartDate: newSheetStartDate,
        WeekEndDate: newSheetEndDate,
      });
      return res.data;
    },
    onSuccess: (data) => {
      Alert.alert('Success', 'Sheet created successfully');
      queryClient.invalidateQueries({ queryKey: ['attendance-sheets'] });
      if (data && data.id) {
        setSelectedSheetId(data.id);
      }
      setIsCreateSheetVisible(false);
      setNewSheetTitle('');
      setNewSheetStartDate('');
      setNewSheetEndDate('');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || err.message || 'Failed to create sheet');
    }
  });

  const saveMasterSettingsMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        api.put('/master-settings/TeaExpense', { value: editingMaster.TeaExpense }),
        api.put('/master-settings/BusExpense', { value: editingMaster.BusExpense }),
      ]);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Master settings updated');
      queryClient.invalidateQueries({ queryKey: ['master-settings'] });
      setIsMasterSettingsVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || err.message || 'Failed to save master settings');
    }
  });

  const saveLiftingRatesMutation = useMutation({
    mutationFn: async () => {
      const mats = ['M.Sand', 'Jally', 'Sengal'];
      const floors = ['G.Floor', '1st floor', '2nd floor', '3rd floor'];
      const promises: Promise<any>[] = [];
      mats.forEach(mat => {
        floors.forEach(floor => {
          const key = `${mat}_${floor}`;
          const rate = editingLiftingRates[key] !== undefined ? parseFloat(editingLiftingRates[key]) : 0;
          promises.push(
            api.post('/attendance-sheets/lifting/rates', {
              MaterialType: mat,
              Floor: floor,
              Rate: rate
            })
          );
        });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Lifting rates updated');
      queryClient.invalidateQueries({ queryKey: ['lifting-rates'] });
      setIsLiftingRatesVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || err.message || 'Failed to save lifting rates');
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

  const getWeeklySiteAttendance = () => {
    if (!sheetDetails?.grid || !selectedPayeeId || !selectedSiteId) return 0;
    const key = `${selectedPayeeId}_${selectedSiteId}`;
    const records = sheetDetails.grid[key]?.records || [];
    return records.reduce((sum: number, r: any) => sum + parseFloat(r.calculatedAmount || 0), 0);
  };

  const getWeeklySiteLabourCount = () => {
    if (!sheetDetails?.grid || !selectedPayeeId || !selectedSiteId) return 0;
    const key = `${selectedPayeeId}_${selectedSiteId}`;
    const records = sheetDetails.grid[key]?.records || [];
    return records.reduce((sum: number, r: any) => sum + (r.labourCount || 0), 0);
  };

  const getMiscItems = () => {
    if (!sheetDetails?.miscData || !selectedPayeeId || !selectedSiteId) return [];
    const payeeMisc = sheetDetails.miscData[selectedPayeeId]?.items || [];
    return payeeMisc.filter((m: any) => m.siteId === parseInt(selectedSiteId));
  };

  const getSelectedLiftingRecords = () => {
    if (!liftingRecords || !selectedPayeeId || !selectedSiteId) return [];
    return liftingRecords.filter((r: any) =>
      r.PayeeId === parseInt(selectedPayeeId) &&
      r.SiteId === parseInt(selectedSiteId) &&
      r.LiftingDate === entryDate
    );
  };

  const getWeeklyLiftingTotal = () => {
    if (!liftingRecords || !selectedPayeeId || !selectedSiteId) return 0;
    return liftingRecords
      .filter((r: any) => r.PayeeId === parseInt(selectedPayeeId) && r.SiteId === parseInt(selectedSiteId))
      .reduce((sum: number, r: any) => sum + parseFloat(r.Amount || 0), 0);
  };

  // Auto-populate SqFt rate when section changes
  React.useEffect(() => {
    if (selectedSectionId && siteSections) {
      const sec = siteSections.find((s: any) => s.id.toString() === selectedSectionId);
      if (sec && sec.RatePerSqFt) {
        setRatePerSqFt(sec.RatePerSqFt.toString());
      }
    }
  }, [selectedSectionId, siteSections]);

  // Auto-populate lifting rate when material or floor changes
  React.useEffect(() => {
    if (liftingRates) {
      const matched = liftingRates.find(
        (r: any) => r.MaterialType === newLiftingMat && r.Floor === newLiftingFloor
      );
      setNewLiftingRate(matched ? matched.Rate.toString() : '');
    }
  }, [newLiftingMat, newLiftingFloor, liftingRates]);

  // Load profit settings when misc items change
  React.useEffect(() => {
    const profitItem = getMiscItems().find((m: any) => m.name.startsWith('Mason Profit'));
    if (profitItem) {
      const match = profitItem.name.match(/Mason Profit \((\d+(\.\d+)?)%\)/);
      setProfitPercent(match ? match[1] : '');
      setProfitAmount(profitItem.amount.toString());
    } else {
      setProfitPercent('');
      setProfitAmount('');
    }
  }, [sheetDetails, selectedPayeeId, selectedSiteId]);

  const handlePercentChange = (val: string) => {
    setProfitPercent(val);
    const p = parseFloat(val);
    const weeklySiteAttendance = getWeeklySiteAttendance();
    if (!isNaN(p)) {
      const computed = (weeklySiteAttendance * p) / 100;
      setProfitAmount(computed.toFixed(2));
    } else {
      setProfitAmount('');
    }
  };

  const handleSaveProfit = () => {
    const amt = parseFloat(profitAmount);
    const profitItem = getMiscItems().find((m: any) => m.name.startsWith('Mason Profit'));

    if (isNaN(amt) || amt <= 0) {
      if (profitItem) {
        deleteMiscMutation.mutate(profitItem.id);
      }
      return;
    }

    const name = profitPercent ? `Mason Profit (${profitPercent}%)` : 'Mason Profit';

    if (profitItem) {
      deleteMiscMutation.mutate(profitItem.id, {
        onSuccess: () => {
          saveMiscMutation.mutate({ name, amount: amt });
        }
      });
    } else {
      saveMiscMutation.mutate({ name, amount: amt });
    }
  };

  const activeSiteName = sites?.find((s: any) => s.id.toString() === selectedSiteId)?.SiteName || 'Choose Site';
  const activePayeeName = payees?.find((p: any) => p.id.toString() === selectedPayeeId)?.Name || 'Choose Contractor';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
          <View style={styles.headerRightActions}>
            <Pressable style={styles.headerActionButton} onPress={() => navigation.navigate('LabourList')}>
              <HardHat color={colors.dark.accent} size={18} />
            </Pressable>
            <Pressable style={styles.headerActionButton} onPress={() => navigation.navigate('WeeklyPayList')}>
              <FileSpreadsheet color={colors.dark.accent} size={18} />
            </Pressable>
            <Pressable style={styles.headerActionButton} onPress={() => setIsLiftingRatesVisible(true)}>
              <Ruler color={colors.dark.accent} size={18} />
            </Pressable>
            <Pressable style={styles.headerActionButton} onPress={() => setIsMasterSettingsVisible(true)}>
              <Settings color={colors.dark.accent} size={18} />
            </Pressable>
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
            <Pressable
              style={[
                styles.sheetChip,
                {
                  backgroundColor: colors.dark.accent + '15',
                  borderColor: colors.dark.accent,
                  borderStyle: 'dashed',
                  borderWidth: 1
                }
              ]}
              onPress={() => {
                // Pre-populate with typical dates: start = Monday, end = Sunday of current week
                const today = new Date();
                const day = today.getDay();
                const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(today.setDate(diffToMonday));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);

                setNewSheetStartDate(monday.toISOString().split('T')[0]);
                setNewSheetEndDate(sunday.toISOString().split('T')[0]);
                setNewSheetTitle(`Week ${monday.getDate()} ${monday.toLocaleString('default', { month: 'short' })} - ${sunday.getDate()} ${sunday.toLocaleString('default', { month: 'short' })}`);
                setIsCreateSheetVisible(true);
              }}
            >
              <Text style={[styles.sheetChipText, { color: colors.dark.accent, fontWeight: '700' }]}>
                + New Sheet
              </Text>
            </Pressable>
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
                ]}>
                  {s.Title}
                  {s.WeekStartDate && s.WeekEndDate ? (
                    ` (${s.WeekStartDate.split('-')[2]}/${s.WeekStartDate.split('-')[1]} - ${s.WeekEndDate.split('-')[2]}/${s.WeekEndDate.split('-')[1]})`
                  ) : ''}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* 🎛️ Tab Switcher */}
        <View style={styles.topTabBar}>
          <Pressable
            style={[styles.topTabButton, activeTab === 'attendance' && styles.topTabButtonActive]}
            onPress={() => setActiveTab('attendance')}
          >
            <Clock color={activeTab === 'attendance' ? '#0F0F1A' : colors.dark.textSecondary} size={14} />
            <Text style={[styles.topTabButtonText, activeTab === 'attendance' && styles.topTabButtonTextActive]}>
              Attendance
            </Text>
          </Pressable>
          <Pressable
            style={[styles.topTabButton, activeTab === 'misc' && styles.topTabButtonActiveMisc]}
            onPress={() => setActiveTab('misc')}
          >
            <TrendingUp color={activeTab === 'misc' ? '#0F0F1A' : colors.dark.textSecondary} size={14} />
            <Text style={[styles.topTabButtonText, activeTab === 'misc' && styles.topTabButtonTextActiveMisc]}>
              Misc Charges
            </Text>
          </Pressable>
          <Pressable
            style={[styles.topTabButton, activeTab === 'lifting' && styles.topTabButtonActiveLifting]}
            onPress={() => setActiveTab('lifting')}
          >
            <Package color={activeTab === 'lifting' ? '#0F0F1A' : colors.dark.textSecondary} size={14} />
            <Text style={[styles.topTabButtonText, activeTab === 'lifting' && styles.topTabButtonTextActiveLifting]}>
              Lifting
            </Text>
          </Pressable>
        </View>

        {/* 📝 Main entry card */}
        <View style={styles.card}>
          {/* Date parameter */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Date (YYYY-MM-DD)</Text>
            {Platform.OS === 'web' ? (
              <View style={styles.dateInputContainer}>
                <Calendar color={colors.dark.textSecondary} size={16} style={{ marginRight: 8 }} />
                <Text style={styles.dropdownSelectedText}>{entryDate}</Text>
                <ChevronDown color={colors.dark.textSecondary} size={16} style={{ marginLeft: 'auto' }} />
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  onClick={(e: any) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) { }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    border: 'none',
                    zIndex: 99,
                  }}
                />
              </View>
            ) : (
              <Pressable style={styles.dateInputContainer} onPress={showDatePicker}>
                <Calendar color={colors.dark.textSecondary} size={16} style={{ marginRight: 8 }} />
                <Text style={styles.dropdownSelectedText}>{entryDate}</Text>
                <ChevronDown color={colors.dark.textSecondary} size={16} style={{ marginLeft: 'auto' }} />
              </Pressable>
            )}
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

          {activeTab === 'attendance' && (
            <View style={{ marginTop: 10 }}>
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
                <Text style={styles.inputLabel}>Person Type / Role</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScrollRow}>
                  {personTypes?.map((pt: PersonType) => (
                    <Pressable
                      key={pt.id}
                      style={[
                        styles.formChip,
                        selectedPersonType === pt.Name && styles.formChipActive
                      ]}
                      onPress={() => {
                        setSelectedPersonType(pt.Name);
                        if (calcMode === 'Hour') {
                          setRatePerHour(pt.DailyRate.toString());
                        }
                      }}
                    >
                      <Text style={[
                        styles.formChipText,
                        selectedPersonType === pt.Name && styles.formChipTextActive
                      ]}>{pt.Name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>

                {calcMode === 'Shift' && (
                  <View>
                    <Text style={styles.inputLabel}>Shift Value</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScrollRow}>
                      {shiftTypes?.map((st: ShiftType) => (
                        <Pressable
                          key={st.id}
                          style={[
                            styles.formChip,
                            selectedShiftType === st.ShiftType && styles.formChipActive
                          ]}
                          onPress={() => setSelectedShiftType(st.ShiftType)}
                        >
                          <Text style={[
                            styles.formChipText,
                            selectedShiftType === st.ShiftType && styles.formChipTextActive
                          ]}>{st.ShiftType} (×{st.ShiftMultiplier})</Text>
                        </Pressable>
                      ))}
                    </ScrollView>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Labour Count</Text>
                      <View style={styles.stepperContainer}>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => {
                            const current = parseInt(labourCount) || 1;
                            if (current > 1) {
                              setLabourCount((current - 1).toString());
                            }
                          }}
                        >
                          <Text style={styles.stepperButtonText}>−</Text>
                        </Pressable>
                        <TextInput
                          style={styles.stepperInput}
                          value={labourCount}
                          onChangeText={(val) => {
                            const sanitized = val.replace(/[^0-9]/g, '');
                            setLabourCount(sanitized);
                          }}
                          keyboardType="number-pad"
                        />
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => {
                            const current = parseInt(labourCount) || 1;
                            setLabourCount((current + 1).toString());
                          }}
                        >
                          <Text style={styles.stepperButtonText}>+</Text>
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
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Floor / Section</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScrollRow}>
                        {siteSections?.map((sec: any) => (
                          <Pressable
                            key={sec.id}
                            style={[
                              styles.formChip,
                              selectedSectionId === sec.id.toString() && styles.formChipActive
                            ]}
                            onPress={() => setSelectedSectionId(sec.id.toString())}
                          >
                            <Text style={[
                              styles.formChipText,
                              selectedSectionId === sec.id.toString() && styles.formChipTextActive
                            ]}>
                              {sec.Name} {sec.RatePerSqFt ? `(₹${sec.RatePerSqFt})` : ''}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>

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
          )}

          {activeTab === 'misc' && (
            <View style={{ marginTop: 10 }}>
              {/* Mason Salary Profit Card */}
              <View style={styles.profitCard}>
                <View style={styles.profitHeaderRow}>
                  <TrendingUp color="#4CAF50" size={16} />
                  <Text style={styles.profitHeaderTitle}>Mason Salary Profit for this Site</Text>
                </View>
                <View style={styles.profitDetailRow}>
                  <Text style={styles.profitDetailLabel}>Weekly Site Attendance:</Text>
                  <Text style={styles.profitDetailValue}>₹{getWeeklySiteAttendance().toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.rowWrapper}>
                  <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Profit (%)</Text>
                    <TextInput
                      style={styles.textInputStyle}
                      value={profitPercent}
                      onChangeText={handlePercentChange}
                      placeholder="e.g. 10"
                      placeholderTextColor={colors.dark.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Profit Value (₹)</Text>
                    <TextInput
                      style={styles.textInputStyle}
                      value={profitAmount}
                      onChangeText={setProfitAmount}
                      placeholder="e.g. 300"
                      placeholderTextColor={colors.dark.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {profitPercent ? (
                  <Text style={styles.calcFormulaText}>
                    Calculation: ₹{getWeeklySiteAttendance().toLocaleString('en-IN')} × {profitPercent}% = ₹{((getWeeklySiteAttendance() * (parseFloat(profitPercent) || 0)) / 100).toLocaleString('en-IN')}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <Pressable
                    style={[styles.saveProfitBtn, saveMiscMutation.isPending && { opacity: 0.7 }]}
                    onPress={handleSaveProfit}
                    disabled={saveMiscMutation.isPending}
                  >
                    <Text style={styles.saveProfitBtnText}>
                      {saveMiscMutation.isPending ? 'Saving...' : 'Save Profit'}
                    </Text>
                  </Pressable>
                  {getMiscItems().find((m: any) => m.name.startsWith('Mason Profit')) ? (
                    <Pressable
                      style={styles.removeProfitBtn}
                      onPress={() => {
                        const item = getMiscItems().find((m: any) => m.name.startsWith('Mason Profit'));
                        if (item) deleteMiscMutation.mutate(item.id);
                      }}
                    >
                      <Text style={styles.removeProfitBtnText}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* Auto-calculated Allowances */}
              {(() => {
                const teaRate = parseFloat(masterSettings?.TeaExpense) || 20;
                const busRate = parseFloat(masterSettings?.BusExpense) || 50;
                const labourCountWeekly = getWeeklySiteLabourCount();
                const teaTotal = labourCountWeekly * teaRate;
                const busTotal = labourCountWeekly * busRate;

                const isTeaAdded = getMiscItems().some((m: any) => m.name === 'Tea Charges');
                const isBusAdded = getMiscItems().some((m: any) => m.name === 'Bus Charges');

                if (labourCountWeekly > 0 && (!isTeaAdded || !isBusAdded)) {
                  return (
                    <View style={styles.allowanceCard}>
                      <Text style={styles.allowanceTitle}>
                        ☕ Auto Allowances (Weekly: {labourCountWeekly} workers)
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        {!isTeaAdded && (
                          <Pressable
                            style={styles.allowanceBtn}
                            onPress={() => saveMiscMutation.mutate({ name: 'Tea Charges', amount: teaTotal })}
                          >
                            <Text style={styles.allowanceBtnText}>Add Tea (₹{teaTotal})</Text>
                          </Pressable>
                        )}
                        {!isBusAdded && (
                          <Pressable
                            style={styles.allowanceBtn}
                            onPress={() => saveMiscMutation.mutate({ name: 'Bus Charges', amount: busTotal })}
                          >
                            <Text style={styles.allowanceBtnText}>Add Bus (₹{busTotal})</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                }
                return null;
              })()}

              {/* Add Manual Misc Charge Form */}
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.dark.border, paddingTop: 16 }}>
                <Text style={styles.cardHeaderTitle}>Add Misc Charge</Text>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={newMiscName}
                    onChangeText={setNewMiscName}
                    placeholder="e.g. Travel, Tea Expense"
                    placeholderTextColor={colors.dark.textMuted}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Amount (₹)</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={newMiscAmount}
                    onChangeText={setNewMiscAmount}
                    placeholder="0"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>

                <Pressable
                  style={[
                    styles.submitButtonMisc,
                    (!newMiscName || !newMiscAmount || !selectedPayeeId || !selectedSiteId) && styles.submitButtonDisabled
                  ]}
                  onPress={() => saveMiscMutation.mutate({ name: newMiscName, amount: parseFloat(newMiscAmount) || 0 })}
                  disabled={saveMiscMutation.isPending || !newMiscName || !newMiscAmount || !selectedPayeeId || !selectedSiteId}
                >
                  <Text style={styles.submitButtonText}>+ Add Misc Charge</Text>
                </Pressable>
              </View>
            </View>
          )}

          {activeTab === 'lifting' && (
            <View style={{ marginTop: 10 }}>
              {/* Log Lifting Work Form */}
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Material Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScrollRow}>
                  {['M.Sand', 'Jally', 'Sengal'].map((mat) => (
                    <Pressable
                      key={mat}
                      style={[
                        styles.formChip,
                        newLiftingMat === mat && styles.formChipActiveLifting
                      ]}
                      onPress={() => setNewLiftingMat(mat)}
                    >
                      <Text style={[
                        styles.formChipText,
                        newLiftingMat === mat && styles.formChipTextActiveLifting
                      ]}>{mat}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>Floor Level</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScrollRow}>
                  {['G.Floor', '1st floor', '2nd floor', '3rd floor'].map((floor) => (
                    <Pressable
                      key={floor}
                      style={[
                        styles.formChip,
                        newLiftingFloor === floor && styles.formChipActiveLifting
                      ]}
                      onPress={() => setNewLiftingFloor(floor)}
                    >
                      <Text style={[
                        styles.formChipText,
                        newLiftingFloor === floor && styles.formChipTextActiveLifting
                      ]}>{floor}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.rowWrapper}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Qty / Pcs</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={newLiftingQty}
                    onChangeText={setNewLiftingQty}
                    placeholder="Quantity"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Rate (₹)</Text>
                  <TextInput
                    style={styles.textInputStyle}
                    value={newLiftingRate}
                    onChangeText={setNewLiftingRate}
                    placeholder="Rate"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {newLiftingRate ? (
                <Text style={styles.calcFormulaTextLifting}>
                  Calculation: {newLiftingQty || '0'} units/pcs × ₹{newLiftingRate} = ₹{(parseFloat(newLiftingQty || '0') * parseFloat(newLiftingRate || '0')).toLocaleString('en-IN')}
                </Text>
              ) : null}

              <Pressable
                style={[
                  styles.submitButtonLifting,
                  (!newLiftingQty || !newLiftingRate || !selectedPayeeId || !selectedSiteId) && styles.submitButtonDisabled
                ]}
                onPress={() => saveLiftingMutation.mutate()}
                disabled={saveLiftingMutation.isPending || !newLiftingQty || !newLiftingRate || !selectedPayeeId || !selectedSiteId}
              >
                <Text style={styles.submitButtonText}>+ Log Lifting Work</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 📊 Cell Log Summary Card */}
        {selectedSiteId && selectedPayeeId ? (
          <View>
            {activeTab === 'attendance' && (
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
            )}

            {activeTab === 'misc' && (
              <View style={styles.card}>
                <View style={styles.summaryTitleRow}>
                  <View>
                    <Text style={styles.cardHeaderTitle}>Site Misc Charges</Text>
                    <Text style={styles.cardHeaderSubtitle}>Reviewing {activeSiteName} - {activePayeeName}</Text>
                  </View>
                  <Text style={[styles.accentVal, { color: '#00BCD4' }]}>
                    ₹{getMiscItems().reduce((sum: number, m: any) => sum + m.amount, 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                {getMiscItems().length > 0 ? (
                  getMiscItems().map((m: any) => (
                    <View key={m.id} style={styles.recordListRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recTitle}>{m.name}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.recAmt, { color: '#00BCD4' }]}>₹{m.amount.toLocaleString('en-IN')}</Text>
                        <Pressable style={styles.trashBtn} onPress={() => deleteMiscMutation.mutate(m.id)}>
                          <Trash2 color={colors.dark.error} size={15} />
                        </Pressable>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noLogsPlaceholder}>No misc charges logged for this site</Text>
                )}
              </View>
            )}

            {activeTab === 'lifting' && (
              <View style={styles.card}>
                <View style={styles.summaryTitleRow}>
                  <View>
                    <Text style={styles.cardHeaderTitle}>Logged Lifting Work</Text>
                    <Text style={styles.cardHeaderSubtitle}>Reviewing {activeSiteName} - {activePayeeName} for {entryDate}</Text>
                  </View>
                  <Text style={[styles.accentVal, { color: '#bd1ee9ff' }]}>
                    ₹{getSelectedLiftingRecords().reduce((sum: number, r: any) => sum + r.Amount, 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                {getSelectedLiftingRecords().length > 0 ? (
                  getSelectedLiftingRecords().map((rec: any) => (
                    <View key={rec.id} style={styles.recordListRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recTitle}>{rec.MaterialType} — {rec.Floor}</Text>
                        <Text style={styles.recMuted}>Qty: {rec.Quantity} | Rate: ₹{rec.Rate}/unit</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.recAmt, { color: '#bd1ee9ff' }]}>₹{rec.Amount.toLocaleString('en-IN')}</Text>
                        <Pressable style={styles.trashBtn} onPress={() => deleteLiftingMutation.mutate(rec.id)}>
                          <Trash2 color={colors.dark.error} size={15} />
                        </Pressable>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noLogsPlaceholder}>No material lifting logged for this date</Text>
                )}
              </View>
            )}

            {/* 🧾 Combined Weekly Site Total */}
            <View style={styles.combinedTotalBanner}>
              <Text style={styles.combinedTotalLabel}>Combined Site Total (Weekly)</Text>
              <Text style={styles.combinedTotalValue}>
                ₹{(
                  getWeeklySiteAttendance() +
                  getMiscItems().reduce((sum: number, m: any) => sum + m.amount, 0) +
                  getWeeklyLiftingTotal()
                ).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        ) : null}
        {isDatePickerVisible && (
          <DateTimePicker
            value={getInitialDatePickerDate()}
            mode="date"
            display="default"
            onValueChange={(event, date) => {
              if (date) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                setEntryDate(`${year}-${month}-${day}`);
              }
              setDatePickerVisibility(false);
            }}
            onDismiss={() => {
              setDatePickerVisibility(false);
            }}
          />
        )}

        {/* 🧾 Create Sheet Modal */}
        <Modal
          visible={isCreateSheetVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsCreateSheetVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Create New Attendance Sheet</Text>
                <Pressable style={styles.closeSheetBtn} onPress={() => setIsCreateSheetVisible(false)}>
                  <X color={colors.dark.textSecondary} size={20} />
                </Pressable>
              </View>

              <ScrollView style={{ marginBottom: 20 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Sheet Title</Text>
                  <View style={[styles.masterInputContainer, { maxWidth: 250 }]}>
                    <TextInput
                      style={styles.masterTextInput}
                      value={newSheetTitle}
                      onChangeText={setNewSheetTitle}
                      placeholder="e.g. Week 30 - July 2026"
                      placeholderTextColor={colors.dark.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Week Start Date (YYYY-MM-DD)</Text>
                  {Platform.OS === 'web' ? (
                    <View style={[styles.dateInputContainer, { maxWidth: 250 }]}>
                      <Calendar color={colors.dark.textSecondary} size={16} style={{ marginRight: 8 }} />
                      <Text style={styles.dropdownSelectedText}>{newSheetStartDate}</Text>
                      <ChevronDown color={colors.dark.textSecondary} size={16} style={{ marginLeft: 'auto' }} />
                      <input
                        type="date"
                        value={newSheetStartDate}
                        onChange={(e) => {
                          const dateVal = e.target.value;
                          setNewSheetStartDate(dateVal);
                          if (dateVal) {
                            const d = new Date(dateVal);
                            d.setDate(d.getDate() + 6);
                            setNewSheetEndDate(d.toISOString().split('T')[0]);
                          }
                        }}
                        onClick={(e: any) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) { }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          border: 'none',
                          zIndex: 99,
                        }}
                      />
                    </View>
                  ) : (
                    <View style={[styles.masterInputContainer, { maxWidth: 250 }]}>
                      <TextInput
                        style={styles.masterTextInput}
                        value={newSheetStartDate}
                        onChangeText={setNewSheetStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.dark.textMuted}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Week End Date (YYYY-MM-DD)</Text>
                  {Platform.OS === 'web' ? (
                    <View style={[styles.dateInputContainer, { maxWidth: 250 }]}>
                      <Calendar color={colors.dark.textSecondary} size={16} style={{ marginRight: 8 }} />
                      <Text style={styles.dropdownSelectedText}>{newSheetEndDate}</Text>
                      <ChevronDown color={colors.dark.textSecondary} size={16} style={{ marginLeft: 'auto' }} />
                      <input
                        type="date"
                        value={newSheetEndDate}
                        onChange={(e) => setNewSheetEndDate(e.target.value)}
                        onClick={(e: any) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch (err) { }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          border: 'none',
                          zIndex: 99,
                        }}
                      />
                    </View>
                  ) : (
                    <View style={[styles.masterInputContainer, { maxWidth: 250 }]}>
                      <TextInput
                        style={styles.masterTextInput}
                        value={newSheetEndDate}
                        onChangeText={setNewSheetEndDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.dark.textMuted}
                      />
                    </View>
                  )}
                </View>
              </ScrollView>

              <Pressable
                style={[
                  styles.submitButtonLifting,
                  (!newSheetTitle || !newSheetStartDate || !newSheetEndDate) && styles.submitButtonDisabled
                ]}
                onPress={() => saveSheetMutation.mutate()}
                disabled={saveSheetMutation.isPending || !newSheetTitle || !newSheetStartDate || !newSheetEndDate}
              >
                <Text style={styles.submitButtonText}>
                  {saveSheetMutation.isPending ? 'Creating...' : 'Create Sheet'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* ⚙️ Master Settings Modal */}
        <Modal
          visible={isMasterSettingsVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsMasterSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Manage Master Settings</Text>
                <Pressable style={styles.closeSheetBtn} onPress={() => setIsMasterSettingsVisible(false)}>
                  <X color={colors.dark.textSecondary} size={20} />
                </Pressable>
              </View>

              <ScrollView style={{ marginBottom: 20 }}>
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Tea Charges per day (₹)</Text>
                  <View style={styles.masterInputContainer}>
                    <TextInput
                      style={styles.masterTextInput}
                      value={editingMaster.TeaExpense}
                      onChangeText={(val) => setEditingMaster({ ...editingMaster, TeaExpense: val })}
                      placeholder="e.g. 20"
                      placeholderTextColor={colors.dark.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Bus Charges per day (₹)</Text>
                  <View style={styles.masterInputContainer}>
                    <TextInput
                      style={styles.masterTextInput}
                      value={editingMaster.BusExpense}
                      onChangeText={(val) => setEditingMaster({ ...editingMaster, BusExpense: val })}
                      placeholder="e.g. 50"
                      placeholderTextColor={colors.dark.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </ScrollView>

              <Pressable
                style={[
                  styles.submitButtonLifting,
                  saveMasterSettingsMutation.isPending && styles.submitButtonDisabled
                ]}
                onPress={() => saveMasterSettingsMutation.mutate()}
                disabled={saveMasterSettingsMutation.isPending}
              >
                <Text style={styles.submitButtonText}>
                  {saveMasterSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* 🧱 Lifting Rates Modal */}
        <Modal
          visible={isLiftingRatesVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsLiftingRatesVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.bottomSheet}>
              <View style={styles.bottomSheetHeader}>
                <Text style={styles.bottomSheetTitle}>Manage Lifting Rates (₹)</Text>
                <Pressable style={styles.closeSheetBtn} onPress={() => setIsLiftingRatesVisible(false)}>
                  <X color={colors.dark.textSecondary} size={20} />
                </Pressable>
              </View>

              {/* Material Tabs Selector */}
              <View style={styles.materialTabsContainer}>
                {(['M.Sand', 'Jally', 'Sengal'] as const).map((mat) => (
                  <Pressable
                    key={mat}
                    style={[
                      styles.materialTabButton,
                      selectedLiftingMaterial === mat && styles.materialTabButtonActive
                    ]}
                    onPress={() => setSelectedLiftingMaterial(mat)}
                  >
                    <Text
                      style={[
                        styles.materialTabButtonText,
                        selectedLiftingMaterial === mat && styles.materialTabButtonTextActive
                      ]}
                    >
                      {mat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <ScrollView style={{ marginBottom: 20 }}>
                {/* Rows for each floor for the selected material */}
                {['G.Floor', '1st floor', '2nd floor', '3rd floor'].map((floor) => {
                  const key = `${selectedLiftingMaterial}_${floor}`;
                  const val = editingLiftingRates[key] || '0';
                  return (
                    <View key={floor} style={styles.liftingRateRow}>
                      <Text style={styles.liftingFloorLabel}>{floor}</Text>
                      <View style={styles.liftingInputWrapper}>
                        <Text style={styles.currencyPrefix}>₹</Text>
                        <TextInput
                          style={styles.liftingTextInput}
                          value={val}
                          onChangeText={(text) => {
                            setEditingLiftingRates({
                              ...editingLiftingRates,
                              [key]: text
                            });
                          }}
                          keyboardType="numeric"
                          placeholder="0"
                          placeholderTextColor={colors.dark.textMuted}
                        />
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <Pressable
                style={[
                  styles.submitButtonLifting,
                  saveLiftingRatesMutation.isPending && styles.submitButtonDisabled
                ]}
                onPress={() => saveLiftingRatesMutation.mutate()}
                disabled={saveLiftingRatesMutation.isPending}
              >
                <Text style={styles.submitButtonText}>
                  {saveLiftingRatesMutation.isPending ? 'Saving...' : 'Save Rates'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  liftingRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border + '33',
  },
  liftingFloorLabel: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  liftingInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    width: 140,
    height: 40,
  },
  currencyPrefix: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    marginRight: 4,
    fontWeight: '600',
  },
  liftingTextInput: {
    flex: 1,
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  materialTabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.dark.bgInput,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  materialTabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  materialTabButtonActive: {
    backgroundColor: colors.dark.accent,
  },
  materialTabButtonText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  materialTabButtonTextActive: {
    color: '#0F0F1A',
    fontWeight: '700',
  },
  masterInputContainer: {
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    width: '100%',
    maxWidth: 160,
    justifyContent: 'center',
  },
  masterTextInput: {
    color: colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    padding: 0,
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
    position: 'relative',
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
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  chipsScrollRow: {
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 6,
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
    minWidth: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    width: '100%',
  },
  rowStepperButton: {
    width: 28,
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
  topTabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  topTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderRadius: 8,
  },
  topTabButtonActive: {
    backgroundColor: colors.dark.accent,
  },
  topTabButtonActiveMisc: {
    backgroundColor: '#00BCD4',
  },
  topTabButtonActiveLifting: {
    backgroundColor: '#bd1ee9ff',
  },
  topTabButtonText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  topTabButtonTextActive: {
    color: '#0F0F1A',
  },
  topTabButtonTextActiveMisc: {
    color: '#0F0F1A',
  },
  topTabButtonTextActiveLifting: {
    color: '#0F0F1A',
  },
  profitCard: {
    backgroundColor: 'rgba(76,175,80,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.2)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  profitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  profitHeaderTitle: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profitDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profitDetailLabel: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  profitDetailValue: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  calcFormulaText: {
    color: '#4CAF50',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
  },
  calcFormulaTextLifting: {
    color: '#F48FB1',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
  },
  saveProfitBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveProfitBtnText: {
    color: '#0F0F1A',
    fontSize: 12,
    fontWeight: '700',
  },
  removeProfitBtn: {
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
    backgroundColor: 'rgba(244,67,54,0.06)',
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeProfitBtnText: {
    color: '#FF5252',
    fontSize: 12,
    fontWeight: '700',
  },
  allowanceCard: {
    backgroundColor: 'rgba(255,152,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  allowanceTitle: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  allowanceBtn: {
    flex: 1,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allowanceBtnText: {
    color: '#0F0F1A',
    fontSize: 11,
    fontWeight: '700',
  },
  submitButtonMisc: {
    backgroundColor: '#00BCD4',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitButtonLifting: {
    backgroundColor: '#bd1ee9ff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  formChipActiveLifting: {
    backgroundColor: '#bd1ee9ff',
    borderColor: '#bd1ee9ff',
  },
  formChipTextActiveLifting: {
    color: '#FFFFFF',
  },
  combinedTotalBanner: {
    backgroundColor: 'rgba(255, 179, 0, 0.08)',
    borderWidth: 1,
    borderColor: colors.dark.accent,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  combinedTotalLabel: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  combinedTotalValue: {
    color: colors.dark.accent,
    fontSize: 20,
    fontWeight: '800',
  },
});
