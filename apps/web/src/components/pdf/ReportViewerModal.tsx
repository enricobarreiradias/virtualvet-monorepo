import React, { useEffect, useState } from 'react';
import { Dialog, Box, CircularProgress, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { PDFViewer } from '@react-pdf/renderer';
import { EvaluationService } from '../../services/api';
import { DentalReportDoc, ReportData } from './DentalReportDoc';

interface Props {
    open: boolean;
    onClose: () => void;
    evaluationId: string | null;
}

export default function ReportViewerModal({ open, onClose, evaluationId }: Props) {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true; 

        const loadReport = async () => {
            if (!open || !evaluationId) return;

            setLoading(true);
            
            try {
                const res = await EvaluationService.getOne(evaluationId);
                
                if (isMounted) {
                    setData(res.data);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    alert("Erro ao carregar os dados do relatório.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadReport();

        return () => {
            isMounted = false;
        };
    }, [open, evaluationId]);

    return (
        <Dialog open={open} onClose={onClose} fullScreen>
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                
                {/* Header */}
                <Box sx={{ p: 2, bgcolor: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Visualização de Laudo</Typography>
                    <IconButton onClick={onClose} sx={{ color: '#fff' }}>
                        <Close />
                    </IconButton>
                </Box>

                {/* Body */}
                <Box sx={{ flex: 1, bgcolor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {loading ? (
                        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <CircularProgress size={50} />
                            <Typography color="text.secondary">Gerando PDF...</Typography>
                        </Box>
                    ) : data ? (
                        <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
                            <DentalReportDoc data={data} />
                        </PDFViewer>
                    ) : (
                        <Typography color="error">Não foi possível carregar os dados.</Typography>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
}