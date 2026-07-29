import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
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
  ChevronRight,
  ClipboardList,
  HardHat,
  FileSpreadsheet,
  Store,
  ShoppingBag,
  UserCheck,
  Clock,
  Wallet
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle color={colors.dark.error} size={48} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => { setLoading(true); fetchStats(); }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const moduleCards = [
    {
      title: 'Material Dealers',
      subtitle: 'Supplier directory & contact details',
      icon: Store,
      screen: 'DealerList',
    },
    {
      title: 'Material Purchases',
      subtitle: 'Site purchase entries & SqFt billing',
      icon: ShoppingBag,
      screen: 'PurchaseList',
    },
    {
      title: 'Person Types (Wage Rates)',
      subtitle: 'Mason, Helper, Painter wage settings',
      icon: UserCheck,
      screen: 'PersonType',
    },
    {
      title: 'Shift Master',
      subtitle: 'Full day, half day wage multipliers',
      icon: Clock,
      screen: 'ShiftMaster',
    },
    {
      title: 'Petty Cash & Expenses',
      subtitle: 'Track office & site cash expenses',
      icon: Wallet,
      screen: 'PettyCash',
    },
  ];

  return (
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

      {/* Quick Action Operations Dashboard Sections */}
      <Text style={styles.sectionTitle}>Quick Operations</Text>
      <View style={styles.actionGrid}>
        <Pressable style={styles.actionItem} onPress={() => navigation.navigate('Labour', { screen: 'AttendanceSheet' })}>
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
            <ClipboardList color="#f43f5e" size={24} />
          </View>
          <Text style={styles.actionLabel}>Attendance</Text>
        </Pressable>

        <Pressable style={styles.actionItem} onPress={() => navigation.navigate('Labour', { screen: 'LabourList' })}>
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <HardHat color="#3b82f6" size={24} />
          </View>
          <Text style={styles.actionLabel}>Labour List</Text>
        </Pressable>

        <Pressable style={styles.actionItem} onPress={() => navigation.navigate('Labour', { screen: 'WeeklyPayList' })}>
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
            <FileSpreadsheet color="#8b5cf6" size={24} />
          </View>
          <Text style={styles.actionLabel}>Pay Sheets</Text>
        </Pressable>

        <Pressable style={styles.actionItem} onPress={() => navigation.navigate('Finance', { screen: 'PaymentList' })}>
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <CreditCard color="#10b981" size={24} />
          </View>
          <Text style={styles.actionLabel}>Payments</Text>
        </Pressable>
      </View>

      {/* Additional Modules Cards */}
      <Text style={styles.sectionTitle}>Secondary & Master Modules</Text>
      <View style={styles.moduleCardList}>
        {moduleCards.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <Pressable
              key={idx}
              style={styles.moduleCard}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.moduleIconBox}>
                <IconComponent color={colors.dark.accent} size={22} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.moduleTitle}>{item.title}</Text>
                <Text style={styles.moduleSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight color={colors.dark.textMuted} size={20} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  contentContainer: {
    padding: 20,
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
    justify.content: 'center',
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
    marginBottom: 24,
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
    marginHorizontal: -20,
    marginBottom: 24,
  },
  statsScrollContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionItem: {
    width: '48%',
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    color: colors.dark.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  moduleCardList: {
    marginBottom: 16,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgSecondary,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,179,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark.textPrimary,
  },
  moduleSubtitle: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 20,
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
