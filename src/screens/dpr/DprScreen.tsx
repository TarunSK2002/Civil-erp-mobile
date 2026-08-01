import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import {
  FileText,
  Plus,
  Calendar,
  Users,
  Sun,
  AlertTriangle,
  X,
  ChevronDown,
  Check
} from 'lucide-react-native';

interface DPR {
  id: number;
  SiteId: number;
  ReportDate: string;
  WorkDone: string;
  LabourCount: number;
  Issues?: string;
  WeatherCondition?: string;
  CreatedBy?: string;
  Site?: {
    SiteName: string;
  };
}

export default function DprScreen() {
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // DPR Form State
  const [formSiteId, setFormSiteId] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [workDone, setWorkDone] = useState<string>('');
  const [labourCount, setLabourCount] = useState<string>('0');
  const [issues, setIssues] = useState<string>('');
  const [weatherCondition, setWeatherCondition] = useState<string>('Sunny');

  // Fetch Sites for Picker Filter
  const { data: sites } = useQuery({
    queryKey: ['sites-dropdown'],
    queryFn: async () => {
      const res = await api.get('/sites');
      return res.data || [];
    },
  });

  // Fetch DPRs
  const { data: dprs, isLoading } = useQuery<DPR[]>({
    queryKey: ['dprs', selectedSiteId],
    queryFn: async () => {
      if (selectedSiteId === 'all') {
        // Fetch for first site if available or all
        const firstSite = sites && sites.length > 0 ? sites[0].id : null;
        if (!firstSite) return [];
        const res = await api.get(`/dpr/site/${firstSite}`);
        return res.data || [];
      }
      const res = await api.get(`/dpr/site/${selectedSiteId}`);
      return res.data || [];
    },
    enabled: !!sites,
  });

  // Create DPR Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!formSiteId || !workDone.trim()) {
        throw new Error('Please select a site and enter work done summary');
      }
      return api.post('/dpr', {
        SiteId: parseInt(formSiteId),
        ReportDate: reportDate,
        WorkDone: workDone.trim(),
        LabourCount: parseInt(labourCount) || 0,
        Issues: issues.trim(),
        WeatherCondition: weatherCondition,
        CreatedBy: 'Admin Mobile',
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Daily Progress Report saved');
      queryClient.invalidateQueries({ queryKey: ['dprs'] });
      closeModal();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || err.message || 'Failed to save DPR');
    },
  });

  // Delete DPR Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/dpr/${id}`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'DPR entry removed');
      queryClient.invalidateQueries({ queryKey: ['dprs'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to remove DPR');
    },
  });

  const closeModal = () => {
    setModalVisible(false);
    setWorkDone('');
    setLabourCount('0');
    setIssues('');
  };

  const handleOpenForm = () => {
    if (sites && sites.length > 0) {
      setFormSiteId(sites[0].id.toString());
    }
    setModalVisible(true);
  };

  const activeSiteName = selectedSiteId === 'all'
    ? (sites && sites.length > 0 ? sites[0].SiteName : 'Select Site')
    : sites?.find((s: any) => s.id.toString() === selectedSiteId)?.SiteName || 'Select Site';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <FileText color={colors.dark.accent} size={24} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Daily Progress Reports (DPR)</Text>
          <Text style={styles.headerSubtitle}>Log site progress, manpower & site issues</Text>
        </View>
      </View>

      {/* Site Filter Picker */}
      <View style={styles.filterBox}>
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setShowSiteDropdown(!showSiteDropdown)}
        >
          <Text style={styles.dropdownText}>{activeSiteName}</Text>
          <ChevronDown color={colors.dark.textSecondary} size={16} />
        </Pressable>

        {showSiteDropdown && (
          <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
            {sites?.map((s: any) => (
              <Pressable
                key={s.id}
                style={styles.dropdownOption}
                onPress={() => {
                  setSelectedSiteId(s.id.toString());
                  setShowSiteDropdown(false);
                }}
              >
                <Text style={styles.dropdownOptionText}>{s.SiteName}</Text>
                {selectedSiteId === s.id.toString() && <Check color={colors.dark.accent} size={14} />}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* DPR List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={dprs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Daily Progress Reports logged for this site</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.dprCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardDate}>
                  {new Date(item.ReportDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <View style={styles.weatherBadge}>
                  <Sun color={colors.dark.accent} size={12} style={{ marginRight: 4 }} />
                  <Text style={styles.weatherText}>{item.WeatherCondition || 'Sunny'}</Text>
                </View>
              </View>

              <Text style={styles.workDoneText}>{item.WorkDone}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Users color={colors.dark.textSecondary} size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.metaText}>{item.LabourCount} Workers Present</Text>
                </View>
                {item.Issues ? (
                  <View style={styles.issueItem}>
                    <AlertTriangle color="#f43f5e" size={14} style={{ marginRight: 4 }} />
                    <Text style={styles.issueText}>Issue Flagged</Text>
                  </View>
                ) : null}
              </View>

              {item.Issues ? (
                <View style={styles.issueBox}>
                  <Text style={styles.issueBoxText}>Issue: {item.Issues}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={handleOpenForm}>
        <Plus color="#0F0F1A" size={24} />
      </Pressable>

      {/* New DPR Modal */}
      {modalVisible && (
        <View style={styles.overlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Daily Progress Report</Text>
              <Pressable onPress={closeModal}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Construction Site</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
                {sites?.map((s: any) => (
                  <Pressable
                    key={s.id}
                    style={[
                      styles.chipBtn,
                      formSiteId === s.id.toString() && styles.chipBtnActive,
                    ]}
                    onPress={() => setFormSiteId(s.id.toString())}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formSiteId === s.id.toString() && styles.chipTextActive,
                      ]}
                    >
                      {s.SiteName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Report Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={reportDate}
                onChangeText={setReportDate}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Work Done Summary *</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                value={workDone}
                onChangeText={setWorkDone}
                multiline
                placeholder="e.g. 2nd Floor Roof Slab Concrete Pouring Completed"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Labour / Worker Count</Text>
              <TextInput
                style={styles.input}
                value={labourCount}
                onChangeText={setLabourCount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Site Issues / Delays (Optional)</Text>
              <TextInput
                style={styles.input}
                value={issues}
                onChangeText={setIssues}
                placeholder="e.g. Rain delayed cement delivery by 2 hours"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#0F0F1A" />
              ) : (
                <Text style={styles.saveButtonText}>Submit Daily Progress Report</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.dark.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  filterBox: {
    padding: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownText: {
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
    maxHeight: 180,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  dprCard: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  weatherText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.dark.accent,
  },
  workDoneText: {
    fontSize: 14,
    color: colors.dark.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  issueText: {
    fontSize: 12,
    color: '#f43f5e',
    fontWeight: '600',
  },
  issueBox: {
    marginTop: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 8,
    padding: 10,
  },
  issueBoxText: {
    fontSize: 12,
    color: '#f43f5e',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.dark.textMuted,
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.dark.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.dark.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    padding: 12,
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
  chipBtn: {
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  chipBtnActive: {
    backgroundColor: colors.dark.accent,
    borderColor: colors.dark.accent,
  },
  chipText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
  },
  chipTextActive: {
    color: '#0F0F1A',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.dark.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#0F0F1A',
    fontWeight: '700',
    fontSize: 15,
  },
});
