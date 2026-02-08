import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Registrar fontes
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

// --- INTERFACES ---
export interface ToothData {
  toothCode: string;
  toothType?: string;
  fractureLevel: number;
  pulpitis: number;
  gingivalRecessionLevel: number;
  caries: number;
  crownReductionLevel: number;
  dentalCalculus: number;
  periodontalLesions: number;
  lingualWear: number;
  vitrifiedBorder: number;
  pulpChamberExposure: number;
  gingivitisEdema: number;
  gingivitisColor: number;
  abnormalColor: number;
}

export interface ReportData {
  id: string;
  evaluationDate: string;
  generalObservations: string;
  animal: {
    tagCode: string;
    breed: string;
    age: number;
    client: string;
    farm: string;
    chip?: string;
    sisbovNumber?: string;
    currentWeight?: number;
    lot?: string;
    location?: string;
  };
  evaluator: {
    fullName: string;
  };
  teeth: ToothData[];
}

// [NOVO] Adicionado user para receber quem está emitindo
interface ReportProps {
  data: ReportData;
  user?: { name: string };
}

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
    borderBottomColor: "#0F766E",
    paddingBottom: 15,
    alignItems: "center",
  },
  logoConfig: { width: 80, height: 60, objectFit: "contain" },
  titleBlock: { flex: 1, paddingHorizontal: 20 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F766E",
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 9, color: "#6b7280", marginTop: 4 },

  section: { marginBottom: 15 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0F766E",
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 100, fontWeight: "bold", color: "#4b5563", fontSize: 9 },
  value: { flex: 1, fontSize: 9, color: "#1f2937" },

  chronologyContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f9ff",
    borderWidth: 0.5,
    borderColor: "#0ea5e9",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chronologyLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0369a1",
    textTransform: "uppercase",
  },
  chronologyValue: { fontSize: 11, fontWeight: "bold", color: "#0c4a6e" },

  teethContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 5,
  },
  toothCard: {
    width: "48%",
    borderWidth: 0.5,
    borderColor: "#fca5a5",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#fef2f2",
  },
  toothTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#991b1b",
    borderBottomWidth: 0.5,
    borderBottomColor: "#fca5a5",
    paddingBottom: 2,
    fontSize: 10,
  },
  pathologyText: { fontSize: 8, marginBottom: 3, color: "#7f1d1d" },
  pathologyTextBold: { fontWeight: "bold", color: "#b91c1c" },

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

export const DentalReportDoc = ({ data, user }: ReportProps) => {
  const animal = data.animal || {
    tagCode: "",
    breed: "",
    age: 0,
    client: "",
    farm: "",
  };
  const teeth = data.teeth || [];
  const evaluator = data.evaluator || { fullName: "" };

  const incisors = teeth.filter((t) => t.toothCode.startsWith("I"));
  const permanentCount = incisors.filter(
    (t) => t.toothType === "PERMANENT",
  ).length;

  let chronologyLabel = "Dente de Leite (DL)";
  if (permanentCount > 0 && permanentCount <= 2)
    chronologyLabel = "2 Dentes (2D)";
  else if (permanentCount > 2 && permanentCount <= 4)
    chronologyLabel = "4 Dentes (4D)";
  else if (permanentCount > 4 && permanentCount <= 6)
    chronologyLabel = "6 Dentes (6D)";
  else if (permanentCount >= 7) chronologyLabel = "Boca Cheia (8D)";

  const unhealthyTeeth = teeth.filter((t: ToothData) => {
    return (
      t.fractureLevel > 0 ||
      t.pulpitis > 0 ||
      t.gingivalRecessionLevel > 0 ||
      t.caries > 0 ||
      t.crownReductionLevel > 0 ||
      t.dentalCalculus > 0 ||
      t.periodontalLesions > 0 ||
      t.lingualWear > 0 ||
      t.vitrifiedBorder > 0 ||
      t.pulpChamberExposure > 0 ||
      t.gingivitisEdema > 0 ||
      (t.abnormalColor && t.abnormalColor > 0)
    );
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Image src="/logoFull.png" style={styles.logoConfig} />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Laudo Odontológico Individual</Text>

            {/* Linha 1: Dados da Avaliação */}
            <Text style={styles.subtitle}>
              Ref: #{data.id} • Avaliado em:{" "}
              {new Date(data.evaluationDate).toLocaleDateString("pt-BR")}
            </Text>

            {/* Linha 2: QUEM ESTÁ EMITINDO (NOVO) */}
            <Text style={styles.subtitle}>
              Emissão: {new Date().toLocaleDateString("pt-BR")} por{" "}
              {user?.name || "Sistema"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do Animal</Text>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.label}>N° Animal (Brinco):</Text>
                <Text style={[styles.value, { fontWeight: "bold" }]}>
                  {animal.tagCode}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Raça:</Text>
                <Text style={styles.value}>{animal.breed}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Idade (meses):</Text>
                <Text style={styles.value}>{animal.age || "N/I"}</Text>
              </View>
              {animal.currentWeight && (
                <View style={styles.row}>
                  <Text style={styles.label}>Peso Atual:</Text>
                  <Text style={styles.value}>{animal.currentWeight} kg</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              {animal.sisbovNumber && (
                <View style={styles.row}>
                  <Text style={styles.label}>SISBOV:</Text>
                  <Text style={styles.value}>{animal.sisbovNumber}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Local/Lote:</Text>
                <Text style={styles.value}>
                  {animal.location || ""} {animal.lot ? `- ${animal.lot}` : ""}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Fazenda:</Text>
                <Text style={styles.value}>{animal.farm || "N/I"}</Text>
              </View>
              {animal.client && (
                <View style={styles.row}>
                  <Text style={styles.label}>Cliente:</Text>
                  <Text style={styles.value}>{animal.client}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.chronologyContainer}>
            <View>
              <Text style={styles.chronologyLabel}>CRONOLOGIA DENTÁRIA</Text>
              <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>
                Baseada na erupção dos incisivos permanentes
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.chronologyValue}>{chronologyLabel}</Text>
              <Text style={{ fontSize: 8, color: "#0369a1" }}>
                {permanentCount} dentes permanentes
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Clínico</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Veterinário:</Text>
            <Text style={styles.value}>
              {evaluator.fullName || "Não Identificado"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Observações:</Text>
            <Text style={[styles.value, { fontStyle: "italic" }]}>
              {data.generalObservations ||
                "Sem observações adicionais registradas."}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patologias Identificadas</Text>
          {unhealthyTeeth.length > 0 ? (
            <View style={styles.teethContainer}>
              {unhealthyTeeth.map((t, i) => (
                <View key={i} style={styles.toothCard}>
                  <Text style={styles.toothTitle}>Dente {t.toothCode}</Text>
                  {t.fractureLevel > 0 && (
                    <Text style={styles.pathologyText}>
                      • Fratura: Grau {t.fractureLevel}
                    </Text>
                  )}
                  {t.pulpitis > 0 && (
                    <Text style={styles.pathologyText}>
                      • Pulpite: Grau {t.pulpitis}
                    </Text>
                  )}
                  {t.gingivalRecessionLevel > 0 && (
                    <Text style={styles.pathologyText}>
                      • Recessão Gengival: Grau {t.gingivalRecessionLevel}
                    </Text>
                  )}
                  {t.caries > 0 && (
                    <Text style={styles.pathologyText}>• Cárie Detectada</Text>
                  )}
                  {t.crownReductionLevel > 0 && (
                    <Text style={styles.pathologyText}>
                      • Redução de Coroa: Grau {t.crownReductionLevel}
                    </Text>
                  )}
                  {t.dentalCalculus > 0 && (
                    <Text style={styles.pathologyText}>
                      • Cálculo Dentário: Grau {t.dentalCalculus}
                    </Text>
                  )}
                  {t.periodontalLesions > 0 && (
                    <Text style={styles.pathologyText}>
                      • Lesão Periodontal: Grau {t.periodontalLesions}
                    </Text>
                  )}
                  {t.lingualWear > 0 && (
                    <Text style={styles.pathologyText}>
                      • Desgaste Lingual: Grau {t.lingualWear}
                    </Text>
                  )}
                  {t.vitrifiedBorder > 0 && (
                    <Text style={styles.pathologyText}>
                      • Bordo Vitrificado
                    </Text>
                  )}
                  {t.pulpChamberExposure > 0 && (
                    <Text
                      style={[styles.pathologyText, styles.pathologyTextBold]}
                    >
                      • Exp. Câmara Pulpar (CRÍTICO)
                    </Text>
                  )}
                  {t.gingivitisEdema > 0 && (
                    <Text style={styles.pathologyText}>• Edema Gengival</Text>
                  )}
                  {t.abnormalColor > 0 && (
                    <Text style={styles.pathologyText}>
                      • Coloração Anormal
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View
              style={{
                padding: 15,
                backgroundColor: "#f0fdf4",
                borderWidth: 0.5,
                borderColor: "#86efac",
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  color: "#166534",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Nenhuma patologia identificada.
              </Text>
              <Text
                style={{
                  color: "#15803d",
                  textAlign: "center",
                  fontSize: 9,
                  marginTop: 4,
                }}
              >
                Os dentes avaliados encontram-se dentro dos padrões de
                normalidade.
              </Text>
            </View>
          )}
        </View>

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
