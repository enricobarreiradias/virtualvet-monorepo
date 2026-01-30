"use client";

import { useEffect, useState } from 'react';
import { 
  Box, Grid, Card, CardContent, Typography, 
  CircularProgress, Stack, Chip, Divider, LinearProgress, Alert,
  Button
} from '@mui/material';
import { 
  Pets, Assessment, Warning, TrendingUp, CalendarToday, CheckCircle,
  Sync
} from '@mui/icons-material';
import { api, AnimalService } from '@/services/api';

// --- INTERFACES ---
interface DashboardStats {
  totalAnimals: number;
  evaluated: number;
  critical: number;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAnimals: 0,
    evaluated: 0,
    critical: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false); 
  const [successMsg, setSuccessMsg] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSuccessMsg('');
    setError('');
    try {
      await AnimalService.sync();
      setSuccessMsg('Sincronização realizada com sucesso! Recarregando dados...');
      
      // Opcional: Recarregar os dados do dashboard após sync
      setTimeout(() => window.location.reload(), 1500); 
    } catch (err) {
      console.error(err);
      setError('Falha ao sincronizar com o ERP externo.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/evaluations/dashboard');
        const data = response.data;

        setStats({
          totalAnimals: data.totalAnimals,
          evaluated: data.totalEvaluations, 
          critical: data.criticalCases      
        });
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError('Falha ao conectar com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color, subtitle }: StatCardProps) => (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box 
        sx={{ 
          position: 'absolute', top: -15, right: -15, 
          opacity: 0.1, transform: 'rotate(15deg)', color: color 
        }}
      >
        {icon}
      </Box>
      <CardContent>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Box p={1} bgcolor={`${color}15`} borderRadius={2} color={color} display="flex">
              {icon}
            </Box>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
              {title}
            </Typography>
          </Box>
          <Box>
            <Typography variant="h3" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-1px' }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <div className="fade-in">
        {error && (
            <Box mb={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        )}

      <Box mb={5} display="flex" justifyContent="space-between" alignItems="end" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={700}>
            Painel de Controle
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visão geral da saúde do rebanho e métricas de avaliação.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
            {/* --- BOTÃO DE SYNC --- */}
            <Button 
                variant="contained" 
                color="primary" 
                startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <Sync />}
                onClick={handleSync}
                disabled={syncing}
                sx={{ height: 40, textTransform: 'none', fontWeight: 'bold' }}
            >
                {syncing ? 'Sincronizando...' : 'Sincronizar '}
            </Button>

            <Chip 
            icon={<CalendarToday sx={{ fontSize: 16 }} />} 
            label={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} 
            variant="outlined" 
            sx={{ bgcolor: 'white', fontWeight: 500, height: 40 }}
            />
        </Stack>
      </Box>

      {/* Se houver mensagem de sucesso, mostre aqui */}
      {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

      {/* KPIs Principais */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="TOTAL DE ANIMAIS" 
            value={stats.totalAnimals} 
            icon={<Pets sx={{ fontSize: 80 }} />}
            color="#0F766E" 
            subtitle="Cadastrados no sistema"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="LAUDOS EMITIDOS" 
            value={stats.evaluated} 
            icon={<Assessment sx={{ fontSize: 80 }} />}
            color="#0ea5e9" 
            subtitle="Avaliações concluídas"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <StatCard 
            title="CASOS CRÍTICOS" 
            value={stats.critical} 
            icon={<Warning sx={{ fontSize: 80 }} />}
            color="#ef4444" 
            subtitle="Exigem atenção imediata"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Gráfico de Progresso */}
        <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                    <Stack direction="row" alignItems="center" gap={2}>
                        <TrendingUp color="primary" />
                        <Typography variant="h6" fontWeight={700}>Progresso das Avaliações</Typography>
                    </Stack>
                </Stack>
                <Divider sx={{ mb: 4 }} />
                
                <Box py={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight={600}>Total Avaliado</Typography>
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                            {stats.totalAnimals > 0 ? Math.round((stats.evaluated / stats.totalAnimals) * 100) : 0}%
                        </Typography>
                    </Box>
                    <LinearProgress 
                        variant="determinate" 
                        value={stats.totalAnimals > 0 ? (stats.evaluated / stats.totalAnimals) * 100 : 0} 
                        sx={{ height: 12, borderRadius: 6, bgcolor: '#f1f5f9' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        {stats.evaluated} de {stats.totalAnimals} animais processados até o momento.
                    </Typography>
                </Box>
                </CardContent>
            </Card>
        </Grid>
        
        {/* Status do Sistema */}
        <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%', bgcolor: '#1E293B', color: 'white' }}>
                <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                    <Stack direction="row" alignItems="center" gap={1} mb={2}>
                        <CheckCircle sx={{ color: '#4ade80' }} />
                        <Typography variant="h6" fontWeight={700}>
                            Sistema Operacional
                        </Typography>
                    </Stack>
                    
                    <Box sx={{ opacity: 0.8 }}>
                        <Typography variant="body2" gutterBottom>
                            • Banco de Dados: <strong>Conectado</strong>
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            • API Services: <strong>Online</strong>
                        </Typography>
                        <Typography variant="body2">
                            • Versão: <strong>v1.0.4-beta</strong>
                        </Typography>
                    </Box>

                    <Box mt={4} pt={3} borderTop="1px solid rgba(255,255,255,0.1)">
                        <Typography variant="caption" sx={{ opacity: 0.5 }}>
                            Última sincronização: {new Date().toLocaleTimeString()}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
      </Grid>
    </div>
  );
}