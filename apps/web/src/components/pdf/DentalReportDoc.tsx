import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// 1. Interface com todas as patologias e dados da API externa
export interface ToothData {
  toothCode: string;
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

interface ReportProps {
  data: ReportData;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
  logoConfig: { width: 120, height: 50, objectFit: 'contain' }, 
  titleBlock: { textAlign: 'right' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1976d2' },
  subtitle: { fontSize: 10, color: '#666' },
  
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, backgroundColor: '#f0f5f9', padding: 5 },
  
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 110, fontWeight: 'bold', color: '#555' }, 
  value: { flex: 1 },

  teethContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toothCard: { 
    width: '48%', 
    borderWidth: 1.5, 
    borderStyle: 'solid', 
    borderColor: '#d32f2f', 
    borderRadius: 4,
    padding: 8, 
    marginBottom: 8, 
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  toothTitle: { 
    fontWeight: 'bold', 
    marginBottom: 6, 
    color: '#fff', 
    backgroundColor: '#d32f2f',
    padding: 4,
    borderRadius: 2,
    fontSize: 10
  },
  pathologyText: { fontSize: 9, marginBottom: 2, color: '#333' },

  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#aaa', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 }
});

export const DentalReportDoc = ({ data }: ReportProps) => {
  const animal = data.animal || { tagCode: '', breed: '', age: 0, client: '', farm: '' };
  const teeth = data.teeth || [];
  const evaluator = data.evaluator || { fullName: '' };

  // Filtro que verifica QUALQUER problema > 0
  const unhealthyTeeth = teeth.filter((t: ToothData) => {
    return (
        t.fractureLevel > 0 || t.pulpitis > 0 || t.gingivalRecessionLevel > 0 || t.caries > 0 ||
        t.crownReductionLevel > 0 || t.dentalCalculus > 0 || t.periodontalLesions > 0 || 
        t.lingualWear > 0 || t.vitrifiedBorder > 0 || t.pulpChamberExposure > 0 || 
        t.gingivitisEdema > 0 || (t.abnormalColor && t.abnormalColor > 0)
    );
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Image src="/logoFull.png" style={styles.logoConfig} />
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Laudo Odontológico</Text>
            <Text style={styles.subtitle}>Ref: #{data.id} - {new Date(data.evaluationDate).toLocaleDateString('pt-BR')}</Text>
          </View>
        </View>

        {/* DADOS DO ANIMAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação do Animal</Text>
          
          <View style={{ flexDirection: 'row' }}>
              {/* Coluna 1 */}
              <View style={{ flex: 1 }}>
                  <View style={styles.row}><Text style={styles.label}>N° Animal (Brinco):</Text><Text style={styles.value}>{animal.tagCode}</Text></View>
                  <View style={styles.row}><Text style={styles.label}>Raça:</Text><Text style={styles.value}>{animal.breed}</Text></View>
                  <View style={styles.row}><Text style={styles.label}>Idade (meses):</Text><Text style={styles.value}>{animal.age || 'N/I'}</Text></View>
                  {animal.currentWeight && (
                    <View style={styles.row}><Text style={styles.label}>Peso Atual:</Text><Text style={styles.value}>{animal.currentWeight} kg</Text></View>
                  )}
              </View>
              {/* Coluna 2 */}
              <View style={{ flex: 1 }}>
                  {animal.sisbovNumber && (
                    <View style={styles.row}><Text style={styles.label}>SISBOV:</Text><Text style={styles.value}>{animal.sisbovNumber}</Text></View>
                  )}
                  {animal.chip && (
                    <View style={styles.row}><Text style={styles.label}>Chip:</Text><Text style={styles.value}>{animal.chip}</Text></View>
                  )}
                  <View style={styles.row}><Text style={styles.label}>Local/Lote:</Text><Text style={styles.value}>{animal.location || ''} {animal.lot ? `- ${animal.lot}` : ''}</Text></View>
                  <View style={styles.row}><Text style={styles.label}>Centro de Custo:</Text><Text style={styles.value}>{animal.farm || 'N/I'}</Text></View>
              </View>
          </View>
        </View>

        {/* DIAGNÓSTICO GERAL */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Resumo Clínico</Text>
           <View style={styles.row}>
             <Text style={styles.label}>Avaliador:</Text>
             <Text style={styles.value}>{evaluator.fullName || 'Veterinário Responsável'}</Text>
           </View>
           <View style={styles.row}>
             <Text style={styles.label}>Observações:</Text>
             <Text style={styles.value}>{data.generalObservations || 'Sem observações gerais.'}</Text>
           </View>
        </View>

        {/* DETALHES DOS DENTES */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patologias Identificadas</Text>
            {unhealthyTeeth.length > 0 ? (
                <View style={styles.teethContainer}>
                    {unhealthyTeeth.map((t, i) => (
                        <View key={i} style={styles.toothCard}>
                            <Text style={styles.toothTitle}>Dente {t.toothCode}</Text>
                            
                            {t.fractureLevel > 0 && <Text style={styles.pathologyText}>• Fratura: Grau {t.fractureLevel}</Text>}
                            {t.pulpitis > 0 && <Text style={styles.pathologyText}>• Pulpite: Grau {t.pulpitis}</Text>}
                            {t.gingivalRecessionLevel > 0 && <Text style={styles.pathologyText}>• Recessão Gengival: Grau {t.gingivalRecessionLevel}</Text>}
                            {t.caries > 0 && <Text style={styles.pathologyText}>• Cárie Detectada</Text>}
                            
                            {t.crownReductionLevel > 0 && <Text style={styles.pathologyText}>• Redução de Coroa: Grau {t.crownReductionLevel}</Text>}
                            {t.dentalCalculus > 0 && <Text style={styles.pathologyText}>• Cálculo Dentário: Grau {t.dentalCalculus}</Text>}
                            {t.periodontalLesions > 0 && <Text style={styles.pathologyText}>• Lesão Periodontal: Grau {t.periodontalLesions}</Text>}
                            {t.lingualWear > 0 && <Text style={styles.pathologyText}>• Desgaste Lingual: Grau {t.lingualWear}</Text>}
                            {t.vitrifiedBorder > 0 && <Text style={styles.pathologyText}>• Bordo Vitrificado</Text>}
                            
                            {/* --- CORREÇÃO APLICADA NA LINHA ABAIXO --- */}
                            {t.pulpChamberExposure > 0 && <Text style={[styles.pathologyText, { color: '#d32f2f', fontWeight: 'bold' }]}>• Exp. Câmara Pulpar</Text>}
                            
                            {t.gingivitisEdema > 0 && <Text style={styles.pathologyText}>• Edema Gengival</Text>}
                            {t.abnormalColor > 0 && <Text style={styles.pathologyText}>• Coloração Anormal</Text>}
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={{ fontStyle: 'italic', color: 'green', padding: 10 }}>
                    Nenhuma patologia identificada. Os dentes avaliados encontram-se dentro dos padrões de normalidade.
                </Text>
            )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
            <Text>Relatório gerado automaticamente pelo sistema AnimalTools. Documento técnico veterinário.</Text>
        </View>

      </Page>
    </Document>
  );
};