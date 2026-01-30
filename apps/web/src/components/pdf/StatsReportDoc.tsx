import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    padding: 50, 
    fontFamily: 'Helvetica', 
    fontSize: 10, 
    color: '#1f2937',
    backgroundColor: '#ffffff'
  },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 30, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#d1d5db', 
    paddingBottom: 15 
  },
  logoConfig: { 
    width: 100, 
    height: 50, 
    objectFit: 'contain' 
  },
  titleBlock: { 
    textAlign: 'right' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: '#111827',
    letterSpacing: -0.5
  },
  subtitle: { 
    fontSize: 9, 
    color: '#6b7280', 
    marginTop: 4 
  },

  // Títulos de seção 
  sectionTitle: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#374151', 
    marginTop: 24, 
    marginBottom: 12, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#e5e7eb', 
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  
  // KPIs 
  kpiContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 24,
    gap: 12
  },
  kpiBox: { 
    flex: 1,
    padding: 16, 
    backgroundColor: '#f9fafb',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 4
  },
  kpiValue: { 
    fontSize: 28, 
    fontWeight: 'bold',
    marginBottom: 4
  },
  kpiLabel: { 
    fontSize: 8, 
    textTransform: 'uppercase', 
    color: '#6b7280',
    letterSpacing: 0.5
  },

  // Gráfico de Barras
  chartRow: { 
    marginBottom: 10 
  },
  chartLabelRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  chartLabel: { 
    fontSize: 9, 
    color: '#4b5563'
  },
  chartValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937'
  },
  chartBarContainer: { 
    height: 10, 
    backgroundColor: '#f3f4f6', 
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#e5e7eb'
  },
  chartBarFill: { 
    height: '100%' 
  },

  // Filtros 
  filtersBox: {
    marginBottom: 24,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e5e7eb'
  },
  filtersText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4
  },

  // Distribuição de severidade 
  severityContainer: {
    flexDirection: 'row',
    gap: 12
  },
  severityCard: {
    flex: 1,
    padding: 14,
    borderRadius: 4,
    borderWidth: 0.5
  },
  severityTitle: {
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 6
  },
  severityDescription: {
    fontSize: 8,
    lineHeight: 1.3
  },

  // Tabela de casos críticos 
  criticalSection: {
    marginTop: 24
  },
  criticalTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#fca5a5',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fca5a5',
    borderTopWidth: 0.5,
    borderTopColor: '#fca5a5'
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#7f1d1d',
    textTransform: 'uppercase',
    letterSpacing: 0.3
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6'
  },
  tableRowAlt: {
    backgroundColor: '#fefefe'
  },
  tableCell: {
    fontSize: 8
  },
  tableCellBold: {
    fontWeight: 'bold'
  },
  tableCellCritical: {
    color: '#991b1b',
    fontWeight: 'bold'
  },

  // Footer 
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 50, 
    right: 50, 
    textAlign: 'center', 
    fontSize: 8, 
    color: '#9ca3af', 
    borderTopWidth: 0.5, 
    borderTopColor: '#e5e7eb', 
    paddingTop: 8 
  }
});

// --- TIPAGEM ---
export interface PathologyItem {
  label: string;
  count: number;
  key: string;
}

export interface CriticalAnimal {
  id: string;
  tag: string;
  farm: string;
  location: string;
  diagnosis: string;
  date: string;
}

export interface ReportStatsData {
  general: {
    total: number;
    totalLesions: number;
    healthy: number;
    moderate: number;
    critical: number;
    healthyPercentage: string;
    moderatePercentage: string;
    criticalPercentage: string;
  };
  pathologies: Record<string, PathologyItem>;
  criticalAnimals?: CriticalAnimal[]; 
}

interface Props {
  stats: ReportStatsData;      
  pathologyList: PathologyItem[]; 
  filters: {
    farm: string;
    client: string;
    period: string;
  };
  user: { name: string };
}

export const StatsReportDoc = ({ stats, pathologyList, filters, user }: Props) => {
  const total = stats.general.total || 1;

  const getPathologyColor = (index: number) => {
    const colors = [
      '#3b82f6', 
      '#10b981', 
      '#f59e0b', 
      '#ef4444', 
      '#8b5cf6', 
      '#ec4899', 
      '#06b6d4', 
      '#f97316', 
    ];
    return colors[index % colors.length];
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER  */}
        <View style={styles.header}>
          <Image src="/logoFull.png" style={styles.logoConfig} />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Relatório Gerencial</Text>
            <Text style={styles.subtitle}>Gerado por: {user.name}</Text>
            <Text style={styles.subtitle}>Data: {new Date().toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        {/* FILTROS APLICADOS */}
        <View style={styles.filtersBox}>
          <Text style={styles.filtersText}>
            FILTROS APLICADOS: Fazenda ({filters.farm === 'all' ? 'Todas' : filters.farm}) • 
            Cliente ({filters.client === 'all' ? 'Todos' : filters.client}) • 
            Período ({filters.period} dias)
          </Text>
        </View>

        {/* KPIs  */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiValue, { color: '#1f2937' }]}>{stats.general.total}</Text>
            <Text style={styles.kpiLabel}>Animais Avaliados</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{stats.general.healthyPercentage}%</Text>
            <Text style={styles.kpiLabel}>Índice de Saúde</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiValue, { color: '#dc2626' }]}>{stats.general.totalLesions}</Text>
            <Text style={styles.kpiLabel}>Total de Lesões</Text>
          </View>
        </View>

        {/* GRÁFICO DE PATOLOGIAS */}
        <Text style={styles.sectionTitle}>Principais Patologias Identificadas</Text>
        <View>
          {pathologyList.map((item, index) => {
            const percent = (item.count / total) * 100;
            const widthPercent = percent > 100 ? 100 : percent; 
            
            return (
              <View key={item.key} style={styles.chartRow}>
                <View style={styles.chartLabelRow}>
                  <Text style={styles.chartLabel}>{item.label}</Text>
                  <Text style={styles.chartValue}>{item.count} ({percent.toFixed(1)}%)</Text>
                </View>
                <View style={styles.chartBarContainer}>
                  <View 
                    style={[
                      styles.chartBarFill, 
                      { width: `${widthPercent}%`, backgroundColor: getPathologyColor(index) }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
          {pathologyList.length === 0 && (
            <Text style={{ fontSize: 9, color: '#6b7280', fontStyle: 'italic' }}>
              Nenhum dado registrado no período selecionado.
            </Text>
          )}
        </View>

        {/* DISTRIBUIÇÃO DE SEVERIDADE */}
        <Text style={styles.sectionTitle}>Distribuição por Severidade</Text>
        <View style={styles.severityContainer}>
          <View style={[styles.severityCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
            <Text style={[styles.severityTitle, { color: '#166534' }]}>
              Saudáveis: {stats.general.healthyPercentage}%
            </Text>
            <Text style={[styles.severityDescription, { color: '#15803d' }]}>
              Animais sem necessidade de intervenção imediata.
            </Text>
          </View>
          <View style={[styles.severityCard, { backgroundColor: '#fffbeb', borderColor: '#fde047' }]}>
            <Text style={[styles.severityTitle, { color: '#92400e' }]}>
              Moderados: {stats.general.moderatePercentage}%
            </Text>
            <Text style={[styles.severityDescription, { color: '#a16207' }]}>
              Animais que requerem acompanhamento regular.
            </Text>
          </View>
          <View style={[styles.severityCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
            <Text style={[styles.severityTitle, { color: '#991b1b' }]}>
              Críticos: {stats.general.criticalPercentage}%
            </Text>
            <Text style={[styles.severityDescription, { color: '#b91c1c' }]}>
              Tratamento imediato necessário.
            </Text>
          </View>
        </View>

        {/* CASOS CRÍTICOS - ATENÇÃO IMEDIATA */}
        {stats.criticalAnimals && stats.criticalAnimals.length > 0 && (
          <View break={false} style={styles.criticalSection}>
            <Text style={styles.criticalTitle}>
              Atenção Imediata - Casos Críticos
            </Text>
            
            {/* Cabeçalho da Tabela */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '18%' }]}>Brinco</Text>
              <Text style={[styles.tableHeaderText, { width: '28%' }]}>Localização</Text>
              <Text style={[styles.tableHeaderText, { width: '34%' }]}>Diagnóstico</Text>
              <Text style={[styles.tableHeaderText, { width: '20%' }]}>Data</Text>
            </View>

            {/* Linhas da Tabela */}
            {stats.criticalAnimals.map((animal, i) => (
              <View 
                key={i} 
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.tableCellBold, { width: '18%' }]}>
                  {animal.tag}
                </Text>
                <Text style={[styles.tableCell, { width: '28%', color: '#4b5563' }]}>
                  {animal.location} - {animal.farm}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellCritical, { width: '34%' }]}>
                  {animal.diagnosis}
                </Text>
                <Text style={[styles.tableCell, { width: '20%', color: '#6b7280' }]}>
                  {new Date(animal.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* FOOTER  */}
        <View style={styles.footer}>
          <Text>VirtualVet - Sistema de Gestão de Saúde Animal</Text>
        </View>
      </Page>
    </Document>
  );
};