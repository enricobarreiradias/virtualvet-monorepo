"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Drawer, Toolbar, List, Typography, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Box, Card, Avatar, Tooltip, IconButton, Skeleton
} from '@mui/material';
import { 
  Dashboard, Assignment, History, Logout, ChevronRight, VerifiedUser, People
} from '@mui/icons-material';
import { AuthService } from '../services/api';

const drawerWidth = 280;

// Interface para tipar os dados que vêm da API
interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Busca os dados do usuário ao carregar a Sidebar
  useEffect(() => {
    AuthService.me()
      .then((response) => {
        setUser(response.data.user);
      })
      .catch((error) => {
        console.error("Falha ao carregar perfil:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/';
    }
  };

  // Helper para pegar iniciais (Ex: "Enrico Barreira" -> "EB")
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Helper para formatar o cargo
  const getRoleLabel = (role: string) => {
      return role === 'admin' ? 'Administrador' : 'Veterinário';
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Mesa de Avaliação', icon: <Assignment />, path: '/pending' },
    { text: 'Relatórios', icon: <Assignment />, path: '/reports' },
    { text: 'Histórico', icon: <History />, path: '/history' },
  ];
  // Se for admin, adiciona o item extra
  if (user?.role === 'admin') {
      menuItems.push({ text: 'Equipe', icon: <People />, path: '/users' });
      menuItems.push({ text: 'Auditoria', icon: <History />, path: '/audit' });
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box', 
          border: 'none',
          bgcolor: '#fff', 
          boxShadow: '4px 0 24px rgba(0,0,0,0.02)',
        },
      }}
    >
      <Toolbar sx={{ px: 3, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Image 
            src="/logoFull.png" 
            alt="Logo VirtualVet" 
            width={200} 
            height={150} 
            style={{ objectFit: 'contain' }}
            priority
          />
        </Box>
      </Toolbar>

      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const active = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton 
                component={Link} 
                href={item.path} 
                selected={active}
                sx={{
                  borderRadius: 2, 
                  py: 1.5,
                  '&.Mui-selected': { 
                    bgcolor: 'rgba(0, 0, 0, 0.04)', 
                    color: 'primary.main',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.06)' }
                  },
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} />
                {active && <ChevronRight fontSize="small" sx={{ opacity: 0.5, color: 'primary.main' }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {/* CARD DO USUÁRIO */}
      <Box sx={{ mt: 'auto', p: 3 }}>
         <Card variant="outlined" sx={{ bgcolor: '#f8fafc', border: 'none', borderRadius: 3 }}>
            <Box p={2} display="flex" alignItems="center" gap={2}>
               
               {/* 1. Avatar ou Skeleton */}
               {loading ? (
                 <Skeleton variant="circular" width={40} height={40} />
               ) : (
                 <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14, fontWeight: 'bold' }}>
                    {user ? getInitials(user.fullName) : '?'}
                 </Avatar>
               )}

               <Box flex={1} overflow="hidden">
                  {/* 2. Textos ou Skeletons */}
                  {loading ? (
                    <>
                        <Skeleton variant="text" width="80%" height={20} />
                        <Skeleton variant="text" width="50%" height={15} />
                    </>
                  ) : (
                    <>
                        <Typography variant="subtitle2" fontWeight="bold" noWrap title={user?.fullName}>
                            {user?.fullName || 'Usuário'}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {user?.role === 'admin' && <VerifiedUser sx={{ fontSize: 12, color: 'success.main' }} />}
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {user ? getRoleLabel(user.role) : 'Visitante'}
                            </Typography>
                        </Box>
                    </>
                  )}
               </Box>

               <Tooltip title="Sair do Sistema">
                  <IconButton size="small" color="default" onClick={handleLogout}>
                      <Logout fontSize="small" />
                  </IconButton>
               </Tooltip>
            </Box>
         </Card>
      </Box>
    </Drawer>
  );
}