import { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  MenuItem,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Box,
  Divider,
  Card,
  CardMedia,
  Chip,
  Stack,
  Alert
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { api } from '../services/api';

interface Animal {
  id: string;        
  tagCode: string;
  breed?: string;
}

interface ClinicalEvaluationData {
  animalId: string;  
  isToothAbsent: boolean;
  fractureLevel: string; 
  crownReduction: boolean;
  lingualWear: boolean;
  pulpitis: boolean;
  pulpChamberExposure: boolean;
  gingivalRecession: number; 
  periodontalLesions: string; 
  gingivitis: string; 
  observations: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_EVALUATOR_ID = "d290f1ee-6c54-4b01-90e6-d701748f0851";

const MOCK_PHOTOS = {
  frontal: "https://images.unsplash.com/photo-1546445317-29f4545e9d53?q=80&w=600",
  vestibular: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=600"
};

export function EvaluationModal({ open, onClose, onSuccess }: Props) {
  
  const { register, handleSubmit, control, reset } = useForm<ClinicalEvaluationData>({
    defaultValues: {
      animalId: '', 
      isToothAbsent: false,
      fractureLevel: 'NONE',
      crownReduction: false,
      lingualWear: false,
      pulpitis: false,
      pulpChamberExposure: false,
      gingivalRecession: 0,
      periodontalLesions: 'ABSENT',
      gingivitis: 'ABSENT',
      observations: ''
    }
  });

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      api.get('/animal')
        .then((res) => {
          const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setAnimals(data);
          setErrorMsg(null);
        })
        .catch((err) => {
          console.error("Erro ao buscar animais:", err);
          setErrorMsg("Não foi possível carregar a lista de animais. Verifique se o backend está rodando.");
        });
    }
  }, [open]);

  const handleClose = () => {
    reset();
    setErrorMsg(null);
    onClose();
  };

  const onSubmit = async (data: ClinicalEvaluationData) => {
    try {
      const payload = {
        ...data,
        evaluatorId: DEFAULT_EVALUATOR_ID,
        generalObservations: data.observations
      };

      await api.post('/evaluations', payload);
      alert('Avaliação Clínica Salva com Sucesso!');
      handleClose();
      onSuccess();
    } catch (error) {
      console.error(error);
      setErrorMsg('Erro ao salvar avaliação. Verifique o console.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          VirtualVet: Avaliação Clínica
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Selecione o animal e analise as imagens para preencher o laudo.
        </Typography>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            
            {/* COLUNA DA ESQUERDA: FOTOS */}
            <Box sx={{ width: { xs: '100%', md: '40%' } }}>
              <Box sx={{ mb: 2 }}>
                <TextField
                  select
                  label="Animal / Brinco"
                  {...register('animalId', { required: true })}
                  fullWidth
                  variant="filled"
                  defaultValue=""
                  error={animals.length === 0}
                  helperText={animals.length === 0 ? "Nenhum animal cadastrado no Seed." : ""}
                >
                  {animals.map((animal) => (
                    <MenuItem key={animal.id} value={animal.id}>
                      {animal.tagCode} {animal.breed ? `(${animal.breed})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Imagens (Simulação)
              </Typography>
              
              <Stack spacing={2}>
                <Card>
                  <CardMedia component="img" height="150" image={MOCK_PHOTOS.frontal} alt="Frontal" />
                  <Box sx={{ p: 0.5, textAlign: 'center' }}><Chip label="Frontal" size="small" /></Box>
                </Card>
                <Card>
                  <CardMedia component="img" height="150" image={MOCK_PHOTOS.vestibular} alt="Vestibular" />
                  <Box sx={{ p: 0.5, textAlign: 'center' }}><Chip label="Vestibular" size="small" /></Box>
                </Card>
              </Stack>
            </Box>

            {/* COLUNA DA DIREITA: FORMULÁRIO */}
            <Box sx={{ width: { xs: '100%', md: '60%' }, maxHeight: '65vh', overflowY: 'auto', pr: 1 }}>
              
              <Typography variant="h6" color="primary" gutterBottom>Critérios Dentários</Typography>
              
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <FormControlLabel
                    control={<Controller name="isToothAbsent" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />}
                    label="Ausência Dentária"
                  />
                  <FormControlLabel
                    control={<Controller name="pulpitis" control={control} render={({ field }) => <Switch {...field} checked={field.value} color="error" />} />}
                    label="Pulpite"
                  />
                </Stack>

                <FormControlLabel
                    control={<Controller name="crownReduction" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />}
                    label="Redução de Coroa"
                />
                 <FormControlLabel
                    control={<Controller name="pulpChamberExposure" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />}
                    label="Exposição Câmara Pulpar"
                />

                <Divider sx={{ my: 1 }} />
                
                <Typography variant="subtitle2">Nível de Fratura (0-5)</Typography>
                <TextField select fullWidth size="small" {...register('fractureLevel')} defaultValue="NONE">
                  <MenuItem value="NONE">Ausente (0)</MenuItem>
                  <MenuItem value="LIGHT">Leve (1)</MenuItem>
                  <MenuItem value="MODERATE">Moderada (3)</MenuItem>
                  <MenuItem value="SEVERE">Grave (5)</MenuItem>
                </TextField>
              </Stack>

              <Box sx={{ mt: 4, mb: 1 }}>
                <Typography variant="h6" color="primary" gutterBottom>Avaliação Periodontal</Typography>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography gutterBottom variant="caption">Recessão Gengival (mm)</Typography>
                  <Controller
                    name="gingivalRecession"
                    control={control}
                    render={({ field }) => (
                      <Slider
                        value={field.value}
                        onChange={(_, val) => field.onChange(val)}
                        valueLabelDisplay="auto"
                        step={0.5} min={0} max={10} marks
                      />
                    )}
                  />
                </Box>

                <Stack direction="row" spacing={2}>
                   <TextField select fullWidth size="small" label="Lesões Perio." {...register('periodontalLesions')} defaultValue="ABSENT">
                     <MenuItem value="ABSENT">Ausente</MenuItem>
                     <MenuItem value="MILD">Leve</MenuItem>
                     <MenuItem value="MODERATE">Moderada</MenuItem>
                     <MenuItem value="SEVERE">Severa</MenuItem>
                   </TextField>
                   
                   <TextField select fullWidth size="small" label="Gengivite" {...register('gingivitis')} defaultValue="ABSENT">
                     <MenuItem value="ABSENT">Ausente</MenuItem>
                     <MenuItem value="MILD">Leve</MenuItem>
                     <MenuItem value="SEVERE">Severa</MenuItem>
                   </TextField>
                </Stack>
              </Stack>

              <Box sx={{ mt: 3 }}>
                <TextField
                  label="Observações Gerais"
                  multiline rows={3} fullWidth
                  placeholder="Detalhes adicionais..."
                  {...register('observations')}
                />
              </Box>

            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained">Salvar Avaliação</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}