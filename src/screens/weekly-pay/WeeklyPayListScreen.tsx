import React, { useState } from 'react';
import {
  StyleSheet, View, Text, Pressable, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { ChevronRight, FileText, RefreshCw, Calendar, IndianRupee } from 'lucide-react-native';

interface WeeklyPay {
  id: number;
  Title: string;
  WeekStartDate: string;
  WeekEndDate: string;
  TotalAmount?: number;
  Status?: string; // 'Draft' | 'Paid'
  SiteName?: string;
}

export default function WeeklyPayListScreen() {
  const navigation = useNavigation<any>();

  const { data: sheets, isLoading, isFetching, refetch } = useQuery<WeeklyPay[]>({
    queryKey: ['weekly-pay-sheets'],
    queryFn: async () => {
      const response = await api.get('/attendance-sheets');
      return response.data;
    },
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const statusColor = (status?: string) => {
    if (status === 'Paid') return colors.dark.success;
    if (status === 'Partial') return colors.dark.warning;
    return colors.dark.info;
  };

  return (
    <View style={styles.container}>
      {/* Header Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{sheets?.length ?? '—'}</Text>
          <Text style={styles.summaryLabel}>Total Sheets</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {sheets?.filter(s => s.Status === 'Paid').length ?? '—'}
          </Text>
          <Text style={styles.summaryLabel}>Paid</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {sheets?.filter(s => s.Status !== 'Paid').length ?? '—'}
          </Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={sheets}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText color={colors.dark.textMuted} size={48} />
              <Text style={styles.emptyText}>No pay sheets found</Text>
              <Text style={styles.emptySubText}>Create attendance sheets to generate pay sheets</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('WeeklyPayDetail', { sheet: item })}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardTitleRow}>
                  <FileText color={colors.dark.accent} size={18} />
                  <Text style={styles.cardTitle}>{item.Title}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.Status) + '22', borderColor: statusColor(item.Status) + '66' }]}>
                  <Text style={[styles.statusText, { color: statusColor(item.Status) }]}>{item.Status || 'Draft'}</Text>
                </View>
              </View>

              {item.SiteName && (
                <Text style={styles.siteText}>{item.SiteName}</Text>
              )}

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Calendar color={colors.dark.textMuted} size={13} />
                  <Text style={styles.metaText}>{formatDate(item.WeekStartDate)} – {formatDate(item.WeekEndDate)}</Text>
                </View>
                {item.TotalAmount !== undefined && (
                  <View style={styles.metaItem}>
                    <IndianRupee color={colors.dark.accent} size={13} />
                    <Text style={styles.amountText}>
                      {item.TotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </Text>
                  </View>
                )}
              </View>

              <ChevronRight color={colors.dark.textMuted} size={18} style={styles.chevron} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryBar: {
    flexDirection: 'row', backgroundColor: colors.dark.bgCard,
    marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.dark.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.dark.accent, fontSize: 22, fontWeight: '700' },
  summaryLabel: { color: colors.dark.textMuted, fontSize: 11, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.dark.border, marginHorizontal: 8 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { color: colors.dark.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubText: { color: colors.dark.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: colors.dark.bgCard, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.dark.border,
  },
  cardPressed: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { color: colors.dark.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  siteText: { color: colors.dark.textMuted, fontSize: 12, marginBottom: 8, marginLeft: 26 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.dark.textMuted, fontSize: 12 },
  amountText: { color: colors.dark.accent, fontSize: 14, fontWeight: '700' },
  chevron: { position: 'absolute', right: 14, top: '50%' },
});
