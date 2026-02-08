import { useEffect, useState } from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Slide,
  Button,
} from "@mui/material";
import { Close, Download } from "@mui/icons-material";
import { TransitionProps } from "@mui/material/transitions";
import React from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { EvaluationService } from "../../services/api";
import { DentalReportDoc, ReportData } from "./DentalReportDoc";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// [NOVO] Adicionada prop user
interface Props {
  open: boolean;
  onClose: () => void;
  evaluationId: string | null;
  user?: { name: string; email?: string } | null;
}

export default function ReportViewerModal({
  open,
  onClose,
  evaluationId,
  user, // Recebe o usuário da HistoryPage
}: Props) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      if (!open || !evaluationId) {
        if (isActive) setData(null);
        return;
      }

      if (isActive) setLoading(true);

      try {
        const response = await EvaluationService.getOne(evaluationId);
        if (isActive) {
          setData(response.data);
        }
      } catch (err) {
        console.error("Erro ao carregar laudo:", err);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, [open, evaluationId]);

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative", bgcolor: "#0F766E" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="fechar"
          >
            <Close />
          </IconButton>

          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Visualização de Laudo Individual
          </Typography>

          {!loading && data && (
            <PDFDownloadLink
              // [NOVO] Passa o user para o PDF para gerar o botão de download
              document={
                <DentalReportDoc
                  data={data}
                  user={
                    user
                      ? { name: user.name || user.email || "Usuário" }
                      : undefined
                  }
                />
              }
              fileName={`Laudo_${data.animal?.tagCode || "Animal"}_${evaluationId}.pdf`}
              style={{ textDecoration: "none", color: "white" }}
            >
              {({ loading: pdfLoading }) => (
                <Button color="inherit" startIcon={<Download />}>
                  {pdfLoading ? "Gerando..." : "Baixar"}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          bgcolor: "#525659",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        {loading ? (
          <Box textAlign="center" color="white">
            <CircularProgress color="inherit" />
            <Typography mt={2}>Carregando dados da avaliação...</Typography>
          </Box>
        ) : data ? (
          <PDFViewer
            width="100%"
            height="100%"
            showToolbar={true}
            style={{ border: "none" }}
          >
            {/* [NOVO] Passa o user para o PDF na visualização */}
            <DentalReportDoc
              data={data}
              user={
                user
                  ? { name: user.name || user.email || "Usuário" }
                  : undefined
              }
            />
          </PDFViewer>
        ) : (
          <Typography color="white">Nenhum dado carregado.</Typography>
        )}
      </Box>
    </Dialog>
  );
}
