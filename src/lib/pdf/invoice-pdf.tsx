// =============================================================================
// Muhandes HUB — ZATCA-Compliant Invoice PDF Template
// =============================================================================

import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, colors, formatPdfSAR, formatPdfDate } from './styles';

interface InvoicePdfData {
  // Commission / Invoice data
  invoice_number?: string;
  deal_id: string;
  deal_title?: string;
  seller_company?: string;
  seller_vat_number?: string;
  seller_cr_number?: string;
  seller_address?: string;
  // Platform info (issuer)
  platform_name: string;
  platform_vat_number: string;
  platform_cr_number: string;
  platform_address: string;
  // Financial
  deal_value: number;
  commission_rate: number;
  net_amount: number;
  vat_amount: number;
  total: number;
  // Dates
  issue_date: string;
  due_date: string;
  // Status
  status: string;
  paid_at?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'PENDING / معلق',
  approved: 'APPROVED / معتمد',
  paid: 'PAID / مدفوع',
  disputed: 'DISPUTED / متنازع عليه',
  overdue: 'OVERDUE / متأخر',
};

export function InvoicePdf({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Muhandes HUB</Text>
            <Text style={styles.headerSubtitle}>منصة مقاول هب</Text>
            <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 4 }}>
              B2B Construction Marketplace
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 16, fontWeight: 700, color: colors.primary }}>
              TAX INVOICE
            </Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>
              فاتورة ضريبية
            </Text>
            {data.invoice_number && (
              <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4 }}>
                Invoice # {data.invoice_number}
              </Text>
            )}
          </View>
        </View>

        {/* ZATCA compliance header */}
        <View style={{
          backgroundColor: colors.primaryLight,
          padding: 10,
          borderRadius: 4,
          marginBottom: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{ fontSize: 7, fontWeight: 700, color: colors.textMuted }}>
              ISSUE DATE / تاريخ الإصدار
            </Text>
            <Text style={{ fontSize: 9, color: colors.text, marginTop: 2 }}>
              {formatPdfDate(data.issue_date)}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 7, fontWeight: 700, color: colors.textMuted }}>
              DUE DATE / تاريخ الاستحقاق
            </Text>
            <Text style={{ fontSize: 9, color: colors.text, marginTop: 2 }}>
              {formatPdfDate(data.due_date)}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 7, fontWeight: 700, color: colors.textMuted }}>
              STATUS / الحالة
            </Text>
            <Text style={{ fontSize: 9, fontWeight: 700, color: data.status === 'paid' ? colors.success : data.status === 'overdue' ? colors.destructive : colors.text, marginTop: 2 }}>
              {STATUS_LABELS[data.status] || data.status}
            </Text>
          </View>
        </View>

        {/* Parties: Issuer / Recipient */}
        <View style={styles.infoGrid}>
          {/* Issuer (Platform) */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>ISSUER / المُصدر</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: colors.text }}>
              {data.platform_name}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
              VAT #: {data.platform_vat_number}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>
              CR #: {data.platform_cr_number}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>
              {data.platform_address}
            </Text>
          </View>
          {/* Recipient (Seller) */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>BILL TO / فاتورة إلى</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, color: colors.text }}>
              {data.seller_company || '—'}
            </Text>
            {data.seller_vat_number && (
              <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
                VAT #: {data.seller_vat_number}
              </Text>
            )}
            {data.seller_cr_number && (
              <Text style={{ fontSize: 8, color: colors.textMuted }}>
                CR #: {data.seller_cr_number}
              </Text>
            )}
            {data.seller_address && (
              <Text style={{ fontSize: 8, color: colors.textMuted }}>
                {data.seller_address}
              </Text>
            )}
          </View>
        </View>

        {/* Deal Reference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deal Reference / مرجع الصفقة</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 8, color: colors.textMuted }}>Deal ID</Text>
              <Text style={{ fontSize: 9, color: colors.text }}>{data.deal_id.slice(0, 8)}...</Text>
            </View>
            {data.deal_title && (
              <View>
                <Text style={{ fontSize: 8, color: colors.textMuted }}>Deal Title</Text>
                <Text style={{ fontSize: 9, color: colors.text }}>{data.deal_title}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Commission Breakdown Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commission Details / تفاصيل العمولة</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '50%' }]}>Description / الوصف</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Rate / النسبة</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Amount / المبلغ</Text>
            </View>

            {/* Deal Value */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '50%' }]}>
                Deal Value / قيمة الصفقة
              </Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>—</Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>
                {formatPdfSAR(data.deal_value)}
              </Text>
            </View>

            {/* Commission */}
            <View style={styles.tableRowAlt}>
              <Text style={[styles.tableCell, { width: '50%' }]}>
                Platform Commission / عمولة المنصة
              </Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>
                {(data.commission_rate * 100).toFixed(0)}%
              </Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>
                {formatPdfSAR(data.net_amount)}
              </Text>
            </View>
          </View>

          {/* Totals */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Net Commission / صافي العمولة</Text>
              <Text style={styles.totalsValue}>{formatPdfSAR(data.net_amount)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT 15% / ضريبة القيمة المضافة ١٥٪</Text>
              <Text style={styles.totalsValue}>{formatPdfSAR(data.vat_amount)}</Text>
            </View>
            <View style={styles.totalsFinal}>
              <Text style={styles.totalsFinalLabel}>Total Due / الإجمالي المستحق</Text>
              <Text style={styles.totalsFinalValue}>{formatPdfSAR(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Info */}
        {data.paid_at && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information / معلومات الدفع</Text>
            <Text style={styles.paragraph}>
              Paid on: {formatPdfDate(data.paid_at)} | تم الدفع بتاريخ: {formatPdfDate(data.paid_at)}
            </Text>
          </View>
        )}

        {/* ZATCA Notice */}
        <View style={{
          marginTop: 20,
          padding: 10,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 4,
          backgroundColor: colors.muted,
        }}>
          <Text style={{ fontSize: 7, color: colors.textMuted, lineHeight: 1.4 }}>
            This is a tax invoice issued in accordance with the Value Added Tax (VAT) regulations
            of the Kingdom of Saudi Arabia as mandated by the Zakat, Tax and Customs Authority (ZATCA).
            VAT Registration Number: {data.platform_vat_number}
          </Text>
          <Text style={{ fontSize: 7, color: colors.textMuted, lineHeight: 1.4, marginTop: 4, textAlign: 'right', direction: 'rtl' }}>
            هذه فاتورة ضريبية صادرة وفقاً لأنظمة ضريبة القيمة المضافة في المملكة العربية السعودية
            وفقاً لما تقتضيه هيئة الزكاة والضريبة والجمارك. رقم التسجيل الضريبي: {data.platform_vat_number}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Muhandes HUB — B2B Construction Marketplace — منصة مقاول هب
          </Text>
          <Text style={styles.footerText}>
            VAT: {data.platform_vat_number}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
