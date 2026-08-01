import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { colors } from '../theme/colors';
import {
  BarChart3,
  Home,
  Users,
  TrendingUp,
  DollarSign,
  Briefcase,
  ChevronRight,
  ShieldCheck
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [reportType, setReportType] = useState<'site' | 'labour'>('site');

  // Fetch Sites for Site Report List
  const { data: sites, isLoading: sitesLoading } = useQuery({
    queryKey: ['reports-sites-list'],
    queryFn: async () => {
      const res = await api.get('/sites');
      return res.data || [];
    },
  });

  // Fetch Labours for Labour Report List
  const { data: labours, isLoading: laboursLoading } = useQuery({
    queryKey: ['reports-labours-list'],
    queryFn: async () => {
      const res = await api.get('/labours');
      return res.data || [];
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Screen Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BarChart3 color={colors.dark.accent} size={24} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Financial & Site Reports</Text>
            <Text style={styles.headerSubtitle}>Drill-down financial metrics & payments</Text>
          </View>
        </View>
      </View>

      {/* Toggle Selector */}
      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, reportType === 'site' && styles.toggleBtnActive]}
          onPress={() => setReportType('site')}
        >
          <Home color={reportType === 'site' ? '#0F0F1A' : colors.dark.textSecondary} size={16} />
          <Text style={[styles.toggleText, reportType === 'site' && styles.toggleTextActive]}>
            Site Reports
          </Text>
        </Pressable>

        <Pressable
          style={[styles.toggleBtn, reportType === 'labour' && styles.toggleBtnActive]}
          onPress={() => setReportType('labour')}
        >
          <Users color={reportType === 'labour' ? '#0F0F1A' : colors.dark.textSecondary} size={16} />
          <Text style={[styles.toggleText, reportType === 'labour' && styles.toggleTextActive]}>
            Labour Reports
          </Text>
        </Pressable>
      </View>

      {/* Content Area */}
      {reportType === 'site' ? (
        sitesLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.dark.accent} />
          </View>
        ) : (
          <FlatList
            data={sites}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => (
              <Pressable
                style={styles.reportCard}
                onPress={() => navigation.navigate('SiteReportDetail', { siteId: item.id, siteName: item.SiteName })}
              >
                <View style={styles.cardIconBox}>
                  <Home color={colors.dark.accent} size={20} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardTitle}>{item.SiteName}</Text>
                  <Text style={styles.cardSubtitle}>
                    Budget: ₹{(item.SiteValue || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <ChevronRight color={colors.dark.textMuted} size={20} />
              </Pressable>
            )}
          />
        )
      ) : laboursLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={labours}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Pressable
              style={styles.reportCard}
              onPress={() => navigation.navigate('LabourReportDetail', { labourId: item.id, labourName: item.Name })}
            >
              <View style={[styles.cardIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                <Users color="#3b82f6" size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardTitle}>{item.Name}</Text>
                <Text style={styles.cardSubtitle}>
                  Role: {item.LabourType || 'Labour'} | Mobile: {item.MobileNo || 'N/A'}
                </Text>
              </View>
              <ChevronRight color={colors.dark.textMuted} size={20} />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
    backgroundColor: colors.dark.bgSecondary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.dark.bgSecondary,
    margin: 16,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: colors.dark.accent,
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark.textSecondary,
  },
  toggleTextActive: {
    color: '#0F0F1A',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
});
