import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, Pressable, FlatList,
  ActivityIndicator, Alert, ScrollView, Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { Plus, X, ChevronDown, IndianRupee } from 'lucide-react-native';


// ─── Types ────────────────────────────────────────────────────────────────────

interface Payment {
  id: number;
  PaymentCategory: string;  // backend field: 'Labour' | 'Collection' | 'Material'
  PaymentDate: string;      // backend field
  Site?: { SiteName: string };
  SiteId?: number;
  Payee?: { Name: string };
  PayeeId?: number;
  Amount: number;
  PaymentMode: string;
  Notes?: string;
}

interface Site { id: number; SiteName: string; }
interface Payee { id: number; Name: string; }

// Backend stores short values: 'Labour', 'Collection', 'Material'
// Display labels map to those short values for filtering
const CATEGORIES: { label: string; value: string }[] = [
  { label: 'Labour (Expense)',    value: 'Labour' },
  { label: 'Collection (Income)', value: 'Collection' },
  { label: 'Material (Expense)', value: 'Material' },
];
const PAYMENT_MODES = ['Cash', 'UPI', 'Cheque', 'Bank Transfer'];

// ─── Inline Dropdown (no nested Modal — works inside Modal/ScrollView) ────────
// Renders the options list as an expandable accordion inline in the ScrollView.

function InlineDropdown({
  label, value, options, onChange, placeholder,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder || 'Select…';

  const filtered = search.trim()
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggleOpen = () => {
    setSearch('');
    setOpen(p => !p);
  };

  return (
    <View>
      {label ? <Text style={ddStyles.label}>{label}</Text> : null}
      <Pressable
        style={[ddStyles.select, open && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottomColor: 'transparent' }]}
        onPress={toggleOpen}
      >
        <Text style={[ddStyles.selectText, !value && ddStyles.placeholder]}>{selectedLabel}</Text>
        <ChevronDown
          color={colors.dark.textMuted}
          size={16}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </Pressable>
      {open && (
        <View style={ddStyles.menuWrapper}>
          {/* ── Search box ── */}
          <TextInput
            style={ddStyles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Type to search…"
            placeholderTextColor={colors.dark.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {/* ── Options list ── */}
          <ScrollView
            style={ddStyles.menu}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length === 0 ? (
              <Text style={ddStyles.noResults}>No results for "{search}"</Text>
            ) : (
              filtered.map(opt => (
                <Pressable
                  key={opt.value}
                  style={[ddStyles.option, opt.value === value && ddStyles.optionActive]}
                  onPress={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                >
                  <Text style={[ddStyles.optionText, opt.value === value && ddStyles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const ddStyles = StyleSheet.create({
  label: { color: colors.dark.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  select: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.dark.bgInput, borderWidth: 1, borderColor: colors.dark.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
  },
  selectText: { color: colors.dark.textPrimary, fontSize: 14, flex: 1 },
  placeholder: { color: colors.dark.textMuted },
  menuWrapper: {
    borderWidth: 1, borderTopWidth: 0, borderColor: colors.dark.border,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    overflow: 'hidden', backgroundColor: colors.dark.bgCard,
  },
  searchInput: {
    backgroundColor: colors.dark.bgInput,
    borderBottomWidth: 1, borderBottomColor: colors.dark.border,
    paddingHorizontal: 14, paddingVertical: 10,
    color: colors.dark.textPrimary, fontSize: 13,
  },
  menu: {
    maxHeight: 180,
  },
  option: { paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.dark.border + '55' },
  optionActive: { backgroundColor: colors.dark.accent + '22' },
  optionText: { color: colors.dark.textPrimary, fontSize: 14 },
  optionTextActive: { color: colors.dark.accent, fontWeight: '700' },
  noResults: { color: colors.dark.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function PaymentListScreen() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Form state — uses backend short values for PaymentCategory
  const [formCategory, setFormCategory] = useState('Labour');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSiteId, setFormSiteId] = useState('');
  const [formPayeeId, setFormPayeeId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMode, setFormMode] = useState('Cash');
  const [formNotes, setFormNotes] = useState('');

  // ── Queries ──
  const { data: payments, isLoading, isFetching, refetch } = useQuery<Payment[]>({
    queryKey: ['payments', filterCategory, filterDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      // Backend expects 'category' with short values ('Labour','Collection','Material')
      if (filterCategory) params.append('category', filterCategory);
      if (filterDate) params.append('fromDate', filterDate);
      const response = await api.get(`/payments?${params.toString()}`);
      return response.data;
    },
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ['sites-list'],
    queryFn: async () => {
      const r = await api.get('/sites');
      return r.data;
    },
  });

  const { data: payees } = useQuery<Payee[]>({
    queryKey: ['payees-list'],
    queryFn: async () => {
      const r = await api.get('/payees');
      return r.data;
    },
  });

  // ── Mutations ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      return api.post('/payments', {
        PaymentCategory: formCategory,   // backend field name
        PaymentDate: formDate,           // backend field name
        SiteId: formSiteId ? parseInt(formSiteId) : undefined,
        PayeeId: formPayeeId ? parseInt(formPayeeId) : undefined,
        Amount: parseFloat(formAmount),
        PaymentMode: formMode,
        Notes: formNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      closeForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to record payment');
    },
  });

  const openForm = () => {
    setFormCategory('Labour');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormSiteId('');
    setFormPayeeId('');
    setFormAmount('');
    setFormMode('Cash');
    setFormNotes('');
    setModalOpen(true);
  };

  const closeForm = () => setModalOpen(false);

  // ── Helpers ──
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  // cat is the short backend value: 'Labour' | 'Collection' | 'Material'
  const categoryColor = (cat: string) => {
    if (cat === 'Collection') return colors.dark.success;
    if (cat === 'Material')   return colors.dark.info;
    return colors.dark.warning; // Labour
  };

  const siteOptions = [
    { label: 'All Sites', value: '' },
    ...(sites?.map(s => ({ label: s.SiteName, value: s.id.toString() })) ?? []),
  ];

  const payeeOptions = [
    { label: 'Select Person', value: '' },
    ...(payees?.map(p => ({ label: p.Name, value: p.id.toString() })) ?? []),
  ];

  const totalIncome  = payments?.filter(p => p.PaymentCategory === 'Collection').reduce((s, p) => s + p.Amount, 0) ?? 0;
  const totalExpense = payments?.filter(p => p.PaymentCategory !== 'Collection').reduce((s, p) => s + p.Amount, 0) ?? 0;

  // ── Render ──
  return (
    <View style={styles.container}>

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <View style={styles.filterBar}>
        <View style={styles.filterLeft}>
          <Pressable
            style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
            onPress={() => setFilterCategory('')}
          >
            <Text style={[styles.filterText, !filterCategory && styles.filterTextActive]}>All Categories</Text>
          </Pressable>
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat.value}
              style={[styles.filterChip, filterCategory === cat.value && styles.filterChipActive]}
              onPress={() => setFilterCategory(filterCategory === cat.value ? '' : cat.value)}
            >
              <Text style={[styles.filterText, filterCategory === cat.value && styles.filterTextActive]}>
                {cat.value}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          style={styles.dateFilter}
          value={filterDate}
          onChangeText={setFilterDate}
          placeholder="MM/DD/YYYY"
          placeholderTextColor={colors.dark.textMuted}
        />
      </View>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: colors.dark.success }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: colors.dark.success }]}>
            ₹{totalIncome.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: colors.dark.error }]}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, { color: colors.dark.error }]}>
            ₹{totalExpense.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: colors.dark.accent }]}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryValue, { color: colors.dark.accent }]}>
            ₹{(totalIncome - totalExpense).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* ── List Header ─────────────────────────────────────────────── */}
      <View style={styles.tableHeader}>
        <Text style={[styles.col, styles.colDate]}>DATE</Text>
        <Text style={[styles.col, styles.colCat]}>CATEGORY</Text>
        <Text style={[styles.col, styles.colSite]}>SITE NAME</Text>
        <Text style={[styles.col, styles.colPayee]}>PAYEE / RECIPIENT</Text>
        <Text style={[styles.col, styles.colAmt]}>AMOUNT</Text>
      </View>

      {/* ── List ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <IndianRupee color={colors.dark.textMuted} size={40} />
              <Text style={styles.emptyText}>No payment records found</Text>
              <Text style={styles.emptySubText}>Tap + to record a payment</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[styles.col, styles.colDate, styles.cellText]}>
                {formatDate(item.PaymentDate)}
              </Text>
              <View style={styles.colCatView}>
                <View style={[styles.catBadge, { backgroundColor: categoryColor(item.PaymentCategory) + '22', borderColor: categoryColor(item.PaymentCategory) + '66' }]}>
                  <Text style={[styles.catBadgeText, { color: categoryColor(item.PaymentCategory) }]}>{item.PaymentCategory}</Text>
                </View>
              </View>
              <Text style={[styles.col, styles.colSite, styles.cellText]} numberOfLines={1}>
                {item.Site?.SiteName || '—'}
              </Text>
              <Text style={[styles.col, styles.colPayee, styles.cellText]} numberOfLines={1}>
                {item.Payee?.Name || '—'}
              </Text>
              <Text style={[styles.col, styles.colAmt, styles.amtText,
                { color: item.PaymentCategory === 'Collection' ? colors.dark.success : colors.dark.textPrimary }]}>
                ₹{item.Amount.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        />
      )}

      {/* ── FAB ──────────────────────────────────────────────────────── */}
      <Pressable style={styles.fab} onPress={openForm}>
        <Plus color="#0F0F1A" size={24} />
      </Pressable>

      {/* ── Add Payment Modal (mirrors web app) ─────────────────────── */}
      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={closeForm}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Payment</Text>
              <Pressable onPress={closeForm} style={styles.closeBtn}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Row 1: Category + Date */}
              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <InlineDropdown
                    label="CATEGORY"
                    value={formCategory}
                    options={CATEGORIES}
                    onChange={setFormCategory}
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.fieldLabel}>DATE</Text>
                  <TextInput
                    style={styles.input}
                    value={formDate}
                    onChangeText={setFormDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.dark.textMuted}
                  />
                </View>
              </View>

              {/* Site */}
              <View style={styles.formGroup}>
                <InlineDropdown
                  label="SITE"
                  value={formSiteId}
                  options={siteOptions}
                  onChange={setFormSiteId}
                  placeholder="Select Site"
                />
              </View>

              {/* Payee */}
              <View style={styles.formGroup}>
                <InlineDropdown
                  label="PAYEE"
                  value={formPayeeId}
                  options={payeeOptions}
                  onChange={setFormPayeeId}
                  placeholder="Select Person"
                />
                <Text style={styles.hint}>Showing Labours &amp; Contractors</Text>
              </View>

              {/* Row 2: Amount + Mode */}
              <View style={styles.formRow}>
                <View style={styles.formHalf}>
                  <Text style={styles.fieldLabel}>AMOUNT (RS)</Text>
                  <TextInput
                    style={styles.input}
                    value={formAmount}
                    onChangeText={setFormAmount}
                    placeholder="0"
                    placeholderTextColor={colors.dark.textMuted}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.formHalf}>
                  <InlineDropdown
                    label="PAYMENT MODE"
                    value={formMode}
                    options={PAYMENT_MODES.map(m => ({ label: m, value: m }))}
                    onChange={setFormMode}
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>NOTES</Text>
                <TextInput
                  style={[styles.input, styles.inputTextarea]}
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="Add notes…"
                  placeholderTextColor={colors.dark.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Footer Actions — matches web "Cancel / Record Payment" */}
            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelBtn} onPress={closeForm}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.recordBtn, (!formAmount || saveMutation.isPending) && styles.recordBtnDisabled]}
                onPress={() => saveMutation.mutate()}
                disabled={!formAmount || saveMutation.isPending}
              >
                {saveMutation.isPending
                  ? <ActivityIndicator size="small" color="#0F0F1A" />
                  : <Text style={styles.recordBtnText}>Record Payment</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.bgPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Filter bar
  filterBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  filterLeft: { flexDirection: 'row', gap: 6, flexShrink: 1 },
  filterChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.dark.bgCard, borderWidth: 1, borderColor: colors.dark.border,
  },
  filterChipActive: { backgroundColor: colors.dark.accent + '22', borderColor: colors.dark.accent },
  filterText: { color: colors.dark.textMuted, fontSize: 12 },
  filterTextActive: { color: colors.dark.accent, fontWeight: '600' },
  dateFilter: {
    backgroundColor: colors.dark.bgInput, borderWidth: 1, borderColor: colors.dark.border,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
    color: colors.dark.textPrimary, fontSize: 12, minWidth: 90,
  },

  // Summary
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: colors.dark.bgCard, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: colors.dark.border, borderLeftWidth: 3,
  },
  summaryLabel: { color: colors.dark.textMuted, fontSize: 11, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700' },

  // Table header
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: colors.dark.bgCard, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: colors.dark.border,
  },
  col: { fontSize: 11 },
  colDate: { width: 80, color: colors.dark.textMuted, fontWeight: '700' },
  colCat: { flex: 1.2, color: colors.dark.textMuted, fontWeight: '700' },
  colCatView: { flex: 1.2, justifyContent: 'center' },
  colSite: { flex: 1, color: colors.dark.textMuted, fontWeight: '700' },
  colPayee: { flex: 1, color: colors.dark.textMuted, fontWeight: '700' },
  colAmt: { width: 80, textAlign: 'right', color: colors.dark.textMuted, fontWeight: '700' },

  // Rows
  listContent: { paddingBottom: 100 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.dark.border + '55',
  },
  cellText: { color: colors.dark.textPrimary, fontSize: 12 },
  catBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start' },
  catBadgeText: { fontSize: 10, fontWeight: '600' },
  amtText: { fontSize: 13, fontWeight: '700', textAlign: 'right' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { color: colors.dark.textPrimary, fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySubText: { color: colors.dark.textMuted, fontSize: 13 },

  // FAB
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.dark.accent, justifyContent: 'center', alignItems: 'center',
    shadowColor: colors.dark.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: colors.dark.bgSecondary, borderRadius: 16, overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: colors.dark.border,
  },
  modalTitle: { color: colors.dark.textPrimary, fontSize: 18, fontWeight: '700' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: colors.dark.bgInput,
    justifyContent: 'center', alignItems: 'center',
  },

  // Form
  formRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  formHalf: { flex: 1 },
  formGroup: { paddingHorizontal: 20, paddingTop: 16 },
  fieldLabel: { color: colors.dark.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  input: {
    backgroundColor: colors.dark.bgInput, borderWidth: 1, borderColor: colors.dark.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13,
    color: colors.dark.textPrimary, fontSize: 14,
  },
  inputTextarea: { minHeight: 70, textAlignVertical: 'top' },
  hint: { color: colors.dark.textMuted, fontSize: 11, marginTop: 4 },

  // Footer
  modalFooter: {
    flexDirection: 'row', gap: 12, padding: 20,
    borderTopWidth: 1, borderTopColor: colors.dark.border,
  },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.dark.border, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  cancelBtnText: { color: colors.dark.textPrimary, fontSize: 15, fontWeight: '600' },
  recordBtn: {
    flex: 2, backgroundColor: colors.dark.accent, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center',
  },
  recordBtnDisabled: { opacity: 0.5 },
  recordBtnText: { color: '#0F0F1A', fontSize: 15, fontWeight: '700' },
});
