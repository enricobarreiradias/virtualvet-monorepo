"use client";

import { useEffect, useState, useCallback } from 'react'; 
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, 
  TextField, InputAdornment, Chip, Button, Avatar, CircularProgress, 
  Stack, Alert, IconButton, Tooltip, Dialog, DialogTitle, List, ListItem, Divider
} from '@mui/material';
import { 
  Search, Visibility, Edit, Block,
  Warning, CheckCircle, AccessTime, Error as ErrorIcon, Person,
  Description, GridView, Close
} from '@mui/icons-material';
import { EvaluationService, AuthService } from '../../services/api';

// 2. Importação Dinâmica do Componente de PDF
const ReportViewerModal = dynamic(() => import('../../components/pdf/ReportViewerModal'), {
  ssr: false, // Desabilita renderização no servidor 
  loading: () => <p>Carregando módulo de impressão...</p>
});

interface HistoryItem {
  id: string;
  animalId: string;
  code: string;
  breed: string;
  lastEvaluationDate: string;
  media: string[];
  worstFracture: number;
  status: 'HEALTHY' | 'MODERATE' | 'CRITICAL';
  evaluatorName?: string;
  evaluatorId?: number;
}

interface UserInfo {
    id: number;
    email: string;
    role: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // --- ESTADOS PARA O MODAL DE ESCOLHA ---
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  
  // --- 3. NOVOS ESTADOS PARA O MODAL DE PDF ---
  const [reportOpen, setReportOpen] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // ALTERAÇÃO 1: Inicializa o searchTerm com o valor da URL (se existir)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // ALTERAÇÃO 2: Sincroniza o searchTerm se a URL mudar (Navegação vinda do Relatório)
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    // Atualiza o estado apenas se o parametro search estiver presente ou se mudou
    if (urlSearch !== null) {
        setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    AuthService.me()
        .then((response) => setCurrentUser(response.data.user))
        .catch((err) => console.error("Erro ao identificar usuário:", err));
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const urlPathology = searchParams.get('pathology') || '';
    const urlFarm = searchParams.get('farm') || '';
    const urlClient = searchParams.get('client') || '';

    try {
      const response = await EvaluationService.getAllHistory(
          page + 1, rowsPerPage, searchTerm, urlFarm, urlClient, urlPathology
      );
      setHistoryData(response.data.data || []);
      setTotal(response.data.meta.total || 0);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar histórico de avaliações.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, searchParams]); 

  useEffect(() => {
    loadHistory();
  }, [loadHistory]); 

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); 
  };

  // --- LÓGICA DE NAVEGAÇÃO ---
  const handleEdit = (item: HistoryItem) => {
    router.push(`/evaluate/${item.animalId}?source=history`);
  };

  // Abre o Modal de Escolha
  const handleOpenViewOptions = (item: HistoryItem) => {
      setSelectedItem(item);
      setViewModalOpen(true);
  };

  // Opção 1: Ir para o Odontograma (Apenas Leitura)
  const handleViewOdontogram = () => {
      if (selectedItem) {
        router.push(`/evaluate/${selectedItem.animalId}?source=history&mode=readonly`);
      }
  };

  // Opção 2: Mini Relatório (
  const handleViewReport = () => {
      if (selectedItem) {
          setReportId(selectedItem.id); 
          setReportOpen(true);         
          setViewModalOpen(false);      
      }
  };

  const clearPathologyFilter = () => {
      router.push('/history'); 
  };

  const displayData = historyData;
  const activePathology = searchParams.get('pathology');

  return (
    <Box sx={{ p: 4, width: '100%' }}>
      
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
            <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
              Histórico de Laudos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Consulte e edite avaliações já realizadas.
            </Typography>
        </Box>
        
        <Paper sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
            <Stack direction="row" spacing={3}>
                <Box>
                    <Typography variant="caption" fontWeight="bold">TOTAL REGISTROS</Typography>
                    <Typography variant="h5" fontWeight={800}>{total}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" fontWeight="bold" color="error">CRÍTICOS (PÁG)</Typography>
                    <Typography variant="h5" fontWeight={800} color="error">
                        {historyData.filter(h => h.status === 'CRITICAL').length}
                    </Typography>
                </Box>
            </Stack>
        </Paper>
      </Box>

      {activePathology && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={clearPathologyFilter}>
              Filtrando por patologia: <strong>{activePathology.toUpperCase()}</strong>. Mostrando apenas animais afetados.
          </Alert>
      )}

      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <TextField
            fullWidth
            placeholder="Buscar por brinco ou raça..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
                startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>),
            }}
            size="small"
        />
      </Paper>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        {loading ? (
            <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : error ? (
            <Box p={3}><Alert severity="error">{error}</Alert></Box>
        ) : (
            <>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell>Data</TableCell>
                            <TableCell>Animal</TableCell>
                            <TableCell>Raça</TableCell>
                            <TableCell>Avaliador</TableCell>
                            <TableCell align="center">Diagnóstico Rápido</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayData.length > 0 ? (
                            displayData.map((row) => {
                                const isAdmin = currentUser?.role === 'admin';
                                const isOwner = currentUser?.id === row.evaluatorId;
                                const canEdit = isAdmin || isOwner;

                                return (
                                <TableRow key={row.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <AccessTime fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                {new Date(row.lastEvaluationDate).toLocaleDateString('pt-BR')}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar src={row.media[0]} variant="rounded" sx={{ width: 40, height: 40 }}>
                                                {row.code.substring(0,2)}
                                            </Avatar>
                                            <Typography fontWeight="bold">{row.code}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={row.breed} size="small" variant="outlined" />
                                    </TableCell>
                                    
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Person fontSize="small" color="disabled" />
                                            <Typography variant="body2" color="text.secondary">
                                                {row.evaluatorName || 'Sistema'}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    <TableCell align="center">
                                        {row.status === 'CRITICAL' && (
                                            <Chip icon={<ErrorIcon />} label="Crítico / Tratamento" color="error" variant="filled" size="small" sx={{ fontWeight: 'bold' }} />
                                        )}
                                        {row.status === 'MODERATE' && (
                                            <Chip icon={<Warning />} label="Moderado / Atenção" color="warning" variant="filled" size="small" sx={{ fontWeight: 'bold', color: '#fff' }} />
                                        )}
                                        {(row.status === 'HEALTHY' || !row.status) && (
                                            <Chip icon={<CheckCircle />} label="Saudável / Leve" color="success" variant="outlined" size="small" sx={{ fontWeight: 'bold', borderWidth: 2 }} />
                                        )}
                                    </TableCell>

                                    <TableCell align="center">
                                        <Stack direction="row" justifyContent="center" spacing={1}>
                                            
                                            {/* BOTÃO OLHO */}
                                            <Tooltip title="Opções de Visualização">
                                                <IconButton size="small" color="primary" onClick={() => handleOpenViewOptions(row)}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                            
                                            {/* BOTÃO EDITAR */}
                                            <Tooltip title={canEdit ? "Editar Avaliação" : "Você não tem permissão para editar"}>
                                                <span> 
                                                    <Button 
                                                        variant="contained" 
                                                        size="small" 
                                                        startIcon={canEdit ? <Edit /> : <Block />} 
                                                        onClick={() => handleEdit(row)} 
                                                        disabled={!canEdit} 
                                                        sx={{ borderRadius: 20, textTransform: 'none' }}
                                                        color={canEdit ? "primary" : "inherit"}
                                                    >
                                                        {canEdit ? "Editar" : "Restrito"}
                                                    </Button>
                                                </span>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">Nenhuma avaliação encontrada.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={total} 
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Linhas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </>
        )}
      </TableContainer>

      {/* --- MODAL DE ESCOLHA DE VISUALIZAÇÃO --- */}
      <Dialog onClose={() => setViewModalOpen(false)} open={viewModalOpen} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', pt: 3 }}>
            O que deseja visualizar?
            <IconButton
                onClick={() => setViewModalOpen(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
            >
                <Close />
            </IconButton>
        </DialogTitle>
        <List sx={{ pt: 0, px: 2, pb: 3 }}>
            
            {/* OPÇÃO 1: ODONTOGRAMA */}
            <ListItem disableGutters>
                <Button 
                    fullWidth 
                    variant="outlined" 
                    size="large"
                    onClick={handleViewOdontogram}
                    startIcon={<GridView />}
                    sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2, borderColor: 'divider' }}
                >
                    <Box textAlign="left" ml={1}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                            Odontograma Completo
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Visualizar a boca e os dentes (sem editar).
                        </Typography>
                    </Box>
                </Button>
            </ListItem>
            
            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />

            {/* OPÇÃO 2: RELATÓRIO PDF */}
            <ListItem disableGutters>
                <Button 
                    fullWidth 
                    variant="contained" 
                    size="large"
                    onClick={handleViewReport}
                    startIcon={<Description />}
                    sx={{ justifyContent: 'flex-start', py: 1.5, borderRadius: 2 }}
                >
                    <Box textAlign="left" ml={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            Relatório PDF
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Resumo e opção de download.
                        </Typography>
                    </Box>
                </Button>
            </ListItem>
        </List>
      </Dialog>

      {/* 4. MODAL DO VISUALIZADOR DE PDF */}
      <ReportViewerModal 
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        evaluationId={reportId}
      />

    </Box>
  );
}