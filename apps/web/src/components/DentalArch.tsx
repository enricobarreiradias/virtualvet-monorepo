"use client";

import { Box, Paper, Typography, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ToothCode } from '../types/dental'; 

// Definição da escala de severidade (para garantir 0-1-2)
const SeverityScale = {
  NONE: 0,
  MODERATE: 1,
  SEVERE: 2
};

//eslint-disable-next-line @typescript-eslint/no-explicit-any
const getToothSeverity = (data: any) => {
  if (!data || !data.isPresent) return SeverityScale.NONE;

  // Lista de campos que influenciam a cor do dente
  const severityValues = [
    data.fractureLevel,
    data.pulpitis,
    data.crownReductionLevel,   
    data.gingivalRecessionLevel,
    data.lingualWear,
    data.periodontalLesions,
    data.caries
  ];

  return Math.max(...severityValues.map(v => Number(v) || 0));
};

// 2. Cores baseadas na nova severidade (0, 1, 2)
const getSeverityColor = (level: number) => {
  if (level >= SeverityScale.SEVERE) return '#ef4444'; 
  if (level === SeverityScale.MODERATE) return '#facc15'; 
  return '#e2e8f0'; 
};

const ToothButton = styled(Paper)<{ selected?: boolean; severity: number }>(({ theme, selected, severity }) => ({
  width: 60,
  height: 80,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: selected ? `3px solid ${theme.palette.primary.main}` : '2px solid transparent',
  backgroundColor: getSeverityColor(severity),
  transition: 'all 0.2s ease',
  borderRadius: '0 0 16px 16px', 
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4]
  }
}));

interface DentalArchProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teethData: Record<string, any>; 
  selectedTooth: string | null;
  onSelectTooth: (code: string) => void;
}

export default function DentalArch({ teethData, selectedTooth, onSelectTooth }: DentalArchProps) {
  
  // Ordem anatômica: Canto Esq -> Centro <- Canto Dir
  const leftTeeth = [ToothCode.I4_LEFT, ToothCode.I3_LEFT, ToothCode.I2_LEFT, ToothCode.I1_LEFT];
  const rightTeeth = [ToothCode.I1_RIGHT, ToothCode.I2_RIGHT, ToothCode.I3_RIGHT, ToothCode.I4_RIGHT];

  const renderTooth = (code: string, label: string) => {
    const data = teethData[code] || { isPresent: true };
    
    const maxSeverity = getToothSeverity(data);
    
    const displayCode = code.split('_')[0]; 

    return (
      <Tooltip title={`${label} - ${code}`} key={code} placement="top">
        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
           <Typography variant="caption" color="text.secondary" fontWeight="bold">
             {displayCode}
           </Typography>
           
           <ToothButton 
             elevation={1}
             selected={selectedTooth === code}
             severity={maxSeverity} 
             onClick={() => onSelectTooth(code)}
             sx={{ opacity: data.isPresent ? 1 : 0.4 }} 
           >
             {/* Exibe o número apenas se tiver algum problema (> 0) */}
             {maxSeverity > 0 && (
                <Typography variant="h6" fontWeight="900" sx={{ opacity: 0.7 }}>
                  {maxSeverity}
                </Typography>
             )}
             {!data.isPresent && (
                <Typography variant="caption" sx={{ fontSize: 10 }}>AUSENTE</Typography>
             )}
           </ToothButton>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box 
      p={3} 
      bgcolor="#f8fafc" 
      borderRadius={4} 
      border="1px dashed #cbd5e1"
      display="flex" 
      justifyContent="center"
      flexDirection="column"
      alignItems="center"
    >
      <Typography variant="overline" color="text.secondary" gutterBottom>
        Arcada Inferior (Incisivos)
      </Typography>
      
      <Box display="flex" gap={4} mt={2}>
        {/* Lado Esquerdo */}
        <Box display="flex" gap={1}>
          {leftTeeth.map(code => renderTooth(code, 'Lado Esquerdo'))}
        </Box>
        
        {/* Divisor Central (Linha média) */}
        <Box width={2} height={60} bgcolor="#cbd5e1" borderRadius={1} alignSelf="center" />

        {/* Lado Direito */}
        <Box display="flex" gap={1}>
          {rightTeeth.map(code => renderTooth(code, 'Lado Direito'))}
        </Box>
      </Box>
      
      {/* Legenda para Regra 0-1-2 */}
      <Box mt={3} display="flex" gap={3}>
         <Box display="flex" alignItems="center" gap={1}>
            <Box width={12} height={12} bgcolor="#e2e8f0" borderRadius="50%" border="1px solid #cbd5e1" />
            <Typography variant="caption">Normal (0)</Typography>
         </Box>
         <Box display="flex" alignItems="center" gap={1}>
            <Box width={12} height={12} bgcolor="#facc15" borderRadius="50%" />
            <Typography variant="caption">Moderado (1)</Typography>
         </Box>
         <Box display="flex" alignItems="center" gap={1}>
            <Box width={12} height={12} bgcolor="#ef4444" borderRadius="50%" />
            <Typography variant="caption" fontWeight="bold">Crítico (2)</Typography>
         </Box>
      </Box>
    </Box>
  );
}