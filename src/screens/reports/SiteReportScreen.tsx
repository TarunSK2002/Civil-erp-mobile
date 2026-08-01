import React from 'react';
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
  Home,
  TrendingUp,
  DollarSign,
  Briefcase,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  FileSpreadsheet
} from 'lucide-react-native';

export default function SiteReportScreen({ route, navigation }: any) {
  const { siteId, siteName } = route.params || {};

  // Fetch Site Summary Report
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['site-report-summary', siteId],
    queryFn: async () => {
      const res = await api.get(`/reports/site/${siteId}`);
      return res.data;
    },
    enabled: !!siteId,
  });

  // Fetch Labour Details Breakdown
  const { data: labourDetail } = useQuery({
    queryKey: ['site-report-labour', siteId],
    queryFn: async () => {
      const res = await api.get(`/reports/site/${siteId}/labour-detail`);
      return res.data;
    },
    enabled: !!siteId,
  });

  // Fetch Material Details Breakdown
  const { data: materialDetail } = useQuery({
    queryKey: ['site-report-material', siteId],
    queryFn: async () => {
      const res = await api.get(`/reports/site/${siteId}/material-detail`);
      return res.data;
    },
    enabled: !!siteId,
  });

  if (summaryLoading) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </SafeAreaView>
    );
  }

  const profit = summary?.profit || 0;
  const isProfitable = profit >= 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Header Information */}
        <View style={styles.headerBox}>
          <Text style={styles.siteTitle}>{siteName || 'Site Financial Summary'}</Text>
          <Text style={styles.siteSubtitle}>Comprehensive financial breakdown & profit analytics</Text>
        </View>

        {/* Financial KPI Cards Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Quoted Site Value</Text>
            <Text style={styles.kpiValue}>₹{(summary?.siteValue || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Collected Amount</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>
              ₹{(summary?.receivedAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Expenses</Text>
            <Text style={[styles.kpiValue, { color: '#f43f5e' }]}>
              ₹{(summary?.totalExpenses || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Estimated Profit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.kpiValue, { color: isProfitable ? '#10b981' : '#f43f5e' }]}>
                ₹{Math.abs(profit).toLocaleString('en-IN')}
              </Text>
              {isProfitable ? (
                <ArrowUpRight color="#10b981" size={18} style={{ marginLeft: 4 }} />
              ) : (
                <ArrowDownRight color="#f43f5e" size={18} style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>
        </View>

        {/* Expenses Breakdown Section */}
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.badgeIcon, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Briefcase color="#3b82f6" size={16} />
              </View>
              <Text style={styles.breakdownLabel}>Labour Payments</Text>
            </View>
            <Text style={styles.breakdownValue}>
              ₹{(summary?.labourExpense || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.breakdownRow, { borderBottomWidth: 0 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.badgeIcon, { backgroundColor: 'rgba(255, 179, 0, 0.12)' }]}>
                <ShoppingBag color="#FFB300" size={16} />
              </View>
              <Text style={styles.breakdownLabel}>Material Purchases</Text>
            </View>
            <Text style={styles.breakdownValue}>
              ₹{(summary?.materialExpense || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Labour Breakdown List */}
        <Text style={styles.sectionTitle}>Labour Wise Expense Detail</Text>
        {labourDetail?.labours && labourDetail.labours.length > 0 ? (
          labourDetail.labours.map((item: any, idx: number) => (
            <View key={idx} style={styles.detailRowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{item.name}</Text>
                <Text style={styles.detailSub}>{item.type} ({item.paymentCount} payments)</Text>
              </View>
              <Text style={styles.detailAmount}>₹{item.totalPaid.toLocaleString('en-IN')}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No labour payments logged for this site.</Text>
        )}

        {/* Material Breakdown List */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Material Wise Expense Detail</Text>
        {materialDetail?.materials && materialDetail.materials.length > 0 ? (
          materialDetail.materials.map((item: any, idx: number) => (
            <View key={idx} style={styles.detailRowCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{item.materialName}</Text>
                <Text style={styles.detailSub}>{item.purchaseCount} purchases</Text>
              </View>
              <Text style={styles.detailAmount}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No material purchases logged for this site.</Text>
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
    marginBottom: 20,
  },
  siteTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  siteSubtitle: {
    fontSize: 13,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    padding: 16,
  },
  kpiLabel: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark.textPrimary,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.textPrimary,
    marginTop: 14,
    marginBottom: 10,
  },
  breakdownCard: {
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.dark.textPrimary,
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  detailRowCard: {
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
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  detailSub: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  detailAmount: {
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
