// apps/web/src/components/pdf/StatsReportDoc.tsx
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Registrar fontes para garantir acentuação correta
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf",
    },
    {
      src: "https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#0F766E", // Cor da marca
    paddingBottom: 15,
    alignItems: "center",
  },
  logoConfig: {
    width: 80,
    height: 60,
    objectFit: "contain",
  },
  titleBlock: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F766E",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 4,
  },

  // Títulos de seção
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F766E",
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // KPIs
  kpiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f9fafb",
    borderWidth: 0.5,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 7,
    textTransform: "uppercase",
    color: "#6b7280",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  // Gráfico de Barras
  chartRow: {
    marginBottom: 8,
  },
  chartLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  chartLabel: {
    fontSize: 8,
    color: "#4b5563",
  },
  chartValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1f2937",
  },
  chartBarContainer: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    overflow: "hidden",
  },
  chartBarFill: {
    height: "100%",
  },

  // Distribuição de severidade
  severityContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
  },
  severityCard: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  severityTitle: {
    fontWeight: "bold",
    fontSize: 9,
    marginBottom: 4,
  },
  severityDescription: {
    fontSize: 7,
    lineHeight: 1.2,
  },

  // Tabela de casos críticos
  criticalSection: {
    marginTop: 15,
  },
  criticalTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#991b1b",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#fca5a5",
    textTransform: "uppercase",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#fca5a5",
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#7f1d1d",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  tableRowAlt: {
    backgroundColor: "#fffafa",
  },
  tableCell: {
    fontSize: 7,
  },
  tableCellBold: {
    fontWeight: "bold",
  },
  tableCellCritical: {
    color: "#991b1b",
    fontWeight: "bold",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#9ca3af",
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
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
  // [NOVO] Adicionado suporte para cronologia
  chronology?: Record<string, PathologyItem>;
  criticalAnimals?: CriticalAnimal[];
}

// --- INTERFACE DE OPÇÕES ---
export interface StatsReportOptions {
  showGeneralStats: boolean;
  showPathologyList: boolean;
  // [NOVO] Opção para exibir cronologia
  showChronology?: boolean;
  showCriticalList: boolean;
  clientLogo?: string | null;
  clientName?: string;
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
  options: StatsReportOptions;
}

export const StatsReportDoc = ({
  stats,
  pathologyList,
  filters,
  user,
  options,
}: Props) => {
  const total = stats.general.total || 1;

  // Cor para Patologias
  const getPathologyColor = (index: number) => {
    const colors = [
      "#0F766E",
      "#ef4444",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#3b82f6",
      "#10b981",
      "#6366f1",
      "#f97316",
      "#14b8a6",
    ];
    return colors[index % colors.length];
  };

  const getChronologyColor = (index: number) => {
    const colors = ["#0ea5e9", "#0284c7", "#0369a1", "#075985", "#0c4a6e"];
    return colors[index % colors.length];
  };

  // Lógica de processamento da Cronologia
  const chronOrder = ["dl", "2d", "4d", "6d", "8d"];
  const chronologyList = stats.chronology
    ? Object.values(stats.chronology).sort(
        (a, b) => chronOrder.indexOf(a.key) - chronOrder.indexOf(b.key),
      )
    : [];

  // Define padrão true para showChronology se não for passado
  const showChronology = options.showChronology !== false;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image src="/logoFull.png" style={styles.logoConfig} />

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Relatório Gerencial</Text>
            {options.clientName && (
              <Text style={{ fontSize: 10, marginTop: 2, fontWeight: "bold" }}>
                Cliente: {options.clientName}
              </Text>
            )}
            <Text style={styles.subtitle}>
              Filtros:{" "}
              {filters.farm !== "all" ? filters.farm : "Todas Fazendas"} •{" "}
              {filters.period} dias
            </Text>
            <Text style={styles.subtitle}>
              Emissão: {new Date().toLocaleDateString("pt-BR")} por {user.name}
            </Text>
          </View>

          {options.clientLogo ? (
            <Image src={options.clientLogo} style={styles.logoConfig} />
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {/* 1. KPIs */}
        {options.showGeneralStats && (
          <>
            <View style={styles.kpiContainer}>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiValue, { color: "#1f2937" }]}>
                  {stats.general.total}
                </Text>
                <Text style={styles.kpiLabel}>Animais Avaliados</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiValue, { color: "#059669" }]}>
                  {stats.general.healthyPercentage}%
                </Text>
                <Text style={styles.kpiLabel}>Índice de Saúde</Text>
              </View>
              <View style={styles.kpiBox}>
                <Text style={[styles.kpiValue, { color: "#dc2626" }]}>
                  {stats.general.totalLesions}
                </Text>
                <Text style={styles.kpiLabel}>Total de Lesões</Text>
              </View>
            </View>

            {/* SEVERIDADE */}
            <Text style={styles.sectionTitle}>Distribuição por Severidade</Text>
            <View style={styles.severityContainer}>
              <View
                style={[
                  styles.severityCard,
                  { backgroundColor: "#f0fdf4", borderColor: "#86efac" },
                ]}
              >
                <Text style={[styles.severityTitle, { color: "#166534" }]}>
                  Saudáveis: {stats.general.healthyPercentage}%
                </Text>
                <Text
                  style={[styles.severityDescription, { color: "#15803d" }]}
                >
                  Animais sem necessidade de intervenção imediata.
                </Text>
              </View>
              <View
                style={[
                  styles.severityCard,
                  { backgroundColor: "#fffbeb", borderColor: "#fde047" },
                ]}
              >
                <Text style={[styles.severityTitle, { color: "#92400e" }]}>
                  Moderados: {stats.general.moderatePercentage}%
                </Text>
                <Text
                  style={[styles.severityDescription, { color: "#a16207" }]}
                >
                  Animais que requerem acompanhamento regular.
                </Text>
              </View>
              <View
                style={[
                  styles.severityCard,
                  { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
                ]}
              >
                <Text style={[styles.severityTitle, { color: "#991b1b" }]}>
                  Críticos: {stats.general.criticalPercentage}%
                </Text>
                <Text
                  style={[styles.severityDescription, { color: "#b91c1c" }]}
                >
                  Tratamento imediato necessário.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* 2. CRONOLOGIA DENTÁRIA (NOVA SEÇÃO) */}
        {showChronology && chronologyList.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              Cronologia Dentária (Idade Estimada)
            </Text>
            <View>
              {chronologyList.map((item, index) => {
                const percent = (item.count / total) * 100;
                const widthPercent = percent > 100 ? 100 : percent;

                return (
                  <View key={item.key} style={styles.chartRow}>
                    <View style={styles.chartLabelRow}>
                      <Text style={styles.chartLabel}>{item.label}</Text>
                      <Text style={styles.chartValue}>
                        {item.count} ({percent.toFixed(1)}%)
                      </Text>
                    </View>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            width: `${widthPercent}%`,
                            backgroundColor: getChronologyColor(index),
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* 3. GRÁFICO DE PATOLOGIAS */}
        {options.showPathologyList && (
          <>
            <Text style={styles.sectionTitle}>
              Principais Patologias Identificadas
            </Text>
            <View>
              {pathologyList.map((item, index) => {
                const percent = (item.count / total) * 100;
                const widthPercent = percent > 100 ? 100 : percent;

                return (
                  <View key={item.key} style={styles.chartRow}>
                    <View style={styles.chartLabelRow}>
                      <Text style={styles.chartLabel}>{item.label}</Text>
                      <Text style={styles.chartValue}>
                        {item.count} ({percent.toFixed(1)}%)
                      </Text>
                    </View>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBarFill,
                          {
                            width: `${widthPercent}%`,
                            backgroundColor: getPathologyColor(index),
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
              {pathologyList.length === 0 && (
                <Text
                  style={{ fontSize: 9, color: "#6b7280", fontStyle: "italic" }}
                >
                  Nenhum dado registrado no período selecionado.
                </Text>
              )}
            </View>
          </>
        )}

        {/* 4. CASOS CRÍTICOS */}
        {options.showCriticalList &&
          stats.criticalAnimals &&
          stats.criticalAnimals.length > 0 && (
            <View break={false} style={styles.criticalSection}>
              <Text style={styles.criticalTitle}>
                Atenção Imediata - Casos Críticos (Top 5)
              </Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { width: "20%" }]}>
                  Brinco
                </Text>
                <Text style={[styles.tableHeaderText, { width: "30%" }]}>
                  Localização
                </Text>
                <Text style={[styles.tableHeaderText, { width: "35%" }]}>
                  Diagnóstico
                </Text>
                <Text style={[styles.tableHeaderText, { width: "15%" }]}>
                  Data
                </Text>
              </View>

              {stats.criticalAnimals.map((animal, i) => (
                <View
                  key={i}
                  style={[
                    styles.tableRow,
                    i % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableCellBold,
                      { width: "20%" },
                    ]}
                  >
                    {animal.tag}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "30%", color: "#4b5563" },
                    ]}
                  >
                    {animal.farm} / {animal.location}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableCellCritical,
                      { width: "35%" },
                    ]}
                  >
                    {animal.diagnosis}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: "15%", color: "#6b7280" },
                    ]}
                  >
                    {new Date(animal.date).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
              ))}
            </View>
          )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>
            Relatório gerado pelo sistema VirtualVet - A saúde bucal impacta a
            produtividade.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
