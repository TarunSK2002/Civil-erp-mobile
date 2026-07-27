import React, { useState } from 'react';
import {
  StyleSheet, View, Text, Pressable, FlatList, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import {
  ChevronDown, ChevronUp, IndianRupee, User, Calendar, CheckCircle2,
  Clock, FileText, CreditCard,
} from 'lucide-react-native';

interface PayeeBreakdown {
  payeeId: number;
  payeeName: string;
  personType?: string;
  days: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  details?: { date: string; hours?: number; sqft?: number; amount: number }[];
}

interface PaySheetDetail {
  id: number;
  SheetTitle: string;
  WeekStartDate: string;
  WeekEndDate: string;
  TotalAmount: number;
  PaidAmount: number;
  Status: string;
  SiteName?: string;
  payees: PayeeBreakdown[];
}

export default function WeeklyPayDetailScreen() {
  const route = useRoute<any>();
  const { sheet } = route.params;
  const queryClient = useQueryClient();
  const [expandedPayeeId, setExpandedPayeeId] = useState<number | null>(null);

  const { data: detail, isLoading, refetch, isFetching } = useQuery<PaySheetDetail>({
    queryKey: ['weekly-pay-detail', sheet.id],
    queryFn: async () => {
      const response = await api.get(`/attendance-sheets/${sheet.id}`);
      return response.data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async (payeeId: number) => {
      return api.post(`/attendance-sheets/${sheet.id}/pay`, { payeeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-pay-detail', sheet.id] });
      queryClient.invalidateQueries({ queryKey: ['weekly-pay-sheets'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Payment failed');
    },
  });

  const handlePay = (payee: PayeeBreakdown) => {
    Alert.alert(
      'Confirm Payment',
      `Pay ₹${payee.pendingAmount.toLocaleString('en-IN')} to ${payee.payeeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => payMutation.mutate(payee.payeeId) },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const typeColor = (type?: string) => {
    const map: Record<string, string> = {
      Mason: '#F59E0B', Helper: '#6B7280', Carpenter: '#8B5CF6',
      Painter: '#EC4899', Plumber: '#3B82F6', Electrician: '#EF4444',
      Supervisor: '#10B981',
    };
    return map[type || ''] || colors.dark.accent;
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </View>
    );
  }

  const title = detail?.Title || detail?.SheetTitle || sheet?.Title || sheet?.SheetTitle || 'Weekly Pay Sheet';
  const startDate = detail?.WeekStartDate || sheet?.WeekStartDate;
  const endDate = detail?.WeekEndDate || sheet?.WeekEndDate;
  const totalAmt = detail?.TotalAmount ?? sheet?.TotalAmount ?? 0;
  const payeesList = detail?.payees || detail?.payeeBreakdown || [];
  const pendingTotal = payeesList.reduce((sum: number, p: any) => sum + (p.pendingAmount || 0), 0);
  const paidTotal = payeesList.reduce((sum: number, p: any) => sum + (p.paidAmount || 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <FileText color={colors.dark.accent} size={20} />
          <Text style={styles.summaryTitle}>{title}</Text>
        </View>
        {(detail?.SiteName || sheet?.SiteName) && (
          <Text style={styles.siteText}>{detail?.SiteName || sheet?.SiteName}</Text>
        )}
        <View style={styles.dateRow}>
          <Calendar color={colors.dark.textMuted} size={13} />
          <Text style={styles.dateText}>
            {formatDate(startDate)} – {formatDate(endDate)}
          </Text>
        </View>

        <View style={styles.amountGrid}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>₹{totalAmt.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.amountValue, { color: colors.dark.success }]}>₹{paidTotal.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Pending</Text>
            <Text style={[styles.amountValue, { color: colors.dark.error }]}>₹{pendingTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </View>

      {/* Payee List */}
      <Text style={styles.sectionTitle}>Payee Breakdown</Text>
      {payeesList.map((payee: any) => {
        const isExpanded = expandedPayeeId === payee.payeeId;
        const isPaid = (payee.pendingAmount || 0) === 0;

        return (
          <View key={payee.payeeId} style={styles.payeeCard}>
            <Pressable
              style={styles.payeeHeader}
              onPress={() => setExpandedPayeeId(isExpanded ? null : payee.payeeId)}
            >
              <View style={styles.payeeLeft}>
                <View style={[styles.payeeAvatar, { backgroundColor: typeColor(payee.personType) + '22' }]}>
                  <User color={typeColor(payee.personType)} size={18} />
                </View>
                <View>
                  <Text style={styles.payeeName}>{payee.payeeName}</Text>
                  <Text style={styles.payeeDays}>{payee.days} day{payee.days !== 1 ? 's' : ''} · {payee.personType || 'Labour'}</Text>
                </View>
              </View>
              <View style={styles.payeeRight}>
                <Text style={[styles.payeeAmount, isPaid && { color: colors.dark.success }]}>
                  ₹{payee.totalAmount.toLocaleString('en-IN')}
                </Text>
                {isPaid ? (
                  <CheckCircle2 color={colors.dark.success} size={16} />
                ) : (
                  isExpanded ? <ChevronUp color={colors.dark.textMuted} size={16} /> : <ChevronDown color={colors.dark.textMuted} size={16} />
                )}
              </View>
            </Pressable>

            {isExpanded && (
              <View style={styles.breakdown}>
                {/* Payment status bar */}
                <View style={styles.payStatusRow}>
                  <View style={styles.payStatusItem}>
                    <Text style={styles.payStatusLabel}>Paid</Text>
                    <Text style={[styles.payStatusValue, { color: colors.dark.success }]}>₹{payee.paidAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.payStatusItem}>
                    <Text style={styles.payStatusLabel}>Pending</Text>
                    <Text style={[styles.payStatusValue, { color: colors.dark.error }]}>₹{payee.pendingAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Day-by-day breakdown */}
                {payee.details?.map((d, idx) => (
                  <View key={idx} style={styles.dayRow}>
                    <Clock color={colors.dark.textMuted} size={12} />
                    <Text style={styles.dayDate}>{formatDate(d.date)}</Text>
                    {d.hours !== undefined && <Text style={styles.dayDetail}>{d.hours}h</Text>}
                    {d.sqft !== undefined && <Text style={styles.dayDetail}>{d.sqft} sqft</Text>}
                    <Text style={styles.dayAmount}>₹{d.amount}</Text>
                  </View>
                ))}

                {!isPaid && (
                  <Pressable
                    style={[styles.payBtn, payMutation.isPending && styles.payBtnDisabled]}
                    onPress={() => handlePay(payee)}
                    disabled={payMutation.isPending}
                  >
                    <CreditCard color="#0F0F1A" size={16} />
                    <Text style={styles.payBtnText}>Pay ₹{payee.pendingAmount.toLocaleString('en-IN')}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        );
      })}

      {(!payeesList || payeesList.length === 0) && (
        <View style={styles.emptyPayees}>
          <Text style={styles.emptyText}>No payee data available for this sheet</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark.bgPrimary },
  summaryCard: {
    backgroundColor: colors.dark.bgCard, margin: 16, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: colors.dark.border,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  summaryTitle: { color: colors.dark.textPrimary, fontSize: 16, fontWeight: '700', flex: 1 },
  siteText: { color: colors.dark.textMuted, fontSize: 12, marginBottom: 4, marginLeft: 28 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  dateText: { color: colors.dark.textMuted, fontSize: 13 },
  amountGrid: {
    flexDirection: 'row', backgroundColor: colors.dark.bgInput,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.dark.border,
  },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { color: colors.dark.textMuted, fontSize: 11, marginBottom: 4 },
  amountValue: { color: colors.dark.textPrimary, fontSize: 16, fontWeight: '700' },
  amountDivider: { width: 1, backgroundColor: colors.dark.border, marginHorizontal: 8 },
  sectionTitle: { color: colors.dark.textSecondary, fontSize: 12, fontWeight: '700', marginHorizontal: 16, marginBottom: 8, letterSpacing: 0.5 },
  payeeCard: {
    backgroundColor: colors.dark.bgCard, marginHorizontal: 16, marginBottom: 8,
    borderRadius: 14, borderWidth: 1, borderColor: colors.dark.border, overflow: 'hidden',
  },
  payeeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  payeeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  payeeAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  payeeName: { color: colors.dark.textPrimary, fontSize: 14, fontWeight: '600' },
  payeeDays: { color: colors.dark.textMuted, fontSize: 12, marginTop: 2 },
  payeeRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payeeAmount: { color: colors.dark.accent, fontSize: 15, fontWeight: '700' },
  breakdown: { borderTopWidth: 1, borderTopColor: colors.dark.border, padding: 14 },
  payStatusRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  payStatusItem: { gap: 2 },
  payStatusLabel: { color: colors.dark.textMuted, fontSize: 11 },
  payStatusValue: { fontSize: 14, fontWeight: '700' },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.dark.border + '44',
  },
  dayDate: { color: colors.dark.textSecondary, fontSize: 12, flex: 1 },
  dayDetail: { color: colors.dark.textMuted, fontSize: 12 },
  dayAmount: { color: colors.dark.textPrimary, fontSize: 13, fontWeight: '600' },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.dark.accent, borderRadius: 10, paddingVertical: 11, marginTop: 12,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#0F0F1A', fontSize: 14, fontWeight: '700' },
  emptyPayees: { alignItems: 'center', padding: 32 },
  emptyText: { color: colors.dark.textMuted, fontSize: 14, textAlign: 'center' },
});
