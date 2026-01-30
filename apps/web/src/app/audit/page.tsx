"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import { HistoryEdu, Person, Delete, Edit, AddCircle, Sync, Assignment } from '@mui/icons-material';
import { api } from '../../services/api'; 

// Interface 
interface Log {
  id: number;
  action: string;
  entity: string;
  details: string;
  createdAt: string;
  user?: { fullName: string; email: string };
}

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [userFilter, setUserFilter] = useState('ALL');

  useEffect(() => {
    api.get('/audit')
      .then(res => setLogs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Extrair usuários únicos
  const uniqueUsers = Array.from(new Set(logs.map(log => log.user?.fullName).filter(Boolean)));

  // Helper de ícones
  const getIcon = (action: string, entity: string) => {
      if (entity === 'ExternalApi' || action.includes('SYNC')) return <Sync color="info" fontSize="small" />;
      if (entity === 'Evaluation') return <Assignment color="secondary" fontSize="small" />;
      if (action.includes('CREATE')) return <AddCircle color="success" fontSize="small" />;
      if (action.includes('DELETE') || action.includes('REMOVE')) return <Delete color="error" fontSize="small" />;
      if (action.includes('UPDATE')) return <Edit color="warning" fontSize="small" />;
      return <HistoryEdu color="action" fontSize="small" />;
  };

  // Lógica de filtro combinado
  const filteredLogs = logs.filter(log => {
      // 1. Filtro de Categoria
      const matchesCategory = () => {
          if (categoryFilter === 'ALL') return true;
          if (categoryFilter === 'SYNC') return log.entity === 'ExternalApi' || log.action.includes('SYNC');
          if (categoryFilter === 'EVALUATION') return log.entity === 'Evaluation';
          if (categoryFilter === 'ANIMAL') return log.entity === 'Animal';
          if (categoryFilter === 'USER_MGMT') return log.entity === 'User'; 
          return true;
      };

      // 2. Filtro de Usuário
      const matchesUser = () => {
          if (userFilter === 'ALL') return true;
          if (userFilter === 'SYSTEM') return !log.user;
          return log.user?.fullName === userFilter;
      };

      return matchesCategory() && matchesUser();
  });

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

      {/* ÁREA DE FILTROS */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }} elevation={0} variant="outlined">
        <Grid container spacing={2}>
            {/* Filtro de Categoria */}
            <Grid size={{ xs: 12, md: 4 }}>
                <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                    <InputLabel>Filtrar por Categoria</InputLabel>
                    <Select
                        value={categoryFilter}
                        label="Filtrar por Categoria"
                        onChange={(e) => setCategoryFilter(e.target.value)}
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
                        value={userFilter}
                        label="Filtrar por Responsável"
                        onChange={(e) => setUserFilter(e.target.value)}
                    >
                        <MenuItem value="ALL">Todos os Responsáveis</MenuItem>
                        <MenuItem value="SYSTEM">Sistema (Automático)</MenuItem>
                        {uniqueUsers.map(user => (
                            <MenuItem key={user as string} value={user as string}>{user as string}</MenuItem>
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
              {filteredLogs.map((log) => (
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
              {filteredLogs.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          Nenhum registro encontrado para estes filtros.
                      </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>
    </Box>
  );
}