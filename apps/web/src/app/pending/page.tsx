"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, TablePagination, 
  TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, 
  Chip, Button, Avatar, CircularProgress, 
  Stack, Alert, Divider, Grid 
} from '@mui/material';
import { Search, FilterList, CheckCircle, Pets, ArrowForward, Refresh } from '@mui/icons-material';
import { EvaluationService, AnimalService } from '../../services/api';

interface ApiAnimalResponse {
  id: string;
  code: string;
  breed: string;
  media: string[];
  farm?: string;
  client?: string;
  entryDate?: string;
  createdAt?: string;
}

export default function PendingEvaluationsPage() {
  const router = useRouter();
  
  const [animals, setAnimals] = useState<ApiAnimalResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtros
  const [filterFarm, setFilterFarm] = useState('all');
  const [filterClient, setFilterClient] = useState('all');

  // Opções para os Selects 
  const [farmOptions, setFarmOptions] = useState<string[]>([]);
  const [clientOptions, setClientOptions] = useState<string[]>([]);

  // Carrega as opções dos filtros (Fazendas e Clientes)
  useEffect(() => {
    // 1. Carregar Fazendas
    AnimalService.getFarms()
      .then((res) => setFarmOptions(res.data))
      .catch((err) => console.error('Erro ao carregar fazendas:', err));

    // 2. Carregar Clientes 
    if (AnimalService.getClients) {
        AnimalService.getClients()
        .then((res) => setClientOptions(res.data))
        .catch((err) => console.error('Erro ao carregar clientes:', err));
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const farmQuery = filterFarm === 'all' ? '' : filterFarm;
      
      const clientQuery = filterClient === 'all' ? '' : filterClient; 
      
      const response = await EvaluationService.getPending(
          page + 1, 
          rowsPerPage, 
          searchTerm, 
          farmQuery,    
          clientQuery   
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: any = response.data; 
      
      if (result && Array.isArray(result.data)) {
          setAnimals(result.data);
          setTotalCount(result.meta?.total || 0);
      } else {
          setAnimals([]);
          setTotalCount(0);
      }

    } catch (err) {
      console.error(err);
      setError('Falha ao carregar lista. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, filterFarm, filterClient]);

  useEffect(() => {
      loadData();
  }, [loadData]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEvaluate = (id: string) => {
    router.push(`/evaluate/${id}`);
  };

  const handleClearFilters = () => {
      setSearchTerm('');
      setFilterFarm('all');
      setFilterClient('all');
      setPage(0);
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box mb={4} display="flex" flexDirection={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" gap={2}>
        <Box>
            <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>Mesa de Avaliação</Typography>
            <Typography variant="body1" color="text.secondary">Gerencie e avalie os animais pendentes de laudo técnico.</Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#e3f2fd', border: '1px solid #90caf9', borderRadius: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center">
                <Box textAlign="center">
                    <Typography variant="caption" fontWeight="bold" color="primary">TOTAL PENDENTE</Typography>
                    <Typography variant="h4" fontWeight={800} color="primary">
                        {loading ? '...' : totalCount} 
                    </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Button size="small" onClick={() => loadData()} startIcon={<Refresh />}>
                    Atualizar
                </Button>
            </Stack>
        </Paper>
      </Box>

      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
            {/* BUSCA TEXTUAL */}
            <Grid size={{ xs: 12, md: 4 }}>
                <TextField 
                    fullWidth 
                    placeholder="Buscar por brinco / ID..." 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }} 
                    InputProps={{ startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>) }} 
                    size="small" 
                />
            </Grid>
            
            {/* FILTRO FAZENDA */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                    select
                    label="Filtrar por Fazenda"
                    value={filterFarm}
                    onChange={(e) => { setFilterFarm(e.target.value); setPage(0); }}
                    variant="outlined"
                    size="small"
                    fullWidth
                >
                    <MenuItem value="all">
                        <em>Todas as Fazendas</em>
                    </MenuItem>
                    {farmOptions.map((farmName) => (
                        <MenuItem key={farmName} value={farmName}>
                        {farmName}
                        </MenuItem>
                    ))}
                </TextField>
            </Grid>

            {/* FILTRO CLIENTE */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl fullWidth size="small">
                    <InputLabel>Filtrar Cliente</InputLabel>
                    <Select 
                        value={filterClient} 
                        label="Filtrar Cliente" 
                        onChange={(e) => { setFilterClient(e.target.value); setPage(0); }}
                    >
                        <MenuItem value="all"><em>Todos os Clientes</em></MenuItem>
                        {clientOptions.map((clientName) => (
                            <MenuItem key={clientName} value={clientName}>
                                {clientName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 2 }}>
                 <Button fullWidth variant="outlined" onClick={handleClearFilters} startIcon={<FilterList />} color="inherit">Limpar</Button>
            </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && animals.length === 0 ? ( 
            <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box> 
        ) : error ? ( 
            <Box p={3}><Alert severity="error">{error}</Alert></Box> 
        ) : (
            <>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell>Imagem</TableCell>
                            <TableCell>Identificação (ID)</TableCell>
                            <TableCell>Raça</TableCell>
                            <TableCell>Origem (Fazenda)</TableCell>
                            <TableCell>Cliente</TableCell>
                            <TableCell align="center">Ação</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {animals.length > 0 ? (
                            animals.map((row) => (
                                <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Avatar 
                                            src={row.media && row.media.length > 0 ? row.media[0] : undefined} 
                                            variant="rounded" 
                                            sx={{ width: 56, height: 56, border: '1px solid #eee' }}
                                        >
                                            <Pets />
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <Typography fontWeight="bold" variant="body1">{row.code}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Entrada: {row.createdAt 
                                                ? new Date(row.createdAt).toLocaleString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: '2-digit', 
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  }) 
                                                : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Chip label={row.breed || 'N/A'} size="small" variant="outlined" /></TableCell>
                                    <TableCell>{row.farm || 'Não informada'}</TableCell>
                                    <TableCell>{row.client || 'Não informado'}</TableCell>
                                    <TableCell align="center">
                                        <Button 
                                            variant="contained" 
                                            color="primary" 
                                            endIcon={<ArrowForward />} 
                                            onClick={() => handleEvaluate(row.id)} 
                                            size="small" 
                                            sx={{ borderRadius: 20, px: 3 }}
                                        >
                                            Avaliar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <Box display="flex" flexDirection="column" alignItems="center" color="text.secondary">
                                        <CheckCircle sx={{ fontSize: 60, mb: 1, color: '#e0e0e0' }} />
                                        <Typography variant="h6">Tudo limpo!</Typography>
                                        <Typography variant="body2">Não há animais pendentes com esses filtros.</Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                
                <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalCount} 
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="Animais por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
                />
            </>
        )}
      </TableContainer>
    </Box>
  );
}