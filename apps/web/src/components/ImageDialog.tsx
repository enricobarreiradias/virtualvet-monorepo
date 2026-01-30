// Arquivo: apps/web/src/components/ImageDialog.tsx
import React from 'react';
import { Dialog, DialogContent, IconButton, Box, Slide, Button, Tooltip } from '@mui/material';
import { Close, Map as MapIcon, OpenInNew } from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface ImageDialogProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string | null;
  altText?: string;
  coordinates?: { lat: string | number, lng: string | number } | null;
}

export function ImageDialog({ open, onClose, imageUrl, altText = 'Imagem ampliada', coordinates }: ImageDialogProps) {
  if (!imageUrl) return null;

  // Função para garantir que coordenadas sejam números
  const hasLocation = coordinates && coordinates.lat && coordinates.lng;
  
  // URL oficial do Google Maps para busca por coordenadas
  const googleMapsUrl = hasLocation 
    ? `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
    : '#';

  return (
    <Dialog
      fullScreen={false}
      maxWidth="lg"
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      PaperProps={{
        sx: { 
          bgcolor: 'black',
          overflow: 'hidden',
          borderRadius: 2,
          position: 'relative',
          minWidth: '50vw' // Garante um tamanho mínimo legal
        }
      }}
    >
      {/* Header com Botão Fechar e Título Opcional */}
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 999, display: 'flex', gap: 1 }}>
        
        {/* Botão de Mapa  */}
        {hasLocation && (
             <Tooltip title="Abrir localização no Google Maps">
                <IconButton 
                    component="a"
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                        bgcolor: 'rgba(25, 118, 210, 0.8)', 
                        color: 'white',
                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 1)' } 
                    }}
                >
                    <MapIcon />
                </IconButton>
             </Tooltip>
        )}

        <IconButton onClick={onClose} sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } }}>
          <Close sx={{ color: 'white' }} />
        </IconButton>
      </Box>

      {/* Conteúdo da Imagem */}
      <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000' }}>
        <img 
          src={imageUrl} 
          alt={altText}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '85vh', 
            objectFit: 'contain',
            display: 'block' 
          }} 
        />
      </DialogContent>

      {/* Barra Inferior com Informações de GPS  */}
      {hasLocation && (
          <Box sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              p: 2, 
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              display: 'flex',
              justifyContent: 'center'
          }}>
            <Button 
                variant="contained" 
                color="info" 
                size="small"
                startIcon={<OpenInNew />}
                href={googleMapsUrl}
                target="_blank"
                sx={{ borderRadius: 20, textTransform: 'none' }}
            >
                Ver local da captura ({coordinates?.lat}, {coordinates?.lng})
            </Button>
          </Box>
      )}
    </Dialog>
  );
}