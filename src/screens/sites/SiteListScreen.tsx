import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ... rest of imports ...

export default function SiteListScreen() {
  // ... rest of state and logic ...

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Search and Filters Header */}
      <View style={styles.searchBarWrapper}>
        <Search color={colors.dark.textMuted} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search sites..."
          placeholderTextColor={colors.dark.textMuted}
        />
        {isFetching ? <ActivityIndicator size="small" color={colors.dark.accent} /> : null}
      </View>

      {/* Filter Tabs Chips row */}
      <View style={styles.chipsContainer}>
        {['All', 'Upcoming', 'Active', 'Completed'].map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.chipButton,
              statusFilter === filter && styles.chipActive
            ]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text style={[
              styles.chipText,
              statusFilter === filter && styles.chipTextActive
            ]}>{filter}</Text>
          </Pressable>
        ))}
      </View>

      {/* Sites list grid cards */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={sites}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No construction sites found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable 
              style={styles.siteCard} 
              onPress={() => navigation.navigate('SiteDetail', { id: item.id })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.headerInfo}>
                  <Text style={styles.clientMuted}>{item.Client?.Name || 'No Client'}</Text>
                  <Text style={styles.siteTitle}>{item.SiteName}</Text>
                </View>
                <Text style={[
                  styles.statusBadge,
                  item.Status === 'Active' ? styles.statusActive :
                  item.Status === 'Completed' ? styles.statusCompleted : styles.statusUpcoming
                ]}>{item.Status}</Text>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MapPin color={colors.dark.textSecondary} size={14} style={{ marginRight: 4 }} />
                  <Text style={styles.metaText}>{item.Facing} Facing</Text>
                </View>
                <Text style={styles.siteValueText}>₹{item.SiteValue.toLocaleString('en-IN')}</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.cardActions}>
                <Pressable 
                  style={[styles.actionBtn, styles.actionBtnView]} 
                  onPress={() => navigation.navigate('SiteDetail', { id: item.id })}
                >
                  <Eye color={colors.dark.textPrimary} size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.actionBtnText}>View Details</Text>
                </Pressable>
                <View style={{ flexDirection: 'row' }}>
                  <Pressable style={styles.iconBtn} onPress={() => handleOpenForm(item)}>
                    <Edit2 color={colors.dark.textSecondary} size={16} />
                  </Pressable>
                  <Pressable style={styles.iconBtn} onPress={() => handleDelete(item)}>
                    <Trash2 color={colors.dark.error} size={16} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Sticky FAB */}
      <Pressable style={styles.fab} onPress={() => handleOpenForm()}>
        <Plus color="#0F0F1A" size={24} />
      </Pressable>

      {/* Add/Edit Form Overlay */}
      {bottomSheetOpen && (
        <View style={styles.overlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSite ? 'Edit Site' : 'Add New Site'}</Text>
              <Pressable onPress={closeForm}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Site Name</Text>
              <TextInput
                style={styles.input}
                value={siteName}
                onChangeText={setSiteName}
                placeholder="e.g. Park Villa"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Site Value (₹)</Text>
              <TextInput
                style={styles.input}
                value={siteValue}
                onChangeText={setSiteValue}
                placeholder="Quoted Budget Value"
                placeholderTextColor={colors.dark.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.dimensionRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Length (ft)</Text>
                <TextInput
                  style={styles.input}
                  value={length}
                  onChangeText={setLength}
                  placeholder="Length"
                  placeholderTextColor={colors.dark.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Breadth (ft)</Text>
                <TextInput
                  style={styles.input}
                  value={breadth}
                  onChangeText={setBreadth}
                  placeholder="Breadth"
                  placeholderTextColor={colors.dark.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Facing Direction</Text>
              <TextInput
                style={styles.input}
                value={facing}
                onChangeText={setFacing}
                placeholder="e.g. East, North"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Select Client</Text>
              <Pressable 
                style={[styles.dropdownButton, showClientDropdown && styles.dropdownButtonActive]} 
                onPress={() => setShowClientDropdown(!showClientDropdown)}
              >
                <Text style={clientId ? styles.dropdownSelectedText : styles.dropdownPlaceholderText}>
                  {clients?.find(c => c.id.toString() === clientId)?.Name || 'Choose Client'}
                </Text>
                <ChevronDown color={colors.dark.textSecondary} size={16} />
              </Pressable>

              {showClientDropdown && (
                <ScrollView style={styles.dropdownMenu} nestedScrollEnabled={true}>
                  {clients?.map((cli) => (
                    <Pressable
                      key={cli.id}
                      style={styles.dropdownOption}
                      onPress={() => { setClientId(cli.id.toString()); setShowClientDropdown(false); }}
                    >
                      <Text style={styles.dropdownOptionText}>{cli.Name}</Text>
                      {clientId === cli.id.toString() && <Check color={colors.dark.accent} size={14} />}
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.radioRow}>
                {['Upcoming', 'Active', 'Completed'].map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.radioButton,
                      status === type && styles.radioButtonActive
                    ]}
                    onPress={() => setStatus(type)}
                  >
                    <Text style={[
                      styles.radioText,
                      status === type && styles.radioTextActive
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
                <Text style={styles.saveButtonText}>Save Site Configuration</Text>
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
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    margin: 16,
    marginBottom: 8,
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
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chipButton: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.dark.accent,
    borderColor: colors.dark.accent,
  },
  chipText: {
    color: colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0F0F1A',
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
  siteCard: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
  },
  clientMuted: {
    color: colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  siteTitle: {
    color: colors.dark.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    color: '#4CAF50',
  },
  statusCompleted: {
    backgroundColor: 'rgba(33, 150, 243, 0.12)',
    color: '#2196F3',
  },
  statusUpcoming: {
    backgroundColor: 'rgba(255, 179, 0, 0.12)',
    color: '#FFB300',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
  },
  siteValueText: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnView: {
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  actionBtnText: {
    color: colors.dark.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  iconBtn: {
    marginLeft: 14,
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
    maxHeight: '85%',
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
  dimensionRow: {
    flexDirection: 'row',
  },
  radioRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  radioOptionActive: {
    borderColor: colors.dark.accent,
    backgroundColor: 'rgba(255, 179, 0, 0.05)',
  },
  radioOptionText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  radioOptionTextActive: {
    color: colors.dark.accent,
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
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.bgInput,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownButtonActive: {
    borderColor: colors.dark.accent,
  },
  dropdownPlaceholderText: {
    color: colors.dark.textMuted,
    fontSize: 14,
  },
  dropdownSelectedText: {
    color: colors.dark.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownMenu: {
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    marginTop: 6,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  dropdownOptionText: {
    color: colors.dark.textPrimary,
    fontSize: 14,
  },
});
