import { useState, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  Typography,
  Divider,
  Stack,
  Avatar,
  TextField,
  IconButton,
} from "@mui/material";

import { Close, CloudUpload, Delete, PictureAsPdf } from "@mui/icons-material";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";

import {
  StatsReportDoc,
  StatsReportOptions,
  ReportStatsData,
  PathologyItem,
} from "./StatsReportDoc";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  data: ReportStatsData;
  pathologyList: PathologyItem[];
  filters: {
    farm: string;
    client: string;
    period: string;
  };
  user: {
    name: string;
  };
}

export default function StatsReportModal({
  open,
  onClose,
  data,
  pathologyList,
  filters,
  user,
}: ModalProps) {
  const [options, setOptions] = useState<StatsReportOptions>({
    showGeneralStats: true,
    showPathologyList: true,
    showCriticalList: true,
    clientLogo: null,
    clientName: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOptions((prev) => ({
          ...prev,
          clientLogo: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle
        sx={{
          borderBottom: "1px solid #eee",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Configurar Relatório
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Personalize o conteúdo antes de imprimir
          </Typography>
        </Box>

        <Box display="flex" gap={2}>
          <PDFDownloadLink
            document={
              <StatsReportDoc
                stats={data}
                pathologyList={pathologyList}
                filters={filters}
                user={user}
                options={options}
              />
            }
            fileName={`Relatorio_VirtualVet_${new Date().toISOString().split("T")[0]}.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="contained"
                color="success"
                disabled={loading}
                startIcon={<PictureAsPdf />}
              >
                {loading ? "Gerando..." : "Baixar PDF"}
              </Button>
            )}
          </PDFDownloadLink>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", height: "80vh", p: 0 }}>
        {/* MENU LATERAL */}
        <Box
          sx={{
            width: 320,
            borderRight: "1px solid #eee",
            p: 3,
            bgcolor: "#f8fafc",
            overflowY: "auto",
          }}
        >
          <Typography
            variant="overline"
            fontWeight="bold"
            color="text.secondary"
          >
            CONTEÚDO
          </Typography>
          <Stack spacing={1} mt={1} mb={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.showGeneralStats}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      showGeneralStats: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Typography variant="body2">Resumo Geral (KPIs)</Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.showPathologyList}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      showPathologyList: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Typography variant="body2">Gráfico de Patologias</Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.showCriticalList}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      showCriticalList: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Typography variant="body2">
                  Lista de Críticos (Top 5)
                </Typography>
              }
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="overline"
            fontWeight="bold"
            color="text.secondary"
          >
            PERSONALIZAÇÃO
          </Typography>

          <Box mt={2}>
            <TextField
              fullWidth
              size="small"
              label="Nome do Cliente (Opcional)"
              variant="outlined"
              value={options.clientName}
              onChange={(e) =>
                setOptions({ ...options, clientName: e.target.value })
              }
              sx={{ mb: 3, bgcolor: "white" }}
            />

            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary"
              gutterBottom
            >
              LOGO DO CLIENTE
            </Typography>

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={2}
              mt={1}
              p={2}
              border="1px dashed #cbd5e1"
              borderRadius={2}
              bgcolor="white"
            >
              {options.clientLogo ? (
                <>
                  <Avatar
                    src={options.clientLogo}
                    sx={{ width: 80, height: 60 }}
                    variant="rounded"
                  />
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setOptions({ ...options, clientLogo: null })}
                  >
                    Remover
                  </Button>
                </>
              ) : (
                <Button
                  component="label"
                  fullWidth
                  startIcon={<CloudUpload />}
                  sx={{ textTransform: "none" }}
                >
                  Carregar Imagem
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                  />
                </Button>
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 1,
                display: "block",
                textAlign: "center",
                fontSize: 10,
              }}
            >
              A logo aparecerá no canto superior direito do PDF.
            </Typography>
          </Box>
        </Box>

        {/* PREVIEW PDF */}
        <Box
          sx={{
            flex: 1,
            bgcolor: "#525659",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <PDFViewer
            width="100%"
            height="100%"
            showToolbar={false}
            style={{ border: "none" }}
          >
            <StatsReportDoc
              stats={data}
              pathologyList={pathologyList}
              filters={filters}
              user={user}
              options={options}
            />
          </PDFViewer>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
