import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
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
  Package,
  FileSpreadsheet
} from 'lucide-react-native';

export default function DashboardScreen() {
  const { user } = useAuth();
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
        <Pressable style={styles.actionItem}>
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
            <ClipboardList color="#f43f5e" size={24} />
          </View>
          <Text style={styles.actionLabel}>Attendance</Text>
        </Pressable>

        <Pressable style={styles.actionItem}>
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
            <FileSpreadsheet color="#8b5cf6" size={24} />
          </View>
          <Text style={styles.actionLabel}>Pay Sheets</Text>
        </Pressable>

        <Pressable style={styles.actionItem}>
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <CreditCard color="#10b981" size={24} />
          </View>
          <Text style={styles.actionLabel}>Payments</Text>
        </Pressable>
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
    marginBottom: 28,
  },
  statsScrollContent: {
    paddingHorizontal: 14,
  },
  sectionTitle: {
    color: colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  actionItem: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    width: '30%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 16,
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
    fontWeight: '500',
  },
  progressCount: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBg: {
    width: '100%',
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
