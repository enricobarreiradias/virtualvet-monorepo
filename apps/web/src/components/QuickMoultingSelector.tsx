import React from 'react';
import { Box, Typography, Button, Stack, Tooltip, Paper } from '@mui/material';
import { AccessTime } from '@mui/icons-material';
import { MoultingStage } from '../types/dental'; 

interface Props {
  onSelect: (stage: MoultingStage) => void;
}

export default function QuickMoultingSelector({ onSelect }: Props) {
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f1f5f9', borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2} justifyContent="space-between">
        
        <Box display="flex" alignItems="center" gap={1}>
            <AccessTime color="primary" />
            <Box>
                <Typography variant="subtitle2" fontWeight="bold">Cronologia Dentária (Atalho)</Typography>
                <Typography variant="caption" color="text.secondary">Define idade e marca como saudável</Typography>
            </Box>
        </Box>

        <Stack direction="row" spacing={1}>
            <Tooltip title="Dente de Leite (Jovem)">
                <Button variant="contained" size="small" color="secondary" onClick={() => onSelect(MoultingStage.DL)}>DL</Button>
            </Tooltip>
            <Tooltip title="2 Dentes (Pinças)">
                <Button variant="outlined" size="small" onClick={() => onSelect(MoultingStage.D2)}>2D</Button>
            </Tooltip>
            <Tooltip title="4 Dentes (1º Médios)">
                <Button variant="outlined" size="small" onClick={() => onSelect(MoultingStage.D4)}>4D</Button>
            </Tooltip>
            <Tooltip title="6 Dentes (2º Médios)">
                <Button variant="outlined" size="small" onClick={() => onSelect(MoultingStage.D6)}>6D</Button>
            </Tooltip>
            <Tooltip title="Boca Cheia (Adulto)">
                <Button variant="contained" size="small" color="primary" onClick={() => onSelect(MoultingStage.BC)}>BC</Button>
            </Tooltip>
        </Stack>

      </Stack>
    </Paper>
  );
}