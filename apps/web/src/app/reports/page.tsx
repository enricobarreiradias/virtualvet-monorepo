"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Paper, 
  Button, Select, MenuItem, FormControl, InputLabel, 
  Stack, LinearProgress, Chip, CircularProgress,
  Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  alpha
} from '@mui/material';
import { 
  Download, FilterList, BarChart, 
  PieChart, Refresh, ArrowForward, TrendingUp,
  Assessment, Warning, CheckCircle
} from '@mui/icons-material';
import { AnimalService, EvaluationService } from '../../services/api';
import { pdf } from '@react-pdf/renderer';
import { StatsReportDoc } from '../../components/pdf/StatsReportDoc';

// --- TIPAGEM ---
interface ReportStats {
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
  pathologies: Record<string, {
    label: string;
    count: number;
    key: string;
  }>;
  criticalAnimals: Array<{
    id: string;
    tag: string;
    farm: string;
    location: string;
    diagnosis: string;
    date: string;
  }>;
}

// Função auxiliar para calcular datas 
const getDateRange = (periodOption: string) => {
  const end = new Date();
  const start = new Date();

  switch (periodOption) {
    case '7':
      start.setDate(end.getDate() - 7);
      break;
    case '30':
      start.setDate(end.getDate() - 30);
      break;
    case '90':
      start.setDate(end.getDate() - 90);
      break;
    case 'year':
      start.setMonth(0, 1); 
      break;
    default:
      start.setDate(end.getDate() - 30); 
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
};

export default function ReportsPage() {
  const router = useRouter();

  const [user, setUser] = useState<{ name: string }>({ name: 'Carregando...' });
  const [loading, setLoading] = useState(true);
  
  const [filterFarm, setFilterFarm] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [period, setPeriod] = useState('30');
  
  const [farmOptions, setFarmOptions] = useState<string[]>([]);
  const [clientOptions, setClientOptions] = useState<string[]>([]);
  
  const [stats, setStats] = useState<ReportStats | null>(null);

  // Carregar utilizador do LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setTimeout(() => {
          setUser({ name: parsedUser.fullName }); 
        }, 0);
      } catch (e) {
        console.error("Erro ao ler dados do utilizador", e);
      }
    }
  }, []);

  // Carregar Filtros
  useEffect(() => {
    AnimalService.getFarms().then(res => setFarmOptions(res.data)).catch(console.error);
    if (AnimalService.getClients) {
      AnimalService.getClients().then(res => setClientOptions(res.data)).catch(console.error);
    }
  }, []);

  // --- FUNÇÃO DE CARREGAMENTO ---
  const loadReportData = useCallback(() => {
    setLoading(true);
    const { startDate, endDate } = getDateRange(period);

    EvaluationService.getReportStats(filterFarm, filterClient, startDate, endDate)
      .then((response) => {
        setStats(response.data);
      })
      .catch((error) => {
        console.error('Erro ao carregar relatório:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [filterFarm, filterClient, period]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReportData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadReportData]);

  const handleManualRefresh = () => {
    loadReportData();
  };

  const handlePathologyClick = (key: string) => {
    router.push(`/history?pathology=${key}&farm=${filterFarm}&client=${filterClient}`);
  };

  const handleAnimalClick = (tag: string) => {
    router.push(`/history?search=${tag}`); 
  };

  // --- LÓGICA DINÂMICA DE PATOLOGIAS ---
  const CORE_PATHOLOGIES = ['fracture', 'pulpitis', 'recession', 'periodontal'];

  const pathologyList = stats ? Object.values(stats.pathologies)
    .filter(item => {
      return CORE_PATHOLOGIES.includes(item.key) || item.count > 0;
    })
    .sort((a, b) => {
      const isACore = CORE_PATHOLOGIES.includes(a.key);
      const isBCore = CORE_PATHOLOGIES.includes(b.key);
      
      if (isACore && !isBCore) return -1;
      if (!isACore && isBCore) return 1;

      return b.count - a.count;
    }) : [];
  
  const getPathologyColor = (index: number) => {
    const colors = ['#f59e0b', '#f97316', '#ef4444', '#b91c1c', '#3b82f6', '#6366f1'];
    return colors[index % colors.length];
  };

  // --- EXPORTAR PDF ---
  const handleExportPDF = async () => {
    if (!stats) return;

    const doc = (
      <StatsReportDoc 
        stats={stats} 
        pathologyList={pathologyList} 
        filters={{ farm: filterFarm, client: filterClient, period }}
        user={user}
      />
    );

    const asPdf = pdf(doc); 
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography color="text.secondary">Carregando relatórios...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box p={4}>
        <Paper sx={{ p: 6, textAlign: 'center' }} variant="outlined">
          <Typography variant="h6" color="text.secondary">
            Não foi possível carregar os dados.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 6 }}>
      
      {/* HEADER MODERNO */}
      <Box 
        sx={{ 
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 4,
          py: 3,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          '@media print': { display: 'none' }
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={700} color="primary.main" gutterBottom>
              Relatórios Gerenciais
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Análise populacional e saúde do rebanho
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1.5}>
            <Button 
              variant="outlined" 
              color="inherit"
              startIcon={<Refresh />} 
              onClick={handleManualRefresh}
              sx={{ textTransform: 'none' }}
            >
              Atualizar
            </Button>
            
                        
            <Button 
              variant="contained" 
              startIcon={<Download />}
              onClick={handleExportPDF} 
              disabled={loading || !stats}
              sx={{ 
                textTransform: 'none',
                boxShadow: 2,
                '&:hover': { boxShadow: 4 }
              }}
            >
              Exportar PDF
            </Button>
          </Stack>
        </Stack>

        {/* FILTROS INTEGRADOS NO HEADER */}
        <Box mt={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select 
                  value={period} 
                  label="Período" 
                  onChange={(e) => setPeriod(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="7">Últimos 7 dias</MenuItem>
                  <MenuItem value="30">Últimos 30 dias</MenuItem>
                  <MenuItem value="90">Últimos 3 meses</MenuItem>
                  <MenuItem value="year">Este ano</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Fazenda</InputLabel>
                <Select 
                  value={filterFarm} 
                  label="Fazenda" 
                  onChange={(e) => setFilterFarm(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="all">Todas as fazendas</MenuItem>
                  {farmOptions.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select 
                  value={filterClient} 
                  label="Cliente" 
                  onChange={(e) => setFilterClient(e.target.value)}
                  sx={{ bgcolor: 'white' }}
                >
                  <MenuItem value="all">Todos os clientes</MenuItem>
                  {clientOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button 
                fullWidth 
                variant="contained" 
                color="inherit" 
                startIcon={<FilterList />} 
                onClick={handleManualRefresh}
                sx={{ 
                  height: '40px',
                  textTransform: 'none',
                  bgcolor: 'grey.800',
                  color: 'white',
                  '&:hover': { bgcolor: 'grey.900' }
                }}
              >
                Aplicar Filtros
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* CONTEÚDO PRINCIPAL */}
      <Box px={4} pt={4}>
        
        {/* KPIs - CARDS MODERNOS */}
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                      Animais Avaliados
                    </Typography>
                    <Typography variant="h3" fontWeight={700} color="primary.main" mt={1}>
                      {stats.general.total}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      bgcolor: alpha('#1976d2', 0.1),
                      p: 1.5,
                      borderRadius: 2
                    }}
                  >
                    <Assessment sx={{ color: 'primary.main', fontSize: 32 }} />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Total de animais no período selecionado
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                      Índice de Saúde
                    </Typography>
                    <Typography variant="h3" fontWeight={700} color="success.main" mt={1}>
                      {stats.general.healthyPercentage}%
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      bgcolor: alpha('#2e7d32', 0.1),
                      p: 1.5,
                      borderRadius: 2
                    }}
                  >
                    <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Animais sem necessidade de intervenção
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s',
                '&:hover': { 
                  boxShadow: 6,
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                      Total de Lesões
                    </Typography>
                    <Typography variant="h3" fontWeight={700} color="warning.main" mt={1}>
                      {stats.general.totalLesions}
                    </Typography>
                  </Box>
                  <Box 
                    sx={{ 
                      bgcolor: alpha('#ed6c02', 0.1),
                      p: 1.5,
                      borderRadius: 2
                    }}
                  >
                    <Warning sx={{ color: 'warning.main', fontSize: 32 }} />
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Lesões identificadas no rebanho
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* GRÁFICOS E ANÁLISES */}
        <Grid container spacing={3} mb={4}>
          
          {/* PATOLOGIAS */}
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <BarChart color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Principais Patologias
                  </Typography>
                </Stack>
                
                <Stack spacing={2.5}>
                  {pathologyList.length > 0 ? (
                    pathologyList.map((item, index) => {
                      const color = getPathologyColor(index);
                      const percentage = stats.general.total ? (item.count / stats.general.total) * 100 : 0;
                      
                      return (
                        <Box 
                          key={item.key} 
                          onClick={() => handlePathologyClick(item.key)}
                          sx={{ 
                            cursor: 'pointer',
                            p: 2,
                            borderRadius: 1,
                            transition: 'all 0.2s',
                            '&:hover': { 
                              bgcolor: alpha(color, 0.05),
                              transform: 'translateX(4px)'
                            }
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">
                              {item.label}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip 
                                label={`${item.count} casos`}
                                size="small"
                                sx={{ 
                                  bgcolor: alpha(color, 0.1),
                                  color: color,
                                  fontWeight: 700,
                                  fontSize: '0.75rem'
                                }}
                              />
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {percentage.toFixed(1)}%
                              </Typography>
                            </Stack>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4, 
                              bgcolor: alpha(color, 0.1),
                              '& .MuiLinearProgress-bar': { 
                                bgcolor: color,
                                borderRadius: 4
                              }
                            }} 
                          />
                        </Box>
                      );
                    })
                  ) : (
                    <Box 
                      sx={{ 
                        p: 6, 
                        textAlign: 'center',
                        bgcolor: '#f8fafc',
                        borderRadius: 2
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        Nenhuma patologia registrada no período
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* SEVERIDADE */}
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <PieChart color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Distribuição de Severidade
                  </Typography>
                </Stack>

                <Stack spacing={3}>
                  {/* Saudáveis */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2.5,
                      bgcolor: alpha('#2e7d32', 0.05),
                      border: '2px solid',
                      borderColor: alpha('#2e7d32', 0.2),
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'success.main',
                        boxShadow: `0 0 0 4px ${alpha('#2e7d32', 0.1)}`
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4" fontWeight={700} color="success.main" mb={0.5}>
                          {stats.general.healthyPercentage}%
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="success.dark">
                          Animais Saudáveis
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Sem necessidade de intervenção
                        </Typography>
                      </Box>
                      <CheckCircle sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                    </Stack>
                  </Paper>

                  {/* Moderados */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2.5,
                      bgcolor: alpha('#ed6c02', 0.05),
                      border: '2px solid',
                      borderColor: alpha('#ed6c02', 0.2),
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'warning.main',
                        boxShadow: `0 0 0 4px ${alpha('#ed6c02', 0.1)}`
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4" fontWeight={700} color="warning.main" mb={0.5}>
                          {stats.general.moderatePercentage}%
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="warning.dark">
                          Casos Moderados
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Requerem acompanhamento
                        </Typography>
                      </Box>
                      <TrendingUp sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                    </Stack>
                  </Paper>

                  {/* Críticos */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2.5,
                      bgcolor: alpha('#d32f2f', 0.05),
                      border: '2px solid',
                      borderColor: alpha('#d32f2f', 0.2),
                      borderRadius: 2,
                      transition: 'all 0.3s',
                      '&:hover': {
                        borderColor: 'error.main',
                        boxShadow: `0 0 0 4px ${alpha('#d32f2f', 0.1)}`
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h4" fontWeight={700} color="error.main" mb={0.5}>
                          {stats.general.criticalPercentage}%
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="error.dark">
                          Casos Críticos
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tratamento imediato necessário
                        </Typography>
                      </Box>
                      <Warning sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
                    </Stack>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* CASOS CRÍTICOS */}
        {stats.criticalAnimals && stats.criticalAnimals.length > 0 && (
          <Card 
            elevation={0}
            sx={{ 
              border: '2px solid',
              borderColor: 'error.main',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ bgcolor: alpha('#d32f2f', 0.05), p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Warning sx={{ color: 'error.main' }} />
                    <Typography variant="h6" fontWeight={700} color="error.main">
                      Atenção Imediata - Casos Críticos
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Clique no animal para visualizar o histórico clínico completo
                  </Typography>
                </Box>
                <Chip 
                  label={`${stats.criticalAnimals.length} ${stats.criticalAnimals.length === 1 ? 'caso' : 'casos'}`}
                  color="error"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Brinco
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Localização
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Diagnóstico
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Data
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Ação
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.criticalAnimals.map((animal, index) => (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => handleAnimalClick(animal.tag)}
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: alpha('#d32f2f', 0.02) }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {animal.tag}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {animal.location} - {animal.farm}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={animal.diagnosis} 
                          size="small"
                          sx={{
                            bgcolor: alpha('#d32f2f', 0.1),
                            color: 'error.main',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(animal.date).toLocaleDateString('pt-BR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          color="primary"
                          sx={{
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'translateX(4px)' }
                          }}
                        >
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Mensagem quando não há casos críticos */}
        {(!stats.criticalAnimals || stats.criticalAnimals.length === 0) && (
          <Paper 
            elevation={0}
            sx={{ 
              p: 6, 
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'success.light',
              borderRadius: 2,
              bgcolor: alpha('#2e7d32', 0.02)
            }}
          >
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" fontWeight={600} color="success.main" gutterBottom>
              Excelente!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nenhum caso crítico registrado neste período
            </Typography>
          </Paper>
        )}

      </Box>

      {/* FOOTER */}
      <Box 
        sx={{ 
          mt: 6,
          pt: 3,
          pb: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography variant="caption" color="text.secondary">
          VirtualVet - Sistema de Gestão de Saúde Animal © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}