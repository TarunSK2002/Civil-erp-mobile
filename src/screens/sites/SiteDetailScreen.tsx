import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ArrowLeft, MapPin, Ruler, Compass, Plus, Trash2, Calendar, FileText } from 'lucide-react-native';

interface Section {
  id: number;
  Name: string;
  Length: string;
  Breadth: string;
  Area: number;
  SectionValue: number;
  RatePerSqFt: number;
}

interface Project {
  id: number;
  ProjectName: string;
  WorkType: string;
  StartDate: string;
  EndDate: string;
  Status: string;
  QuotedValue: number;
  Notes: string;
}

export default function SiteDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<'summary' | 'sections' | 'projects'>('summary');

  // React Query Fetch Site Details
  const { data: site, isLoading } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: async () => {
      const response = await api.get(`/sites/${id}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={colors.dark.textPrimary} size={20} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{site?.SiteName}</Text>
          <Text style={styles.headerSubtitle}>{site?.Client?.Name || 'No Client'}</Text>
        </View>
        <Text style={styles.statusBadge}>{site?.Status}</Text>
      </View>

      {/* Tabs Selector Navigation */}
      <View style={styles.tabBar}>
        {['summary', 'sections', 'projects'].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Render Tab Contents */}
      <ScrollView style={styles.content}>
        {activeTab === 'summary' && (
          <View>
            {/* Financial Details Info */}
            <View style={styles.financialCard}>
              <Text style={styles.cardTitle}>Site Valuation</Text>
              <Text style={styles.valuationAmount}>₹{site?.SiteValue?.toLocaleString('en-IN')}</Text>
              
              <View style={styles.divider} />
              
              <View style={styles.specGrid}>
                <View style={styles.specCol}>
                  <Text style={styles.specLabel}>Dimensions</Text>
                  <Text style={styles.specValue}>{site?.Length} × {site?.Breadth} ft</Text>
                </View>
                <View style={styles.specCol}>
                  <Text style={styles.specLabel}>Facing Direction</Text>
                  <Text style={styles.specValue}>{site?.Facing || '—'}</Text>
                </View>
              </View>
            </View>

            {/* Site statistics highlights */}
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            {site?.RecentPayments && site.RecentPayments.length > 0 ? (
              site.RecentPayments.map((pm: any) => (
                <View key={pm.id} style={styles.paymentRow}>
                  <View>
                    <Text style={styles.paymentCategory}>{pm.Category}</Text>
                    <Text style={styles.paymentDate}>{new Date(pm.PaymentDate).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <Text style={styles.paymentAmount}>- ₹{pm.Amount.toLocaleString('en-IN')}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No recent transactions</Text>
            )}
          </View>
        )}

        {activeTab === 'sections' && (
          <View>
            <Text style={styles.sectionTitle}>Floors / Sections ({site?.Sections?.length || 0})</Text>
            {site?.Sections && site.Sections.length > 0 ? (
              site.Sections.map((sec: Section) => (
                <View key={sec.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{sec.Name}</Text>
                    <Text style={styles.itemValue}>₹{sec.SectionValue.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.itemDetail}>Size: {sec.Length} × {sec.Breadth} ft ({sec.Area} SqFt)</Text>
                  <Text style={styles.itemDetail}>Rate: ₹{sec.RatePerSqFt} / SqFt</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No floors defined for this site</Text>
            )}
          </View>
        )}

        {activeTab === 'projects' && (
          <View>
            <Text style={styles.sectionTitle}>Project Categories ({site?.Projects?.length || 0})</Text>
            {site?.Projects && site.Projects.length > 0 ? (
              site.Projects.map((proj: Project) => (
                <View key={proj.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{proj.ProjectName}</Text>
                    <Text style={styles.itemValue}>₹{proj.QuotedValue.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.itemDetail}>Work Type: {proj.WorkType}</Text>
                  {proj.Notes ? <Text style={styles.itemNotes}>Notes: {proj.Notes}</Text> : null}
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No projects scheduled</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.dark.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    color: colors.dark.accent,
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.dark.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.dark.accent,
  },
  tabText: {
    color: colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.dark.accent,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  financialCard: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  cardTitle: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  valuationAmount: {
    color: colors.dark.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.dark.border,
    marginVertical: 16,
  },
  specGrid: {
    flexDirection: 'row',
  },
  specCol: {
    flex: 1,
  },
  specLabel: {
    color: colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  specValue: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  paymentRow: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentCategory: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  paymentDate: {
    color: colors.dark.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  paymentAmount: {
    color: colors.dark.error,
    fontSize: 14,
    fontWeight: '700',
  },
  noData: {
    color: colors.dark.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 12,
  },
  itemCard: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  itemValue: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  itemDetail: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  itemNotes: {
    color: colors.dark.textMuted,
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
