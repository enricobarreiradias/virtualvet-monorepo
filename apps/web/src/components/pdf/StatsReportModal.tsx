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
  Collapse,
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
  // Opções gerais do relatório
  const [options, setOptions] = useState<StatsReportOptions>({
    showGeneralStats: true,
    showPathologyList: true,
    showChronology: true,
    showCriticalList: true,
    clientLogo: null,
    clientName: "",
  });

  // --- CORREÇÃO DO ERRO ---
  // 1. Armazenamos a lista anterior para comparar se houve mudança
  const [prevPathologyList, setPrevPathologyList] = useState(pathologyList);

  // 2. Inicializamos o estado (Lazy Initialization)
  const [selectedPathologies, setSelectedPathologies] = useState<string[]>(() =>
    pathologyList.map((p) => p.key),
  );

  // 3. Padrão "Adjust State on Prop Change":
  // Se a prop mudou desde a última renderização, atualizamos o estado IMEDIATAMENTE.
  // Isso evita o "useEffect" e o erro de renderização em cascata.
  if (pathologyList !== prevPathologyList) {
    setPrevPathologyList(pathologyList);
    setSelectedPathologies(pathologyList.map((p) => p.key));
  }
  // -------------------------

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipula a seleção individual de patologias
  const handlePathologyToggle = (key: string) => {
    setSelectedPathologies((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

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

  // Filtra a lista antes de passar para o PDF
  const filteredPathologyList = pathologyList.filter((item) =>
    selectedPathologies.includes(item.key),
  );

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
                pathologyList={filteredPathologyList} // Passamos a lista filtrada
                filters={filters}
                user={user}
                options={options}
              />
            }
            fileName={`Relatorio_VirtualVet_${
              new Date().toISOString().split("T")[0]
            }.pdf`}
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
            width: 400,
            borderRight: "1px solid #eee",
            p: 4,
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
            {/* 1. KPIs */}
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

            {/* 2. CRONOLOGIA */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={options.showChronology !== false}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      showChronology: e.target.checked,
                    })
                  }
                />
              }
              label={
                <Typography variant="body2">Cronologia (Idade)</Typography>
              }
            />

            <Divider sx={{ my: 1, borderStyle: "dashed" }} />

            {/* 3. PATOLOGIAS (COM SUB-SELEÇÃO) */}
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
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
                    <Typography variant="body2" fontWeight="bold">
                      Gráfico de Patologias
                    </Typography>
                  }
                />
                {options.showPathologyList && (
                  <Typography variant="caption" color="text.secondary">
                    {selectedPathologies.length}/{pathologyList.length}
                  </Typography>
                )}
              </Box>

              {/* Lista Expansível de Patologias */}
              <Collapse in={options.showPathologyList}>
                <Box
                  sx={{
                    pl: 4, // Indentação
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                    mt: 1,
                    mb: 2,
                    borderLeft: "2px solid #e2e8f0",
                  }}
                >
                  {pathologyList.length > 0 ? (
                    pathologyList.map((item) => (
                      <FormControlLabel
                        key={item.key}
                        sx={{ ml: 1, height: 28 }} // Mais compacto
                        control={
                          <Checkbox
                            size="small"
                            checked={selectedPathologies.includes(item.key)}
                            onChange={() => handlePathologyToggle(item.key)}
                          />
                        }
                        label={
                          <Typography variant="caption">
                            {item.label} ({item.count})
                          </Typography>
                        }
                      />
                    ))
                  ) : (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 2, fontStyle: "italic" }}
                    >
                      Nenhuma patologia no período.
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>

            <Divider sx={{ my: 1, borderStyle: "dashed" }} />

            {/* 4. LISTA CRÍTICA */}
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

          {/* PERSONALIZAÇÃO */}
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
              p={3}
              border="1px dashed #cbd5e1"
              borderRadius={2}
              bgcolor="white"
            >
              {options.clientLogo ? (
                <>
                  <Avatar
                    src={options.clientLogo}
                    sx={{ width: 100, height: 80 }}
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
                  sx={{ textTransform: "none", py: 2 }}
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
            overflow: "hidden",
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
              pathologyList={filteredPathologyList} // Envia apenas as selecionadas
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
