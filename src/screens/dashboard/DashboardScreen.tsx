import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../auth/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import StatCard from '../../components/ui/StatCard';
import api from '../../api/client';
import { 
  Users, 
  Home, 
  CreditCard, 
  AlertCircle, 
  Calendar, 
  ClipboardList,
  HardHat,
  FileSpreadsheet,
  Store,
  ShoppingBag,
  UserCheck,
  Clock,
  Wallet,
  Layers,
  BarChart3,
  Shield
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard');
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={['top', 'left', 'right']}>
        <AlertCircle color={colors.dark.error} size={48} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => { setLoading(true); fetchStats(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const moduleCards = [
    {
      title: 'Dealers',
      icon: Store,
      screen: 'DealerList',
      bgColor: 'rgba(255, 179, 0, 0.12)',
      iconColor: '#FFB300',
    },
    {
      title: 'Purchases',
      icon: ShoppingBag,
      screen: 'PurchaseList',
      bgColor: 'rgba(59, 130, 246, 0.12)',
      iconColor: '#3b82f6',
    },
    {
      title: 'Person Types',
      icon: UserCheck,
      screen: 'PersonType',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      iconColor: '#10b981',
    },
    {
      title: 'Shift Master',
      icon: Clock,
      screen: 'ShiftMaster',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      iconColor: '#8b5cf6',
    },
    {
      title: 'Material Types',
      icon: Layers,
      screen: 'MaterialTypeMaster',
      bgColor: 'rgba(6, 182, 212, 0.12)',
      iconColor: '#06b6d4',
    },
    {
      title: 'Reports',
      icon: BarChart3,
      screen: 'Reports',
      bgColor: 'rgba(99, 102, 241, 0.12)',
      iconColor: '#6366f1',
    },
    {
      title: 'Users',
      icon: Shield,
      screen: 'UserManagement',
      bgColor: 'rgba(244, 63, 94, 0.12)',
      iconColor: '#f43f5e',
    },
    {
      title: 'Petty Cash',
      icon: Wallet,
      screen: 'PettyCash',
      bgColor: 'rgba(236, 72, 153, 0.12)',
      iconColor: '#ec4899',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.dark.accent} />
        }
      >
        {/* Greetings Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.fullName || 'Admin'}</Text>
            <Text style={styles.subtitle}>Here is your summary for today</Text>
          </View>
          <View style={styles.dateBadge}>
            <Calendar size={14} color={colors.dark.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>
        </View>

        {/* Main Stats Scrollable Horizontal Grid */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statsScroll}
          contentContainerStyle={styles.statsScrollContent}
        >
          <StatCard
            title="Total Clients"
            value={stats?.totalClients || 0}
            icon={Users}
            color="#4f46e5"
          />
          <StatCard
            title="Active Sites"
            value={stats?.activeSites || 0}
            icon={Home}
            color="#16a34a"
          />
          <StatCard
            title="Today's Payments"
            value={`₹${(stats?.todayPayments || 0).toLocaleString('en-IN')}`}
            icon={CreditCard}
            color="#eab308"
          />
          <StatCard
            title="Pending Payments"
            value={`₹${(stats?.pendingPayments || 0).toLocaleString('en-IN')}`}
            icon={AlertCircle}
            color="#f43f5e"
          />
        </ScrollView>

        {/* Quick Operations — 1 Row 4 Column compact grid */}
        <Text style={styles.sectionTitle}>Quick Operations</Text>
        <View style={styles.gridRow}>
          <Pressable style={styles.gridCard} onPress={() => navigation.navigate('Labour', { screen: 'AttendanceSheet' })}>
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
              <ClipboardList color="#f43f5e" size={20} />
            </View>
            <Text style={styles.gridLabel} numberOfLines={1}>Attendance</Text>
          </Pressable>

          <Pressable style={styles.gridCard} onPress={() => navigation.navigate('Labour', { screen: 'LabourList' })}>
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
              <HardHat color="#3b82f6" size={20} />
            </View>
            <Text style={styles.gridLabel} numberOfLines={1}>Labour List</Text>
          </Pressable>

          <Pressable style={styles.gridCard} onPress={() => navigation.navigate('Labour', { screen: 'WeeklyPayList' })}>
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
              <FileSpreadsheet color="#8b5cf6" size={20} />
            </View>
            <Text style={styles.gridLabel} numberOfLines={1}>Pay Sheets</Text>
          </Pressable>

          <Pressable style={styles.gridCard} onPress={() => navigation.navigate('Finance', { screen: 'PaymentList' })}>
            <View style={[styles.gridIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <CreditCard color="#10b981" size={20} />
            </View>
            <Text style={styles.gridLabel} numberOfLines={1}>Payments</Text>
          </Pressable>
        </View>

        {/* Secondary & Master Modules — Square Grid Cards */}
        <Text style={styles.sectionTitle}>Secondary & Master Modules</Text>
        <View style={styles.gridRowWrap}>
          {moduleCards.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Pressable
                key={idx}
                style={styles.gridCardFour}
                onPress={() => navigation.navigate(item.screen)}
              >
                <View style={[styles.gridIconBox, { backgroundColor: item.bgColor }]}>
                  <IconComponent color={item.iconColor} size={20} />
                </View>
                <Text style={styles.gridLabel} numberOfLines={1}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Overview Site Detail progress summary */}
        <Text style={styles.sectionTitle}>Sites Progress</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Upcoming Projects</Text>
            <Text style={styles.progressCount}>{stats?.upcomingSites || 0}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${Math.min(100, ((stats?.upcomingSites || 0) / (stats?.totalClients || 1)) * 100)}%`, backgroundColor: '#FFB300' }]} />
          </View>

          <View style={[styles.progressRow, { marginTop: 16 }]}>
            <Text style={styles.progressLabel}>Completed Projects</Text>
            <Text style={styles.progressCount}>{stats?.completedSites || 0}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${Math.min(100, ((stats?.completedSites || 0) / (stats?.totalClients || 1)) * 100)}%`, backgroundColor: '#4CAF50' }]} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.dark.textSecondary,
    ...typography.body,
    marginTop: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.dark.accent,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#0F0F1A',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    color: colors.dark.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.dark.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dateText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statsScroll: {
    marginHorizontal: -16,
    marginBottom: 20,
  },
  statsScrollContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    color: colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 6,
  },
  /* 4-column compact grid styles */
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  gridCard: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardFour: {
    width: '23%',
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gridIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridLabel: {
    color: colors.dark.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  progressCard: {
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  progressCount: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.dark.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});
