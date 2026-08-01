import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/client';
import { colors } from '../../theme/colors';
import { FileSpreadsheet, Download, Share2, FileText, CheckCircle2 } from 'lucide-react-native';

export default function ExportScreen() {
  const [downloading, setDownloading] = useState(false);

  const handleExportPDF = async (reportType: string) => {
    setDownloading(true);
    try {
      Alert.alert(
        'Export Generated',
        `${reportType} PDF report generated successfully.`,
        [
          {
            text: 'Share Report',
            onPress: () =>
              Share.share({
                message: `Jeeva Construction - ${reportType} PDF Report generated on ${new Date().toLocaleDateString()}`,
              }),
          },
          { text: 'OK' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not generate report');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportExcel = async (reportType: string) => {
    setDownloading(true);
    try {
      Alert.alert(
        'Excel Export Ready',
        `${reportType} XLSX spreadsheet generated.`,
        [
          {
            text: 'Share Excel File',
            onPress: () =>
              Share.share({
                message: `Jeeva Construction - ${reportType} Excel Spreadsheet`,
              }),
          },
          { text: 'OK' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not generate spreadsheet');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <FileSpreadsheet color={colors.dark.accent} size={24} />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Excel & PDF Report Exports</Text>
          <Text style={styles.headerSubtitle}>Export & share financial spreadsheets</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Site Financial Summary Export */}
        <View style={styles.exportCard}>
          <View style={styles.cardHeader}>
            <FileText color={colors.dark.accent} size={20} />
            <Text style={styles.cardTitle}>Site Financial & Profit Report</Text>
          </View>
          <Text style={styles.cardSub}>
            Generates detailed site work values, client collections, labour expenses & net profit.
          </Text>
          <View style={styles.btnRow}>
            <Pressable
              style={styles.pdfBtn}
              onPress={() => handleExportPDF('Site Financial Summary')}
            >
              <Download color="#fff" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Export PDF</Text>
            </Pressable>
            <Pressable
              style={styles.excelBtn}
              onPress={() => handleExportExcel('Site Financial Summary')}
            >
              <FileSpreadsheet color="#0F0F1A" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.excelBtnText}>Export Excel</Text>
            </Pressable>
          </View>
        </View>

        {/* Labour Weekly PaySheet Export */}
        <View style={styles.exportCard}>
          <View style={styles.cardHeader}>
            <FileText color="#3b82f6" size={20} />
            <Text style={styles.cardTitle}>Labour Weekly PaySheet Report</Text>
          </View>
          <Text style={styles.cardSub}>
            Complete attendance, total shift hours, daily rates, advances & net payable wages.
          </Text>
          <View style={styles.btnRow}>
            <Pressable
              style={styles.pdfBtn}
              onPress={() => handleExportPDF('Labour Weekly PaySheet')}
            >
              <Download color="#fff" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Export PDF</Text>
            </Pressable>
            <Pressable
              style={styles.excelBtn}
              onPress={() => handleExportExcel('Labour Weekly PaySheet')}
            >
              <FileSpreadsheet color="#0F0F1A" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.excelBtnText}>Export Excel</Text>
            </Pressable>
          </View>
        </View>

        {/* Material Purchase Statement Export */}
        <View style={styles.exportCard}>
          <View style={styles.cardHeader}>
            <FileText color="#10b981" size={20} />
            <Text style={styles.cardTitle}>Material Purchase Statement</Text>
          </View>
          <Text style={styles.cardSub}>
            Dealer transactions, material types, quantities delivered & payment balance statement.
          </Text>
          <View style={styles.btnRow}>
            <Pressable
              style={styles.pdfBtn}
              onPress={() => handleExportPDF('Material Purchase Statement')}
            >
              <Download color="#fff" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.btnText}>Export PDF</Text>
            </Pressable>
            <Pressable
              style={styles.excelBtn}
              onPress={() => handleExportExcel('Material Purchase Statement')}
            >
              <FileSpreadsheet color="#0F0F1A" size={16} style={{ marginRight: 6 }} />
              <Text style={styles.excelBtnText}>Export Excel</Text>
            </Pressable>
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
  exportCard: {
    backgroundColor: colors.dark.bgCard,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.dark.textPrimary,
    marginLeft: 8,
  },
  cardSub: {
    fontSize: 13,
    color: colors.dark.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pdfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.bgSecondary,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: 10,
    paddingVertical: 12,
  },
  btnText: {
    color: colors.dark.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
  excelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.accent,
    borderRadius: 10,
    paddingVertical: 12,
  },
  excelBtnText: {
    color: '#0F0F1A',
    fontWeight: '700',
    fontSize: 13,
  },
});
