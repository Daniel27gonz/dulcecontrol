import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Settings2, Eye, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Quotation } from '@/types/quotation';
import { PDFSettings, DEFAULT_PDF_SETTINGS } from '@/types/pdfSettings';
import { usePDFSettings } from '@/hooks/usePDFSettings';
import { useApp } from '@/context/AppContext';
import { PDFSettingsForm } from './PDFSettingsForm';
import { PDFPreview } from './PDFPreview';
import { downloadStyledQuotationPDF } from '@/lib/generateQuotationPDFStyled';
import { toast } from '@/hooks/use-toast';

interface PDFCustomizeDialogProps {
  quotation: Quotation;
  trigger?: React.ReactNode;
}

export function PDFCustomizeDialog({ quotation, trigger }: PDFCustomizeDialogProps) {
  const { settings: appSettings } = useApp();
  const { settings: savedSettings, isLoading, saveSettings, updateSettings } = usePDFSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'preview'>('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<PDFSettings>(DEFAULT_PDF_SETTINGS);

  // Sync local settings with saved settings
  useEffect(() => {
    if (!isLoading) {
      setLocalSettings({
        ...savedSettings,
      });
    }
  }, [savedSettings, isLoading, appSettings.userName]);

  const handleSettingsChange = (newSettings: Partial<PDFSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveSettings(localSettings);
    setIsSaving(false);
    return success;
  };

  const handleDownload = async () => {
    try {
      await downloadStyledQuotationPDF(quotation, {
        currencySymbol: appSettings.currencySymbol,
        pdfSettings: localSettings,
      });

      toast({
        title: 'PDF descargado',
        description: `Cotización #${quotation.number} guardada`,
      });

      // Save settings after successful download
      saveSettings(localSettings);
      setIsOpen(false);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings2 className="w-4 h-4 mr-1" />
            Personalizar PDF
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            Personalizar cotización #{quotation.number}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 h-full">
          {/* Settings panel */}
          <div className="md:w-1/2 flex flex-col">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'settings' | 'preview')}
              className="flex-1"
            >
              <TabsList className="w-full md:hidden">
                <TabsTrigger value="settings" className="flex-1">
                  <Settings2 className="w-4 h-4 mr-1" />
                  Configurar
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Vista previa
                </TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="mt-4 md:mt-0 flex-1 overflow-y-auto max-h-[60vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <PDFSettingsForm
                    settings={localSettings}
                    onSettingsChange={handleSettingsChange}
                    onSave={handleSave}
                    isSaving={isSaving}
                  />
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-4 md:hidden">
                <PDFPreview
                  quotation={quotation}
                  pdfSettings={localSettings}
                  currencySymbol={appSettings.currencySymbol}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview panel - desktop only */}
          <div className="hidden md:block md:w-1/2 border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Vista previa</span>
            </div>
            <PDFPreview
              quotation={quotation}
              pdfSettings={localSettings}
              currencySymbol={appSettings.currencySymbol}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button variant="warm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
