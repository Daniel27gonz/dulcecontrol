import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileText, RefreshCw } from 'lucide-react';
import { Quotation } from '@/types/quotation';
import { PDFSettings } from '@/types/pdfSettings';
import { getStyledQuotationPDFDataUrl } from '@/lib/generateQuotationPDFStyled';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface PDFPreviewProps {
  quotation: Quotation;
  pdfSettings: PDFSettings;
  currencySymbol: string;
}

export function PDFPreview({ quotation, pdfSettings, currencySymbol }: PDFPreviewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize settings to prevent unnecessary regeneration
  const settingsKey = useMemo(() => {
    return JSON.stringify({
      ...pdfSettings,
      quotationId: quotation.id,
      quotationTotal: quotation.total,
    });
  }, [pdfSettings, quotation.id, quotation.total]);

  const generatePreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Small delay to prevent excessive regeneration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await getStyledQuotationPDFDataUrl(quotation, {
        currencySymbol,
        pdfSettings,
      });

      setPdfUrl(dataUrl);
    } catch (err) {
      console.error('Error generating PDF preview:', err);
      setError('Error al generar la vista previa');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generatePreview();
  }, [settingsKey]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">{error}</p>
        <Button variant="ghost" size="sm" onClick={generatePreview} className="mt-2">
          <RefreshCw className="w-4 h-4 mr-1" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="text-sm text-muted-foreground mt-2">Generando vista previa...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full min-h-[400px] bg-muted rounded-lg overflow-hidden"
    >
      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          className="w-full h-full min-h-[500px]"
          title="Vista previa del PDF"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground">
          <FileText className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-sm">No se puede mostrar la vista previa</p>
        </div>
      )}
    </motion.div>
  );
}
