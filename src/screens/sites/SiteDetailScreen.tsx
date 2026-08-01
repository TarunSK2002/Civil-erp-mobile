import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ArrowLeft, MapPin, Ruler, Compass, Plus, Trash2, Edit2, X, ChevronDown, Check } from 'lucide-react-native';
import { useAuth } from '../../auth/AuthContext';

interface Section {
  id: number;
  Name: string;
  Length: string;
  Breadth: string;
  Height: string;
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
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { id } = route.params;
  const [activeTab, setActiveTab] = useState<'summary' | 'sections' | 'projects'>('summary');

  // Modals state
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Floor/Section Form State
  const [secName, setSecName] = useState('');
  const [secLength, setSecLength] = useState('');
  const [secBreadth, setSecBreadth] = useState('');
  const [secHeight, setSecHeight] = useState('');
  const [secRate, setSecRate] = useState('');

  // Project Form State
  const [showWorkTypeDropdown, setShowWorkTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [projName, setProjName] = useState('');
  const [projValue, setProjValue] = useState('');
  const [projWorkType, setProjWorkType] = useState('New Construction');
  const [projStartDate, setProjStartDate] = useState('');
  const [projEndDate, setProjEndDate] = useState('');
  const [projStatus, setProjStatus] = useState('In Progress');
  const [projNotes, setProjNotes] = useState('');

  const workTypes = ['New Construction', 'Renovation', 'Extension', 'Plumbing', 'Electrical', 'Painting', 'Other'];
  const statusTypes = ['Upcoming', 'In Progress', 'Completed', 'On Hold'];

  // React Query Fetch Site Details
  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ['site-detail', id],
    queryFn: async () => {
      const response = await api.get(`/sites/${id}`);
      return response.data;
    },
  });

  // React Query Fetch Floors / Sections
  const { data: sections, isLoading: sectionsLoading } = useQuery<Section[]>({
    queryKey: ['site-sections', id],
    queryFn: async () => {
      const response = await api.get(`/site-sections/site/${id}`);
      return response.data;
    },
  });

  // React Query Fetch Projects
  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['site-projects', id],
    queryFn: async () => {
      const response = await api.get(`/site-projects/site/${id}`);
      return response.data;
    },
  });

  // Section Save Mutation
  const saveSectionMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        SiteId: parseInt(id),
        Name: secName,
        Length: secLength ? parseFloat(secLength) : null,
        Breadth: secBreadth ? parseFloat(secBreadth) : null,
        Height: secHeight ? parseFloat(secHeight) : null,
        RatePerSqFt: secRate ? parseFloat(secRate) : 0,
      };

      if (editingSection) {
        return api.put(`/site-sections/${editingSection.id}`, payload);
      }
      return api.post('/site-sections', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-sections', id] });
      queryClient.invalidateQueries({ queryKey: ['site-detail', id] });
      closeSectionForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save section');
    }
  });

  // Section Delete Mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: number) => {
      return api.delete(`/site-sections/${sectionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-sections', id] });
      queryClient.invalidateQueries({ queryKey: ['site-detail', id] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to delete section');
    }
  });

  // Project Save Mutation
  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        SiteId: parseInt(id),
        ProjectName: projName,
        WorkType: projWorkType,
        QuotedValue: projValue ? parseFloat(projValue) : 0,
        StartDate: projStartDate || null,
        EndDate: projEndDate || null,
        Status: projStatus,
        Notes: projNotes,
      };

      if (editingProject) {
        return api.put(`/site-projects/${editingProject.id}`, payload);
      }
      return api.post('/site-projects', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-projects', id] });
      queryClient.invalidateQueries({ queryKey: ['site-detail', id] });
      closeProjectForm();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to save project');
    }
  });

  // Project Delete Mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return api.delete(`/site-projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-projects', id] });
      queryClient.invalidateQueries({ queryKey: ['site-detail', id] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.msg || 'Failed to delete project');
    }
  });

  // Section Helpers
  const handleOpenSectionForm = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setSecName(section.Name);
      setSecLength(section.Length ? section.Length.toString() : '');
      setSecBreadth(section.Breadth ? section.Breadth.toString() : '');
      setSecHeight(section.Height ? section.Height.toString() : '');
      setSecRate(section.RatePerSqFt ? section.RatePerSqFt.toString() : '');
    } else {
      setEditingSection(null);
      setSecName('');
      setSecLength('');
      setSecBreadth('');
      setSecHeight('');
      setSecRate('');
    }
    setSectionModalOpen(true);
  };

  const closeSectionForm = () => {
    setSectionModalOpen(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (section: Section) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${section.Name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteSectionMutation.mutate(section.id) }
      ]
    );
  };

  // Project Helpers
  const handleOpenProjectForm = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjName(project.ProjectName);
      setProjValue(project.QuotedValue ? project.QuotedValue.toString() : '');
      setProjWorkType(project.WorkType);
      setProjStartDate(project.StartDate ? project.StartDate.split('T')[0] : '');
      setProjEndDate(project.EndDate ? project.EndDate.split('T')[0] : '');
      setProjStatus(project.Status);
      setProjNotes(project.Notes || '');
    } else {
      setEditingProject(null);
      setProjName('');
      setProjValue('');
      setProjWorkType('New Construction');
      setProjStartDate('');
      setProjEndDate('');
      setProjStatus('In Progress');
      setProjNotes('');
    }
    setProjectModalOpen(true);
  };

  const closeProjectForm = () => {
    setProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (project: Project) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${project.ProjectName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProjectMutation.mutate(project.id) }
      ]
    );
  };

  if (siteLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.dark.accent} />
      </View>
    );
  }

  // Auto calculate values for Floors/Sections
  const computedArea = parseFloat(secLength) && parseFloat(secBreadth) ? (parseFloat(secLength) * parseFloat(secBreadth)) : 0;
  const computedValue = computedArea && parseFloat(secRate) ? (computedArea * parseFloat(secRate)) : 0;

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
          <View style={{ paddingBottom: 40 }}>
            {/* Financial Details Info */}
            <View style={styles.financialCard}>
              {user?.role === 'ADMIN' && (
                <>
                  <Text style={styles.cardTitle}>Site Valuation</Text>
                  <Text style={styles.valuationAmount}>₹{site?.SiteValue?.toLocaleString('en-IN')}</Text>
                  <View style={styles.divider} />
                </>
              )}
              
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
            {user?.role === 'ADMIN' && (
              <>
                <Text style={styles.sectionTitle}>Recent Payments</Text>
                {site?.RecentPayments && site.RecentPayments.length > 0 ? (
                  site.RecentPayments.map((pm: any) => (
                    <View key={pm.id} style={styles.paymentRow}>
                      <View>
                        <Text style={styles.paymentCategory}>{pm.PaymentCategory}</Text>
                        <Text style={styles.paymentDate}>{new Date(pm.PaymentDate).toLocaleDateString('en-IN')}</Text>
                      </View>
                      <Text style={styles.paymentAmount}>- ₹{pm.Amount.toLocaleString('en-IN')}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noData}>No recent transactions</Text>
                )}
              </>
            )}
          </View>
        )}

        {activeTab === 'sections' && (
          <View style={{ paddingBottom: 100 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Floors & Sections ({sections?.length || 0})</Text>
              <Pressable style={styles.addTabBtn} onPress={() => handleOpenSectionForm()}>
                <Plus size={14} color="#0F0F1A" style={{ marginRight: 4 }} />
                <Text style={styles.addTabBtnText}>New Floor</Text>
              </Pressable>
            </View>

            {sectionsLoading ? (
              <ActivityIndicator color={colors.dark.accent} style={{ marginTop: 20 }} />
            ) : sections && sections.length > 0 ? (
              sections.map((sec: Section) => (
                <View key={sec.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{sec.Name}</Text>
                    <Text style={styles.itemValue}>₹{sec.SectionValue.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.itemDetail}>Size: {sec.Length} × {sec.Breadth} ft ({sec.Area} SqFt)</Text>
                  {sec.Height ? <Text style={styles.itemDetail}>Height: {sec.Height} ft</Text> : null}
                  <Text style={styles.itemDetail}>Rate: ₹{sec.RatePerSqFt} / SqFt</Text>
                  <View style={styles.itemActions}>
                    <Pressable style={styles.actionIconButton} onPress={() => handleOpenSectionForm(sec)}>
                      <Edit2 color={colors.dark.textSecondary} size={14} />
                    </Pressable>
                    <Pressable style={styles.actionIconButton} onPress={() => handleDeleteSection(sec)}>
                      <Trash2 color={colors.dark.error} size={14} />
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No floors defined for this site</Text>
            )}
          </View>
        )}

        {activeTab === 'projects' && (
          <View style={{ paddingBottom: 100 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Projects & Work Orders ({projects?.length || 0})</Text>
              <Pressable style={styles.addTabBtn} onPress={() => handleOpenProjectForm()}>
                <Plus size={14} color="#0F0F1A" style={{ marginRight: 4 }} />
                <Text style={styles.addTabBtnText}>New Project</Text>
              </Pressable>
            </View>

            {projectsLoading ? (
              <ActivityIndicator color={colors.dark.accent} style={{ marginTop: 20 }} />
            ) : projects && projects.length > 0 ? (
              projects.map((proj: Project) => (
                <View key={proj.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{proj.ProjectName}</Text>
                    <Text style={styles.itemValue}>₹{proj.QuotedValue.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.itemDetail}>Work Type: {proj.WorkType}</Text>
                  <Text style={styles.itemDetail}>Status: {proj.Status}</Text>
                  {proj.StartDate ? <Text style={styles.itemDetail}>Start: {new Date(proj.StartDate).toLocaleDateString('en-IN')}</Text> : null}
                  {proj.EndDate ? <Text style={styles.itemDetail}>End: {new Date(proj.EndDate).toLocaleDateString('en-IN')}</Text> : null}
                  {proj.Notes ? <Text style={styles.itemNotes}>Notes: {proj.Notes}</Text> : null}
                  <View style={styles.itemActions}>
                    <Pressable style={styles.actionIconButton} onPress={() => handleOpenProjectForm(proj)}>
                      <Edit2 color={colors.dark.textSecondary} size={14} />
                    </Pressable>
                    <Pressable style={styles.actionIconButton} onPress={() => handleDeleteProject(proj)}>
                      <Trash2 color={colors.dark.error} size={14} />
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noData}>No projects scheduled</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floor / Section Add/Edit Modal */}
      {sectionModalOpen && (
        <View style={styles.overlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSection ? 'Edit Floor' : 'Add New Floor'}</Text>
              <Pressable onPress={closeSectionForm}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Floor Name</Text>
              <TextInput
                style={styles.input}
                value={secName}
                onChangeText={setSecName}
                placeholder="e.g. Ground Floor, First Floor"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <View style={styles.dimensionRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Length (ft)</Text>
                <TextInput
                  style={styles.input}
                  value={secLength}
                  onChangeText={setSecLength}
                  placeholder="Length"
                  placeholderTextColor={colors.dark.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Breadth (ft)</Text>
                <TextInput
                  style={styles.input}
                  value={secBreadth}
                  onChangeText={setSecBreadth}
                  placeholder="Breadth"
                  placeholderTextColor={colors.dark.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.dimensionRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Height (ft)</Text>
                <TextInput
                  style={styles.input}
                  value={secHeight}
                  onChangeText={setSecHeight}
                  placeholder="Height (optional)"
                  placeholderTextColor={colors.dark.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Rate Per SqFt (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={secRate}
                  onChangeText={setSecRate}
                  placeholder="Rate Per SqFt"
                  placeholderTextColor={colors.dark.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Computation info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Calculated Area: {computedArea.toFixed(1)} SqFt</Text>
              <Text style={[styles.infoText, { fontWeight: '700', marginTop: 4 }]}>Calculated Value: ₹{computedValue.toLocaleString('en-IN')}</Text>
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={() => saveSectionMutation.mutate()}
              disabled={saveSectionMutation.isPending}
            >
              {saveSectionMutation.isPending ? (
                <ActivityIndicator color="#0F0F1A" />
              ) : (
                <Text style={styles.saveButtonText}>Save Floor Configuration</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      )}

      {/* Project Add/Edit Modal */}
      {projectModalOpen && (
        <View style={styles.overlay}>
          <ScrollView style={styles.modalCard} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProject ? 'Edit Project' : 'Add New Project'}</Text>
              <Pressable onPress={closeProjectForm}>
                <X color={colors.dark.textPrimary} size={20} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Project/Work Name</Text>
              <TextInput
                style={styles.input}
                value={projName}
                onChangeText={setProjName}
                placeholder="e.g. Brick Work, Tiling"
                placeholderTextColor={colors.dark.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Quoted Budget Value (₹)</Text>
              <TextInput
                style={styles.input}
                value={projValue}
                onChangeText={setProjValue}
                placeholder="Contract/Work Order Budget"
                placeholderTextColor={colors.dark.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Work Type</Text>
              <Pressable 
                style={[styles.dropdownButton, showWorkTypeDropdown && styles.dropdownButtonActive]} 
                onPress={() => setShowWorkTypeDropdown(!showWorkTypeDropdown)}
              >
                <Text style={styles.dropdownSelectedText}>{projWorkType}</Text>
                <ChevronDown color={colors.dark.textSecondary} size={16} />
              </Pressable>
              {showWorkTypeDropdown && (
                <View style={styles.dropdownMenu}>
                  {workTypes.map((type) => (
                    <Pressable
                      key={type}
                      style={styles.dropdownOption}
                      onPress={() => { setProjWorkType(type); setShowWorkTypeDropdown(false); }}
                    >
                      <Text style={styles.dropdownOptionText}>{type}</Text>
                      {projWorkType === type && <Check color={colors.dark.accent} size={14} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.dimensionRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={projStartDate}
                  onChangeText={setProjStartDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.dark.textMuted}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={projEndDate}
                  onChangeText={setProjEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.dark.textMuted}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Status</Text>
              <Pressable 
                style={[styles.dropdownButton, showStatusDropdown && styles.dropdownButtonActive]} 
                onPress={() => setShowStatusDropdown(!showStatusDropdown)}
              >
                <Text style={styles.dropdownSelectedText}>{projStatus}</Text>
                <ChevronDown color={colors.dark.textSecondary} size={16} />
              </Pressable>
              {showStatusDropdown && (
                <View style={styles.dropdownMenu}>
                  {statusTypes.map((status) => (
                    <Pressable
                      key={status}
                      style={styles.dropdownOption}
                      onPress={() => { setProjStatus(status); setShowStatusDropdown(false); }}
                    >
                      <Text style={styles.dropdownOptionText}>{status}</Text>
                      {projStatus === status && <Check color={colors.dark.accent} size={14} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={projNotes}
                onChangeText={setProjNotes}
                placeholder="Additional notes..."
                placeholderTextColor={colors.dark.textMuted}
                multiline
              />
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={() => saveProjectMutation.mutate()}
              disabled={saveProjectMutation.isPending}
            >
              {saveProjectMutation.isPending ? (
                <ActivityIndicator color="#0F0F1A" />
              ) : (
                <Text style={styles.saveButtonText}>Save Project Configuration</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      )}
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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark.accent,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addTabBtnText: {
    color: '#0F0F1A',
    fontSize: 12,
    fontWeight: '700',
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
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingTop: 8,
  },
  actionIconButton: {
    marginLeft: 16,
    padding: 4,
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
  infoBox: {
    backgroundColor: 'rgba(255, 179, 0, 0.05)',
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    color: colors.dark.textSecondary,
    fontSize: 13,
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
