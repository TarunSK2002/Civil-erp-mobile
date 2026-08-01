import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { colors } from '../theme/colors';
import { Shield, Plus, UserCheck, Trash2, X, Lock, Check } from 'lucide-react-native';

interface UserItem {
  id: number;
  Username: string;
  FullName: string;
  Role: string;
}

export default function UserManagementScreen() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EMP'>('EMP');

  // Fetch Users
  const { data: users, isLoading } = useQuery<UserItem[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data || [];
    },
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      return api.post('/auth/register', {
        Username: username.trim(),
        Password: password,
        FullName: fullName.trim(),
        Role: role,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeModal();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to create user');
    },
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      Alert.alert('Success', 'User removed');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to delete user');
    },
  });

  const closeModal = () => {
    setModalVisible(false);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('EMP');
  };

  const handleDelete = (user: UserItem) => {
    if (user.Username === 'admin') {
      Alert.alert('Restricted', 'Primary admin cannot be deleted');
      return;
    }

    Alert.alert('Confirm Delete', `Delete user ${user.FullName} (${user.Username})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(user.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Shield color={colors.dark.accent} size={24} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.headerTitle}>User & Role Management</Text>
          <Text style={styles.headerSubtitle}>Manage system users and access roles</Text>
        </View>
      </View>

      {/* Users List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.avatarBox}>
                <UserCheck color={colors.dark.accent} size={20} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.userName}>{item.FullName || item.Username}</Text>
                <Text style={styles.userSub}>@{item.Username}</Text>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  item.Role === 'ADMIN' ? styles.roleAdmin : styles.roleEmp,
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeText,
                    item.Role === 'ADMIN' ? styles.roleAdminText : styles.roleEmpText,
                  ]}
                >
                  {item.Role}
                </Text>
              </View>

              {item.Username !== 'admin' && (
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                  <Trash2 color={colors.dark.error} size={18} />
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="#0F0F1A" size={24} />
      </Pressable>

      {/* Add User Modal */}
      {modalVisible && (
        <View style={styles.overlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New System User</Text>
              <Pressable onPress={closeModal}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="e.g. ramesh"
                placeholderTextColor={colors.dark.textMuted}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Secret password"
                placeholderTextColor={colors.dark.textMuted}
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>System Role</Text>
              <View style={styles.radioRow}>
                {(['EMP', 'ADMIN'] as const).map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.radioButton, role === r && styles.radioButtonActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.radioText, role === r && styles.radioTextActive]}>
                      {r === 'ADMIN' ? 'Admin' : 'Employee (EMP)'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#0F0F1A" />
              ) : (
                <Text style={styles.saveButtonText}>Create User</Text>
              )}
            </Pressable>
          </ScrollView>
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark.textPrimary,
  },
  userSub: {
    fontSize: 12,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  roleAdmin: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  roleEmp: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleAdminText: {
    color: '#f43f5e',
  },
  roleEmpText: {
    color: '#3b82f6',
  },
  deleteBtn: {
    padding: 6,
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
    gap: 10,
  },
  radioButton: {
    flex: 1,
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: colors.dark.accent,
    backgroundColor: 'rgba(255, 179, 0, 0.05)',
  },
  radioText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
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
