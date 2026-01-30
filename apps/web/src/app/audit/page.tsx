"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Grid, TablePagination
} from '@mui/material';
import { HistoryEdu, Person, Delete, Edit, AddCircle, Sync, Assignment } from '@mui/icons-material';
import { api } from '../../services/api'; 

// Interfaces
interface Log {
  id: number;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
  user?: { id: number; fullName: string; email: string };
}

interface UserOption {
    id: number;
    fullName: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // Estados de Paginação
  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtros
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [userIdFilter, setUserIdFilter] = useState<string | number>('ALL');
  const [usersList, setUsersList] = useState<UserOption[]>([]);

  // Buscar logs no backend com filtros e paginação
  const fetchLogs = async () => {
    setLoading(true);
    try {
        //eslint-disable-next-line @typescript-eslint/no-explicit-any
        const params: any = {
            page: page + 1,
            limit: rowsPerPage,
            category: categoryFilter,
        };

        if (userIdFilter !== 'ALL') {
            params.userId = userIdFilter;
        }

        const res = await api.get('/audit', { params });
        
        setLogs(res.data.data);
        setTotalLogs(res.data.total);

        // Preencher lista de utilizadores para o filtro 
        const uniqueUsers = new Map();
        res.data.data.forEach((log: Log) => {
            if (log.user) uniqueUsers.set(log.user.id, log.user.fullName);
        });
        if (usersList.length === 0 && uniqueUsers.size > 0) {
             setUsersList(Array.from(uniqueUsers, ([id, fullName]) => ({ id, fullName })));
        }

    } catch (err) {
        console.error("Erro ao buscar logs", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, categoryFilter, userIdFilter]);

  // Handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper de ícones
  const getIcon = (action: string, entity: string) => {
      if (entity === 'ExternalApi' || action.includes('SYNC')) return <Sync color="info" fontSize="small" />;
      if (entity === 'Evaluation') return <Assignment color="secondary" fontSize="small" />;
      if (action.includes('CREATE')) return <AddCircle color="success" fontSize="small" />;
      if (action.includes('DELETE') || action.includes('REMOVE')) return <Delete color="error" fontSize="small" />;
      if (action.includes('UPDATE')) return <Edit color="warning" fontSize="small" />;
      return <HistoryEdu color="action" fontSize="small" />;
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box mb={4}>
          <Typography variant="h4" fontWeight={800} color="primary" gutterBottom>
              Logs de Auditoria
          </Typography>
          <Typography variant="body1" color="text.secondary">
              Controle de atividades, sincronizações e acessos.
          </Typography>
      </Box>

      {/* ÁREA DE FILTROS  */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }} elevation={0} variant="outlined">
        <Grid container spacing={2}>
            {/* Filtro de Categoria */}
            <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                    <InputLabel>Filtrar por Categoria</InputLabel>
                    <Select
                        value={categoryFilter}
                        label="Filtrar por Categoria"
                        onChange={(e) => {
                            setCategoryFilter(e.target.value);
                            setPage(0);
                        }}
                    >
                        <MenuItem value="ALL">Todas as Categorias</MenuItem>
                        <MenuItem value="EVALUATION">Avaliações e Relatórios</MenuItem>
                        <MenuItem value="SYNC">Sincronização API</MenuItem>
                        <MenuItem value="ANIMAL">Gestão de Animais</MenuItem>
                        <MenuItem value="USER_MGMT">Alterações de Usuários</MenuItem>
                    </Select>
                </FormControl>
            </Grid>

            {/* Filtro de Responsável */}
            <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                    <InputLabel>Filtrar por Responsável</InputLabel>
                    <Select
                        value={userIdFilter}
                        label="Filtrar por Responsável"
                        onChange={(e) => {
                            setUserIdFilter(e.target.value);
                            setPage(0);
                        }}
                    >
                        <MenuItem value="ALL">Todos os Responsáveis</MenuItem>
                        {usersList.map(u => (
                            <MenuItem key={u.id} value={u.id}>{u.fullName}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
      </Paper>

      {/* TABELA */}
      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        {loading ? (
           <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : (
          <>
            <Table>
                <TableHead sx={{ bgcolor: '#fff' }}>
                <TableRow>
                    <TableCell>Data/Hora</TableCell>
                    <TableCell>Responsável</TableCell>
                    <TableCell>Ação</TableCell>
                    <TableCell>Alvo</TableCell>
                    <TableCell>Detalhes</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {logs.map((log) => (
                    <TableRow key={log.id} hover>
                    <TableCell sx={{ fontSize: '0.85rem', width: 180 }}>
                        {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Person fontSize="small" color={log.user ? "primary" : "disabled"} />
                            <Typography variant="body2" fontWeight={log.user ? "500" : "400"}>
                                {log.user?.fullName || 'Sistema'}
                            </Typography>
                        </Box>
                    </TableCell>
                    <TableCell>
                        <Chip 
                            icon={getIcon(log.action, log.entity)} 
                            label={log.action} 
                            size="small" 
                            variant="outlined" 
                            sx={{ fontWeight: 'bold' }}
                        />
                    </TableCell>
                    <TableCell>
                        <Chip label={log.entity} size="small" color="default" />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                        {log.details}
                    </TableCell>
                    </TableRow>
                ))}
                {logs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            Nenhum registro encontrado.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            
            {/* PAGINAÇÃO */}
            <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalLogs}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Linhas por página"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </TableContainer>
    </Box>
  );
}