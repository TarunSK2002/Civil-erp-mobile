import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, FlatList, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { Search, Plus, Phone, MessageCircle, Edit2, Trash2, X, RefreshCw } from 'lucide-react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface Client {
  id: number;
  Name: string;
  MobileNumber: string;
  PaymentType: string;
}

import { useAuth } from '../../auth/AuthContext';

export default function ClientListScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [paymentType, setPaymentType] = useState('Cash');

  // React Query Fetch Clients
  const { data: clients, isLoading, refetch, isFetching } = useQuery<Client[]>({
    queryKey: ['clients', search],
    queryFn: async () => {
      const response = await api.get(`/clients?search=${search}`);
      return response.data;
    },
  });

  // Client Mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { Name: name, MobileNumber: mobileNumber, PaymentType: paymentType };
      if (selectedClient) {
        return api.put(`/clients/${selectedClient.id}`, payload);
      }
      return api.post('/clients', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      closeForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save client');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to delete client');
    }
  });

  const handleOpenForm = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setName(client.Name);
      setMobileNumber(client.MobileNumber);
      setPaymentType(client.PaymentType);
    } else {
      setSelectedClient(null);
      setName('');
      setMobileNumber('');
      setPaymentType('Cash');
    }
    setBottomSheetOpen(true);
  };

  const closeForm = () => {
    setBottomSheetOpen(false);
    setSelectedClient(null);
    setName('');
    setMobileNumber('');
    setPaymentType('Cash');
  };

  const handleDelete = (client: Client) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${client.Name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(client.id) }
      ]
    );
  };

  const handleWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/[^0-9]/g, '');
    const url = `whatsapp://send?phone=91${formattedPhone}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      }
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Search Header Bar */}
      <View style={styles.searchBarWrapper}>
        <Search color={colors.dark.textMuted} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search clients..."
          placeholderTextColor={colors.dark.textMuted}
        />
        {isFetching ? <ActivityIndicator size="small" color={colors.dark.accent} /> : null}
      </View>

      {/* Client List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No clients found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.clientCard}>
              <View style={styles.cardInfo}>
                <Text style={styles.clientName}>{item.Name}</Text>
                {user?.role === 'ADMIN' && (
                <Text style={styles.clientPhone}>{item.MobileNumber}</Text>
                )}
                <View style={styles.badgeRow}>
                  <Text style={styles.paymentBadge}>{item.PaymentType}</Text>
                </View>
              </View>

              {/* Dynamic Operations Shortcuts - ADMIN Only */}
              {user?.role === 'ADMIN' && (
                <View style={styles.cardActions}>
                  <Pressable style={styles.iconButton} onPress={() => handleCall(item.MobileNumber)}>
                    <Phone color={colors.dark.accent} size={18} />
                  </Pressable>
                  <Pressable style={styles.iconButton} onPress={() => handleWhatsApp(item.MobileNumber)}>
                    <MessageCircle color="#25D366" size={18} />
                  </Pressable>
                  <Pressable style={styles.iconButton} onPress={() => handleOpenForm(item)}>
                    <Edit2 color={colors.dark.textSecondary} size={18} />
                  </Pressable>
                  <Pressable style={styles.iconButton} onPress={() => handleDelete(item)}>
                    <Trash2 color={colors.dark.error} size={18} />
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Sticky FAB button */}
      <Pressable style={styles.fab} onPress={() => handleOpenForm()}>
        <Plus color="#0F0F1A" size={24} />
      </Pressable>

      {/* Modal Bottom Sheet configuration */}
      {bottomSheetOpen && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedClient ? 'Edit Client' : 'Add New Client'}</Text>
              <Pressable onPress={closeForm}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Client Name"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                placeholder="Mobile Number"
                placeholderTextColor={colors.dark.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Payment Type</Text>
              <View style={styles.radioRow}>
                {['Cash', 'Bank'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.radioButton,
                      paymentType === type && styles.radioButtonActive
                    ]}
                    onPress={() => setPaymentType(type)}
                  >
                    <Text style={[
                      styles.radioText,
                      paymentType === type && styles.radioTextActive
                    ]}>{type}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator color="#0F0F1A" />
              ) : (
                <Text style={styles.saveButtonText}>Save Client</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.bgPrimary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  clientCard: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  clientName: {
    color: colors.dark.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  clientPhone: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  paymentBadge: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    color: colors.dark.accent,
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 12,
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.dark.textMuted,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.dark.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.dark.bgSecondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.dark.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    padding: 12,
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
  radioRow: {
    flexDirection: 'row',
  },
  radioButton: {
    flex: 1,
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  radioButtonActive: {
    borderColor: colors.dark.accent,
    backgroundColor: 'rgba(255, 179, 0, 0.05)',
  },
  radioText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  radioTextActive: {
    color: colors.dark.accent,
  },
  saveButton: {
    backgroundColor: colors.dark.accent,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#0F0F1A',
    fontWeight: '700',
    fontSize: 15,
  },
});
