import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { MapPin, Navigation, CheckCircle, Clock } from 'lucide-react-native';

interface GpsLog {
  id: number;
  Username: string;
  SiteId?: number;
  Latitude: number;
  Longitude: number;
  Address?: string;
  CheckInTime: string;
  Site?: {
    SiteName: string;
  };
}

export default function GpsAttendanceScreen() {
  const queryClient = useQueryClient();
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch GPS Check-in Logs
  const { data: logs, isLoading } = useQuery<GpsLog[]>({
    queryKey: ['gps-logs'],
    queryFn: async () => {
      const res = await api.get('/gps');
      return res.data || [];
    },
  });

  // Check-in Mutation
  const checkInMutation = useMutation({
    mutationFn: async (coords: { lat: number; lng: number }) => {
      return api.post('/gps/checkin', {
        Username: 'Admin User',
        Latitude: coords.lat,
        Longitude: coords.lng,
        Address: `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}`,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'GPS Check-in recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['gps-logs'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to record GPS check-in');
    },
  });

  const handleCaptureLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for GPS attendance check-in');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCurrentLocation(coords);
      checkInMutation.mutate(coords);
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Could not fetch GPS coordinates');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <MapPin color={colors.dark.accent} size={24} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.headerTitle}>GPS Attendance Check-in</Text>
          <Text style={styles.headerSubtitle}>Verified location check-in for field staff</Text>
        </View>
      </View>

      {/* Action Card */}
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Mark Field Attendance</Text>
        <Text style={styles.actionSub}>Capture real-time GPS coordinates for site verification</Text>

        <Pressable
          style={styles.checkInBtn}
          onPress={handleCaptureLocation}
          disabled={locationLoading || checkInMutation.isPending}
        >
          {locationLoading || checkInMutation.isPending ? (
            <ActivityIndicator color="#0F0F1A" />
          ) : (
            <>
              <Navigation color="#0F0F1A" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.checkInBtnText}>Check-in Current Location</Text>
            </>
          )}
        </Pressable>

        {currentLocation && (
          <View style={styles.coordsBox}>
            <CheckCircle color="#10b981" size={16} style={{ marginRight: 6 }} />
            <Text style={styles.coordsText}>
              Last Verified: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
            </Text>
          </View>
        )}
      </View>

      {/* Logs Header */}
      <Text style={styles.logsTitle}>Recent GPS Check-in Logs</Text>

      {/* Logs List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={styles.iconBox}>
                <Clock color={colors.dark.accent} size={18} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.logUser}>{item.Username}</Text>
                <Text style={styles.logSub}>
                  {item.Address || `${item.Latitude}, ${item.Longitude}`}
                </Text>
                <Text style={styles.logTime}>
                  {new Date(item.CheckInTime).toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
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
  actionCard: {
    backgroundColor: colors.dark.bgSecondary,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  actionSub: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  checkInBtn: {
    flexDirection: 'row',
    backgroundColor: colors.dark.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtnText: {
    color: '#0F0F1A',
    fontWeight: '700',
    fontSize: 15,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    justifyContent: 'center',
  },
  coordsText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  logsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.textPrimary,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logUser: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  logSub: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },
  logTime: {
    fontSize: 11,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
});
