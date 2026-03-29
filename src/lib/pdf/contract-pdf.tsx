// =============================================================================
// Muhandes HUB — Contract PDF Template
// =============================================================================

import React from 'react';
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { styles, colors, formatPdfDate } from './styles';

interface PartyInfo {
  name?: string;
  company_name_ar?: string;
  company_name_en?: string;
  cr_number?: string;
  vat_number?: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface Signature {
  name: string;
  title: string;
  signed_at: string;
}

interface Clause {
  title_ar?: string;
  title_en?: string;
  content_ar?: string;
  content_en?: string;
  category?: string;
}

interface ContractPdfData {
  template_type: string;
  status: string;
  party_a: PartyInfo;
  party_b: PartyInfo;
  scope_ar?: string;
  scope_en?: string;
  payment_terms_ar?: string;
  payment_terms_en?: string;
  timeline?: string;
  penalties_ar?: string;
  penalties_en?: string;
  warranty_ar?: string;
  warranty_en?: string;
  governing_law?: string;
  additional_clauses?: Clause[];
  signatures?: Signature[];
  created_at: string;
  qr_uuid?: string;
  qr_data_url?: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  construction_agreement: 'Construction Agreement / عقد إنشاءات',
  supply_agreement: 'Supply Agreement / عقد توريد',
  custom: 'Custom Agreement / عقد مخصص',
};

function PartySection({ party, label }: { party: PartyInfo; label: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      {party.company_name_ar && (
        <Text style={{ fontSize: 10, fontWeight: 700, color: colors.text, marginBottom: 2 }}>
          {party.company_name_ar}
        </Text>
      )}
      {party.company_name_en && (
        <Text style={{ fontSize: 9, color: colors.textMuted, marginBottom: 4 }}>
          {party.company_name_en}
        </Text>
      )}
      {party.name && (
        <Text style={{ fontSize: 9, color: colors.text }}>{party.name}</Text>
      )}
      {party.cr_number && (
        <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 2 }}>
          CR: {party.cr_number}
        </Text>
      )}
      {party.vat_number && (
        <Text style={{ fontSize: 8, color: colors.textMuted }}>
          VAT: {party.vat_number}
        </Text>
      )}
      {party.phone && (
        <Text style={{ fontSize: 8, color: colors.textMuted }}>
          Tel: {party.phone}
        </Text>
      )}
      {party.email && (
        <Text style={{ fontSize: 8, color: colors.textMuted }}>
          Email: {party.email}
        </Text>
      )}
    </View>
  );
}

function BilingualSection({ titleAr, titleEn, contentAr, contentEn }: {
  titleAr: string;
  titleEn: string;
  contentAr?: string;
  contentEn?: string;
}) {
  if (!contentAr && !contentEn) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{titleEn} / {titleAr}</Text>
      {contentAr && <Text style={styles.bilingualAr}>{contentAr}</Text>}
      {contentEn && <Text style={styles.bilingualEn}>{contentEn}</Text>}
    </View>
  );
}

export function ContractPdf({ data }: { data: ContractPdfData }) {
  const clauses = Array.isArray(data.additional_clauses) ? data.additional_clauses : [];
  const signatures = Array.isArray(data.signatures) ? data.signatures : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Muhandes HUB</Text>
            <Text style={styles.headerSubtitle}>منصة مقاول هب</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>
              {TEMPLATE_LABELS[data.template_type] || 'Contract / عقد'}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted, marginTop: 4 }}>
              Date: {formatPdfDate(data.created_at)}
            </Text>
            <View style={[
              styles.badge,
              data.status === 'signed' ? styles.badgeSuccess :
              data.status === 'sent' ? styles.badgePending :
              styles.badgeDraft,
              { marginTop: 4 },
            ]}>
              <Text>{data.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.infoGrid}>
          <PartySection party={data.party_a} label="PARTY A / الطرف الأول" />
          <PartySection party={data.party_b} label="PARTY B / الطرف الثاني" />
        </View>

        {/* Contract Content */}
        <BilingualSection
          titleAr="نطاق العمل"
          titleEn="Scope of Work"
          contentAr={data.scope_ar}
          contentEn={data.scope_en}
        />

        <BilingualSection
          titleAr="شروط الدفع"
          titleEn="Payment Terms"
          contentAr={data.payment_terms_ar}
          contentEn={data.payment_terms_en}
        />

        {data.timeline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline / الجدول الزمني</Text>
            <Text style={styles.paragraph}>{data.timeline}</Text>
          </View>
        )}

        <BilingualSection
          titleAr="الغرامات"
          titleEn="Penalties"
          contentAr={data.penalties_ar}
          contentEn={data.penalties_en}
        />

        <BilingualSection
          titleAr="الضمان"
          titleEn="Warranty"
          contentAr={data.warranty_ar}
          contentEn={data.warranty_en}
        />

        {/* Governing Law */}
        {data.governing_law && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Governing Law / القانون الحاكم</Text>
            <Text style={styles.paragraph}>{data.governing_law}</Text>
          </View>
        )}

        {/* Additional Clauses */}
        {clauses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Clauses / بنود إضافية</Text>
            {clauses.map((clause, i) => (
              <View key={i} style={{ marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: colors.text, marginBottom: 2 }}>
                  {i + 1}. {clause.title_ar || clause.title_en || `Clause ${i + 1}`}
                  {clause.category && (
                    ` (${clause.category})`
                  )}
                </Text>
                {clause.content_ar && (
                  <Text style={styles.bilingualAr}>{clause.content_ar}</Text>
                )}
                {clause.content_en && (
                  <Text style={styles.bilingualEn}>{clause.content_en}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Signatures */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>Signatures / التوقيعات</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            {/* Party A Signature */}
            <View style={styles.signatureBlock}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: colors.textMuted, marginBottom: 6 }}>
                PARTY A / الطرف الأول
              </Text>
              {signatures[0] ? (
                <View>
                  <Text style={styles.signatureName}>{signatures[0].name}</Text>
                  <Text style={styles.signatureTitle}>{signatures[0].title}</Text>
                  <Text style={[styles.badge, styles.badgeSuccess, { alignSelf: 'flex-start' }]}>
                    SIGNED
                  </Text>
                  <Text style={styles.signatureDate}>
                    {formatPdfDate(signatures[0].signed_at)}
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.signatureLine} />
                  <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 4 }}>
                    Name / الاسم
                  </Text>
                  <View style={[styles.signatureLine, { marginTop: 10 }]} />
                  <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 4 }}>
                    Date / التاريخ
                  </Text>
                </View>
              )}
            </View>

            {/* Party B Signature */}
            <View style={styles.signatureBlock}>
              <Text style={{ fontSize: 8, fontWeight: 700, color: colors.textMuted, marginBottom: 6 }}>
                PARTY B / الطرف الثاني
              </Text>
              {signatures[1] ? (
                <View>
                  <Text style={styles.signatureName}>{signatures[1].name}</Text>
                  <Text style={styles.signatureTitle}>{signatures[1].title}</Text>
                  <Text style={[styles.badge, styles.badgeSuccess, { alignSelf: 'flex-start' }]}>
                    SIGNED
                  </Text>
                  <Text style={styles.signatureDate}>
                    {formatPdfDate(signatures[1].signed_at)}
                  </Text>
                </View>
              ) : (
                <View>
                  <View style={styles.signatureLine} />
                  <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 4 }}>
                    Name / الاسم
                  </Text>
                  <View style={[styles.signatureLine, { marginTop: 10 }]} />
                  <Text style={{ fontSize: 7, color: colors.textMuted, marginTop: 4 }}>
                    Date / التاريخ
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* QR Verification */}
        {data.qr_uuid && (
          <View style={{ marginTop: 10, alignItems: 'center' }}>
            {data.qr_data_url && (
              <Image src={data.qr_data_url} style={{ width: 80, height: 80, marginBottom: 4 }} />
            )}
            <Text style={{ fontSize: 7, color: colors.textMuted }}>
              Verify this contract at / تحقق من هذا العقد على:
            </Text>
            <Text style={{ fontSize: 8, color: colors.primary, marginTop: 2 }}>
              muqawilhub.com/verify/{data.qr_uuid}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Muhandes HUB — B2B Construction Marketplace — منصة مقاول هب
          </Text>
          <Text style={styles.footerText}>
            {formatPdfDate(data.created_at)}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
