"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; 
import { 
  Box, Grid, Typography, Card, CardContent, Button, 
  Container, CircularProgress, TextField, 
  Alert, Snackbar, Switch, FormControlLabel, Stack, Paper,
  Chip, Divider, Avatar, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { 
  Save, ArrowBack, CheckCircle, Warning, LocationOn, 
  CalendarToday, Pets, Person, ZoomIn, Map as MapIcon 
} from '@mui/icons-material';
import { AnimalService, EvaluationService } from '../../../services/api';
import DentalArch from '../../../components/DentalArch';
import QuickMoultingSelector from '../../../components/QuickMoultingSelector'; 
import { ImageDialog } from '../../../components/ImageDialog';
import { ToothCode, MoultingStage } from '../../../types/dental'; 

// --- ENUMS E TIPOS ---
enum SeverityScale {
  NONE = 0,      // Saudável
  MODERATE = 1,  // Moderado
  SEVERE = 2     // Crítico
}

enum ColorScale {
  NORMAL = 0,
  ALTERED = 1
}

enum ToothType {
  DECIDUOUS = 'DECIDUOUS', // Leite
  PERMANENT = 'PERMANENT'  // Permanente
}

type AnimalMedia = { 
  s3UrlPath: string; 
  originalDriveUrl?: string;
  latitude?: number;
  longitude?: number; 
} | string;

interface Animal {
  id: string;
  code: string;
  breed: string;
  age: number;
  media: AnimalMedia[];
  farm?: string;
  client?: string;
  location?: string;
  collectionDate?: string;
  sisbovNumber?: string;
  chip?: string;
  currentWeight?: number;
  lot?: string;
  birthDate?: string;
  coordinates?: { lat: number; lng: number }; 
  category?: string;
  coatColor?: string;
  bodyScore?: number;
  status?: string;
  entryDate?: string;
}

// ESTADO INICIAL
const initialToothState = {
  isPresent: true,
  toothType: ToothType.DECIDUOUS, 
  
  fractureLevel: SeverityScale.NONE,
  pulpitis: SeverityScale.NONE,
  crownReductionLevel: SeverityScale.NONE, 
  gingivalRecessionLevel: SeverityScale.NONE, 
  lingualWear: SeverityScale.NONE,
  periodontalLesions: SeverityScale.NONE,
  vitrifiedBorder: SeverityScale.NONE, 
  pulpChamberExposure: SeverityScale.NONE, 
  gingivitisEdema: SeverityScale.NONE, 
  dentalCalculus: SeverityScale.NONE,
  caries: SeverityScale.NONE,
  
  gingivitisColor: ColorScale.NORMAL,
  abnormalColor: ColorScale.NORMAL,
};

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [evaluationId, setEvaluationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  const [selectedTooth, setSelectedTooth] = useState<string | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  
  const [selectedMedia, setSelectedMedia] = useState<AnimalMedia | null>(null);
  
  const [teethData, setTeethData] = useState<Record<string, typeof initialToothState>>({
    [ToothCode.I1_LEFT]: { ...initialToothState },
    [ToothCode.I1_RIGHT]: { ...initialToothState },
    [ToothCode.I2_LEFT]: { ...initialToothState },
    [ToothCode.I2_RIGHT]: { ...initialToothState },
    [ToothCode.I3_LEFT]: { ...initialToothState },
    [ToothCode.I3_RIGHT]: { ...initialToothState },
    [ToothCode.I4_LEFT]: { ...initialToothState },
    [ToothCode.I4_RIGHT]: { ...initialToothState },
  });

  useEffect(() => {
    if (params?.id) {
      const animalId = params.id as string;
      setLoading(true);

      Promise.all([
        AnimalService.getOne(animalId),
        EvaluationService.getByAnimal ? EvaluationService.getByAnimal(animalId) : Promise.resolve({ data: [] }) 
      ])
      .then(([animalRes, evaluationRes]) => {
        setAnimal(animalRes.data);

        const history = evaluationRes.data;
        if (Array.isArray(history) && history.length > 0) {
           const latestEvaluation = history[0]; 
           
           if (latestEvaluation) {
             setEvaluationId(latestEvaluation.id);

             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const notes = (latestEvaluation as any).generalObservations || latestEvaluation.notes || '';
             setGeneralNotes(notes);

             if (latestEvaluation.notes) setGeneralNotes(latestEvaluation.notes);

             if (latestEvaluation.teeth) {
                 setTeethData(prev => {
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     const nextTeethData: any = { ...prev };
                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                     latestEvaluation.teeth.forEach((tooth: any) => {
                        if (nextTeethData[tooth.toothCode]) {
                           nextTeethData[tooth.toothCode] = {
                              ...initialToothState, 
                              ...tooth,             
                              isPresent: tooth.isPresent ?? true
                           };
                        }
                     });
                     return nextTeethData;
                 });
             }
           }
        }
      })
      .catch((err) => {
        console.error(err);
        setFeedback({ open: true, message: 'Erro ao carregar dados.', type: 'error' });
      })
      .finally(() => setLoading(false));
    }
  }, [params?.id]); 

  const updateTooth = (field: keyof typeof initialToothState, value: number | boolean | ToothType) => {
    if (!selectedTooth) return;
    setTeethData(prev => ({
      ...prev,
      [selectedTooth]: { ...prev[selectedTooth], [field]: value }
    }));
  };

  const handleQuickMoulting = (stage: MoultingStage) => {
      const checkIsPermanent = (code: string) => {
          const prefix = code.split('_')[0]; 
          switch (prefix) {
              case 'I1': return [MoultingStage.D2, MoultingStage.D4, MoultingStage.D6, MoultingStage.BC].includes(stage);
              case 'I2': return [MoultingStage.D4, MoultingStage.D6, MoultingStage.BC].includes(stage);
              case 'I3': return [MoultingStage.D6, MoultingStage.BC].includes(stage);
              case 'I4': return [MoultingStage.BC].includes(stage);
              default: return false;
          }
      };

      setTeethData(prev => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextTeethData: any = { ...prev };
          Object.keys(nextTeethData).forEach((toothCode) => {
              const isPermanent = checkIsPermanent(toothCode);
              nextTeethData[toothCode] = {
                  ...nextTeethData[toothCode],
                  toothType: isPermanent ? ToothType.PERMANENT : ToothType.DECIDUOUS,
                  isPresent: true
              };
          });
          return nextTeethData;
      });

      setFeedback({ 
          open: true, 
          message: `Padrão de muda ${stage} aplicado ao formulário. Clique em "Finalizar" para salvar.`, 
          type: 'success' 
      });
  };

  const handleSave = async () => {
      setSaving(true);
      try {
        const teethArray = Object.entries(teethData).map(([code, data]) => ({
          toothCode: code, ...data
        }));
        
        const payload = {
          animalId: animal?.id,
          evaluatorId: 1, 
          notes: generalNotes,
          teeth: teethArray
        };

        if (evaluationId) {
          await EvaluationService.update(evaluationId, payload);
          setFeedback({ open: true, message: 'Avaliação atualizada com sucesso!', type: 'success' });
        } else {
          await EvaluationService.create(payload);
          setFeedback({ open: true, message: 'Avaliação criada com sucesso!', type: 'success' });
        }
        
        setTimeout(() => {
           const source = searchParams.get('source');
           if (source === 'history') {
            router.push('/history'); 
          } else {
            router.push('/pending'); 
          }
        }, 1000);
      } catch (error) {
        console.error(error);
        setFeedback({ open: true, message: 'Erro ao salvar avaliação.', type: 'error' });
      } finally {
        setSaving(false);
      }
    };

  const getToothLabel = (code: string) => code.replace('_', ' '); 
  
  const getMediaUrl = (item: AnimalMedia) => {
      if (typeof item === 'string') return item;
      if (item.s3UrlPath && item.s3UrlPath !== '') return item.s3UrlPath;
      if (item.originalDriveUrl && item.originalDriveUrl !== '') return item.originalDriveUrl;
      return null;
    };
    
  // --- COMPONENTES VISUAIS ---

  const SeveritySelector = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <Box mb={2}>
      <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
        {label.toUpperCase()}
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newVal) => newVal !== null && onChange(newVal)}
        fullWidth
        size="small"
      >
        <ToggleButton value={SeverityScale.NONE} sx={{ '&.Mui-selected': { bgcolor: '#dcfce7', color: '#166534' } }}>
            Normal
        </ToggleButton>
        <ToggleButton value={SeverityScale.MODERATE} sx={{ '&.Mui-selected': { bgcolor: '#fef9c3', color: '#854d0e' } }}>
            Moderado
        </ToggleButton>
        <ToggleButton value={SeverityScale.SEVERE} sx={{ '&.Mui-selected': { bgcolor: '#fee2e2', color: '#991b1b' } }}>
            Crítico
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );

  const ColorSelector = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
    <Box mb={2}>
      <Typography variant="caption" color="text.secondary" fontWeight="bold" display="block" mb={0.5}>
        {label.toUpperCase()}
      </Typography>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={(_, newVal) => newVal !== null && onChange(newVal)}
        fullWidth
        size="small"
      >
        <ToggleButton value={ColorScale.NORMAL}>Normal</ToggleButton>
        <ToggleButton value={ColorScale.ALTERED} sx={{ '&.Mui-selected': { bgcolor: '#fee2e2', color: '#991b1b' } }}>
          Alterada
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );

  if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;
  if (!animal) return <Typography>Animal não encontrado.</Typography>;

  const currentToothData = selectedTooth ? teethData[selectedTooth] : null;

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
    
      <ImageDialog 
        open={!!selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
        imageUrl={selectedMedia ? getMediaUrl(selectedMedia) : null} 
      />

      {/* HEADER */}
      <Paper square elevation={1} sx={{ px: 3, py: 2, zIndex: 10, borderBottom: '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Button startIcon={<ArrowBack />} onClick={() => router.back()} color="inherit">Voltar</Button>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="h6" fontWeight={700} lineHeight={1}>{animal.code}</Typography>
              <Box display="flex" alignItems="center" gap={1}>
                  <Chip label={animal.breed} size="small" color="primary" variant="outlined" />
                  {animal.client && <Typography variant="caption" color="text.secondary">| {animal.client}</Typography>}
              </Box>
            </Box>
          </Box>
          <Button variant="contained" size="large" startIcon={<Save />} onClick={handleSave} disabled={saving} color="primary">
            {saving ? 'Salvando...' : 'Finalizar Laudo'}
          </Button>
        </Box>
      </Paper>

      {/* CONTEÚDO SPLIT */}
      <Grid container sx={{ flex: 1, overflow: 'hidden' }}>
        
        {/* ESQUERDA - SIDEBAR DE DADOS */}
        <Grid size={{ xs: 12, md: 5, lg: 4 }} sx={{ height: '100%', overflowY: 'auto', borderRight: '1px solid #e0e0e0', bgcolor: '#f5f5f5', p: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mb: 2, textTransform: 'uppercase', color: 'text.secondary' }}>
                Evidências Visuais ({animal.media?.length || 0})
            </Typography>
            <Stack spacing={3}>
                {animal.media && animal.media.length > 0 ? (
                    animal.media.map((mediaItem, index) => {
                        const hasLocation = typeof mediaItem !== 'string' && mediaItem.latitude && mediaItem.longitude;
                        const mapsLink = hasLocation 
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          ? `https://www.google.com/maps/search/?api=1&query=${mediaItem.latitude},${mediaItem.longitude}`
                          : '#';

                        return (
                            <Card key={index} elevation={3}>
                                <Box 
                                    onClick={() => setSelectedMedia(mediaItem)}
                                    sx={{ 
                                        position: 'relative', 
                                        bgcolor: '#000', 
                                        minHeight: 300, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        '&:hover .zoom-icon': { opacity: 1 }, 
                                        '&:hover': { opacity: 0.95 }
                                    }}
                                >
        
                                    {getMediaUrl(mediaItem) ? (
                                        <img 
                                            src={getMediaUrl(mediaItem) as string} 
                                            alt={`Evidência ${index + 1}`} 
                                            style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} 
                                        />
                                    ) : (
                                        <Typography variant="caption" color="white">
                                            Imagem indisponível
                                        </Typography>
                                    )}

                                    <Chip label={index === 0 ? "Frontal" : "Lateral / Lingual"} size="small" sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(255,255,255,0.9)' }} />
                                    
                                    <Box className="zoom-icon" sx={{ position: 'absolute', opacity: 0, transition: '0.3s', bgcolor: 'rgba(0,0,0,0.6)', p: 1, borderRadius: '50%', color: 'white' }}>
                                        <ZoomIn fontSize="large" />
                                    </Box>
                                </Box>

                                {/* Botão de Localização diretamente abaixo da imagem*/}
                                {hasLocation && (
                                    <Box p={1} bgcolor="#f8fafc" borderTop="1px solid #e2e8f0">
                                        <Button 
                                            fullWidth
                                            size="small"
                                            startIcon={<MapIcon />}
                                            href={mapsLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ textTransform: 'none', color: 'text.secondary', justifyContent: 'center' }}
                                        >
                                            Ver localização da captura
                                        </Button>
                                    </Box>
                                )}
                            </Card>
                        );
                    })
                ) : (
                    <Box height={200} display="flex" alignItems="center" justifyContent="center" bgcolor="#e0e0e0" borderRadius={2}><Typography color="text.secondary">Sem imagens</Typography></Box>
                )}

                <Card variant="outlined" sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                        <Pets fontSize="small" /> Dados do Animal
                    </Typography>
                    
                    <Stack spacing={1.5}>
                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">ID Visual (Brinco)</Typography>
                            <Typography fontWeight="bold" variant="body1">{animal.code}</Typography>
                        </Box>
                        <Divider />

                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">SISBOV</Typography>
                            <Typography fontWeight="bold" sx={{ fontFamily: 'monospace', color: animal.sisbovNumber ? 'inherit' : 'text.disabled' }}>
                                {animal.sisbovNumber || '---'}
                            </Typography>
                        </Box>
                        <Divider />

                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Chip Eletrônico</Typography>
                            <Typography fontWeight="bold" sx={{ fontFamily: 'monospace', color: animal.chip ? 'inherit' : 'text.disabled' }}>
                                {animal.chip || '---'}
                            </Typography>
                        </Box>
                        <Divider />
                        
                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Raça</Typography>
                            <Typography fontWeight="bold">{animal.breed}</Typography>
                        </Box>
                        <Divider />

                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Categoria</Typography>
                            <Typography fontWeight="bold">{animal.category || '---'}</Typography>
                        </Box>
                        <Divider />

                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Pelagem</Typography>
                            <Typography fontWeight="bold">{animal.coatColor || '---'}</Typography>
                        </Box>
                        <Divider />

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography color="text.secondary">Peso Atual</Typography>
                            {animal.currentWeight ? (
                                <Chip label={`${animal.currentWeight} kg`} size="small" color="success" variant="outlined" />
                            ) : (
                                <Typography color="text.disabled" variant="body2">Não informado</Typography>
                            )}
                        </Box>
                        <Divider />

                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography color="text.secondary">Score Corporal</Typography>
                            {animal.bodyScore ? (
                                <Chip label={animal.bodyScore} size="small" color="primary" variant="filled" />
                            ) : (
                                <Typography color="text.disabled" variant="body2">---</Typography>
                            )}
                        </Box>
                        <Divider />

                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Idade (Calc.)</Typography>
                            <Typography fontWeight="bold">{animal.age ? `${animal.age} meses` : 'N/A'}</Typography>
                        </Box>
                        <Divider />
                        
                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Data Entrada</Typography>
                            <Typography fontWeight="bold">
                                {animal.entryDate ? new Date(animal.entryDate).toLocaleDateString('pt-BR') : '---'}
                            </Typography>
                        </Box>
                        <Divider />

                       
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography color="text.secondary" display="flex" gap={0.5}>
                                <LocationOn fontSize="small"/> Localização
                            </Typography>
                            
                            <Box textAlign="right">
                                <Typography fontWeight="bold" variant="body2">{animal.farm || 'Não inf.'}</Typography>
                                <Typography variant="caption" display="block" color={animal.lot ? 'text.secondary' : 'text.disabled'}>
                                   Lote: {animal.lot || '---'}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider />
                        
                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary" display="flex" gap={0.5}><Person fontSize="small"/> Cliente</Typography>
                            <Typography fontWeight="bold">{animal.client || 'Não inf.'}</Typography>
                        </Box>

                        <Divider />
                        
                        <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary" display="flex" gap={0.5}><CalendarToday fontSize="small"/> Coleta</Typography>
                            <Typography fontWeight="bold">
                                {animal.collectionDate ? new Date(animal.collectionDate).toLocaleDateString('pt-BR') : 'N/A'}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>
                <TextField fullWidth label="Observações Gerais do Caso" multiline rows={4} value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)} variant="filled" helperText="Anotações gerais do animal" />
            </Stack>
        </Grid>

        {/* DIREITA - ODONTOGRAMA */}
        <Grid size={{ xs: 12, md: 7, lg: 8 }} sx={{ height: '100%', overflowY: 'auto', p: 4, bgcolor: '#fff' }}>
            <Container maxWidth="md">
                
                <QuickMoultingSelector onSelect={handleQuickMoulting} />

                <Box mb={4} textAlign="center">
                    <Typography variant="h5" fontWeight={700} gutterBottom color="primary">Odontograma</Typography>
                    <Typography color="text.secondary">Selecione o dente para avaliar</Typography>
                </Box>
                
                <Box mb={4}>
                    <DentalArch 
                        //eslint-disable-next-line @typescript-eslint/no-explicit-any
                        teethData={teethData as any} 
                        selectedTooth={selectedTooth} 
                        onSelectTooth={setSelectedTooth} 
                    />
                </Box>

                <Card elevation={0} variant="outlined" sx={{ borderColor: selectedTooth ? 'primary.main' : '#e0e0e0', borderWidth: selectedTooth ? 2 : 1 }}>
                    <CardContent sx={{ p: 3 }}>
                        {!selectedTooth ? (
                            <Box py={8} display="flex" flexDirection="column" alignItems="center" color="text.secondary">
                                <CheckCircle sx={{ fontSize: 60, mb: 2, opacity: 0.1 }} />
                                <Typography variant="h6">Nenhum dente selecionado</Typography>
                            </Box>
                        ) : (
                            <Box className="fade-in" key={selectedTooth}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} pb={2} borderBottom="1px solid #f0f0f0">
                                    <Box>
                                        <Typography variant="caption" color="primary" fontWeight="bold">EDITANDO</Typography>
                                        <Typography variant="h5" fontWeight={800} color="primary">{getToothLabel(selectedTooth)}</Typography>
                                    </Box>
                                    <FormControlLabel control={<Switch checked={currentToothData?.isPresent} onChange={(e) => updateTooth('isPresent', e.target.checked)} color="success" />} label={<Typography fontWeight="bold">Dente Presente</Typography>} />
                                </Box>

                                {currentToothData?.isPresent ? (
                                    <Stack spacing={4}>
                                                  <Box bgcolor="#f8fafc" p={2} borderRadius={2} border="1px solid #e2e8f0">
                                                      <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom display="block">ESTÁGIO DE DESENVOLVIMENTO</Typography>
                                                      <ToggleButtonGroup
                                                          value={currentToothData.toothType}
                                                          exclusive
                                                          onChange={(_, val) => val && updateTooth('toothType', val)}
                                                          fullWidth
                                                          size="small"
                                                          color="primary"
                                                      >
                                                          <ToggleButton value={ToothType.DECIDUOUS}>🦷 Dente de Leite</ToggleButton>
                                                          <ToggleButton value={ToothType.PERMANENT}>🦷 Permanente</ToggleButton>
                                                      </ToggleButtonGroup>
                                                  </Box>

                                                  <Box>
                                                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                          <Avatar sx={{ bgcolor: 'error.light', width: 24, height: 24, fontSize: 12 }}>!</Avatar>
                                                          <Typography variant="subtitle1" fontWeight="bold" color="error.main">Parâmetros Críticos</Typography>
                                                      </Box>
                                                      <Grid container spacing={3}>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Fratura" value={currentToothData.fractureLevel} onChange={(v) => updateTooth('fractureLevel', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Pulpite (Inflamação)" value={currentToothData.pulpitis} onChange={(v) => updateTooth('pulpitis', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Recessão Gengival (Raiz)" value={currentToothData.gingivalRecessionLevel} onChange={(v) => updateTooth('gingivalRecessionLevel', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Redução de Coroa" value={currentToothData.crownReductionLevel} onChange={(v) => updateTooth('crownReductionLevel', v)} />
                                                          </Grid>
                                                      </Grid>
                                                  </Box>

                                                  <Divider />

                                                  <Box>
                                                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                                                          <Avatar sx={{ bgcolor: 'primary.light', width: 24, height: 24, fontSize: 12 }}>2</Avatar>
                                                          <Typography variant="subtitle1" fontWeight="bold">Outros Indicadores</Typography>
                                                      </Box>
                                                      <Grid container spacing={3}>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Desgaste Lingual" value={currentToothData.lingualWear} onChange={(v) => updateTooth('lingualWear', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Lesões Periodontais" value={currentToothData.periodontalLesions} onChange={(v) => updateTooth('periodontalLesions', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Cálculo Dentário" value={currentToothData.dentalCalculus} onChange={(v) => updateTooth('dentalCalculus', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <SeveritySelector label="Cárie" value={currentToothData.caries} onChange={(v) => updateTooth('caries', v)} />
                                                          </Grid>
                                                          
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <ColorSelector label="Cor da Gengiva" value={currentToothData.gingivitisColor} onChange={(v) => updateTooth('gingivitisColor', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12, sm: 6 }}>
                                                              <ColorSelector label="Cor do Dente" value={currentToothData.abnormalColor} onChange={(v) => updateTooth('abnormalColor', v)} />
                                                          </Grid>
                                                      </Grid>
                                                  </Box>

                                                  <Box bgcolor="#f9fafb" p={2} borderRadius={2}>
                                                      <Typography variant="caption" color="text.secondary" display="block" mb={2}>DETALHES ESPECÍFICOS </Typography>
                                                      <Grid container spacing={2}>
                                                          <Grid size={{ xs: 6 }}>
                                                              <SeveritySelector label="Bordo Vitrificado" value={currentToothData.vitrifiedBorder} onChange={(v) => updateTooth('vitrifiedBorder', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 6 }}>
                                                               <SeveritySelector label="Exp. Câmara Pulpar" value={currentToothData.pulpChamberExposure} onChange={(v) => updateTooth('pulpChamberExposure', v)} />
                                                          </Grid>
                                                          <Grid size={{ xs: 12 }}>
                                                               <SeveritySelector label="Edema Gengival" value={currentToothData.gingivitisEdema} onChange={(v) => updateTooth('gingivitisEdema', v)} />
                                                          </Grid>
                                                      </Grid>
                                                  </Box>

                                      </Stack>
                                ) : (
                                    <Alert severity="warning" icon={<Warning />}>Este dente foi marcado como <strong>AUSENTE</strong>.</Alert>
                                )}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </Grid>
      </Grid>
      
      <Snackbar open={feedback.open} autoHideDuration={4000} onClose={() => setFeedback({ ...feedback, open: false })}>
        <Alert severity={feedback.type}>{feedback.message}</Alert>
      </Snackbar>
    </Box>
  );
}