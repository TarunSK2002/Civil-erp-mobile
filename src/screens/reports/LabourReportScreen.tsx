import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import {
  Users,
  Home,
  Calendar,
  CreditCard,
  Check,
  ChevronDown
} from 'lucide-react-native';

export default function LabourReportScreen({ route, navigation }: any) {
  const { labourId, labourName } = route.params || {};

  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('all');
  const [showSiteDropdown, setShowSiteDropdown] = useState(false);

  // Fetch Sites for Picker Filter
  const { data: sites } = useQuery({
    queryKey: ['sites-dropdown'],
    queryFn: async () => {
      const res = await api.get('/sites');
      return res.data || [];
    },
  });

  // Fetch Labour Report Data
  const { data: report, isLoading } = useQuery({
    queryKey: ['labour-report', labourId, selectedSiteFilter],
    queryFn: async () => {
      const res = await api.get(`/reports/labour/${labourId}?siteIds=${selectedSiteFilter}`);
      return res.data;
    },
    enabled: !!labourId,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </SafeAreaView>
    );
  }

  const activeSiteName = selectedSiteFilter === 'all' 
    ? 'All Sites' 
    : sites?.find((s: any) => s.id.toString() === selectedSiteFilter)?.SiteName || 'Selected Site';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header Info */}
        <View style={styles.headerBox}>
          <Text style={styles.title}>{labourName || report?.labour?.name || 'Labour Payment Report'}</Text>
          <Text style={styles.subtitle}>
            Role: {report?.labour?.type || 'Contractor/Labour'} | Mobile: {report?.labour?.mobile || 'N/A'}
          </Text>
        </View>

        {/* Site Filter Dropdown */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Filter by Construction Site</Text>
          <Pressable
            style={[styles.dropdownButton, showSiteDropdown && styles.dropdownButtonActive]}
            onPress={() => setShowSiteDropdown(!showSiteDropdown)}
          >
            <Text style={styles.dropdownText}>{activeSiteName}</Text>
            <ChevronDown color={colors.dark.textSecondary} size={16} />
          </Pressable>

          {showSiteDropdown && (
            <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
              <Pressable
                style={styles.dropdownOption}
                onPress={() => { setSelectedSiteFilter('all'); setShowSiteDropdown(false); }}
              >
                <Text style={styles.dropdownOptionText}>All Sites</Text>
                {selectedSiteFilter === 'all' && <Check color={colors.dark.accent} size={14} />}
              </Pressable>
              {sites?.map((s: any) => (
                <Pressable
                  key={s.id}
                  style={styles.dropdownOption}
                  onPress={() => { setSelectedSiteFilter(s.id.toString()); setShowSiteDropdown(false); }}
                >
                  <Text style={styles.dropdownOptionText}>{s.SiteName}</Text>
                  {selectedSiteFilter === s.id.toString() && <Check color={colors.dark.accent} size={14} />}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Summary Metric Cards */}
        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Amount Paid</Text>
            <Text style={styles.metricValue}>
              ₹{(report?.grandTotal || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Payment Count</Text>
            <Text style={[styles.metricValue, { color: colors.dark.accent }]}>
              {report?.totalPayments || 0} Transactions
            </Text>
          </View>
        </View>

        {/* Site Breakdown Summary */}
        <Text style={styles.sectionTitle}>Multi-Site Payment Summary</Text>
        {report?.siteBreakdown && report.siteBreakdown.length > 0 ? (
          report.siteBreakdown.map((sb: any, idx: number) => (
            <View key={idx} style={styles.breakdownCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.siteBreakdownTitle}>{sb.siteName}</Text>
                <Text style={styles.siteBreakdownSub}>{sb.paymentCount} payout transactions</Text>
              </View>
              <Text style={styles.siteBreakdownAmount}>₹{sb.totalPaid.toLocaleString('en-IN')}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No site breakdown data available.</Text>
        )}

        {/* Payment History List */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Payment History Log</Text>
        {report?.payments && report.payments.length > 0 ? (
          report.payments.map((p: any, idx: number) => (
            <View key={idx} style={styles.historyCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historySite}>{p.siteName}</Text>
                <Text style={styles.historyDate}>
                  {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {p.mode}
                </Text>
                {p.notes ? <Text style={styles.historyNotes}>Note: {p.notes}</Text> : null}
              </View>
              <Text style={styles.historyAmount}>₹{p.amount.toLocaleString('en-IN')}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No payment history records found.</Text>
        )}
      </ScrollView>
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
    backgroundColor: colors.dark.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBox: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
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
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    padding: 16,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark.textPrimary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.textPrimary,
    marginBottom: 10,
  },
  breakdownCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  siteBreakdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  siteBreakdownSub: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  siteBreakdownAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  historySite: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  historyDate: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  historyNotes: {
    fontSize: 11,
    color: colors.dark.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.accent,
  },
  emptyText: {
    fontSize: 13,
    color: colors.dark.textMuted,
    fontStyle: 'italic',
    marginBottom: 10,
  },
});
