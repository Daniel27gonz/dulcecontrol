import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Eye, 
  Palette, 
  Type, 
  Building2, 
  Phone, 
  Mail, 
  ImageIcon,
  Check,
  Sparkles,
  FileText,
  Edit3,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Quotation } from '@/types/quotation';
import { PDFSettings, PDFStyle, DEFAULT_PDF_SETTINGS, PDF_STYLE_OPTIONS, COLOR_PRESETS } from '@/types/pdfSettings';
import { usePDFSettings } from '@/hooks/usePDFSettings';
import { useApp } from '@/context/AppContext';
import { LogoUpload } from './LogoUpload';
import { QuotationHTMLPreview } from './QuotationHTMLPreview';
import { downloadStyledQuotationPDF } from '@/lib/generateQuotationPDFStyled';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QuotationDesignerProps {
  quotation?: Quotation;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

// Sample quotation for preview when no quotation is provided
const SAMPLE_QUOTATION: Quotation = {
  id: 'sample',
  number: 'COT-001',
  clientName: 'María García',
  clientEmail: 'maria@ejemplo.com',
  clientPhone: '+52 555 123 4567',
  items: [
    { id: '1', name: 'Pastel de Chocolate 3 Leches', quantity: 1, unitPrice: 450, total: 450 },
    { id: '2', name: 'Cupcakes Decorados (docena)', quantity: 2, unitPrice: 180, total: 360 },
  ],
  subtotal: 810,
  discount: 0,
  discountType: 'percentage',
  total: 810,
  notes: 'Entrega a domicilio incluida',
  status: 'draft',
  validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
};

export function QuotationDesigner({ quotation, trigger, onClose }: QuotationDesignerProps) {
  // Use provided quotation or sample for preview
  const displayQuotation = quotation || SAMPLE_QUOTATION;
  const { settings: appSettings } = useApp();
  const { settings: savedSettings, isLoading, saveSettings } = usePDFSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'preview'>('design');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [localSettings, setLocalSettings] = useState<PDFSettings>(DEFAULT_PDF_SETTINGS);

  // Sync local settings with saved settings
  useEffect(() => {
    if (!isLoading) {
      setLocalSettings({
        ...DEFAULT_PDF_SETTINGS,
        ...savedSettings,
        businessName: savedSettings.businessName || appSettings.userName || '',
      });
    }
  }, [savedSettings, isLoading, appSettings.userName]);

  const handleSettingsChange = useCallback((updates: Partial<PDFSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleStyleChange = (style: PDFStyle) => {
    // Cambiar estilo y ajustar colores predeterminados
    const styleColors = {
      pastel: { primary: '#F8BBD9', secondary: '#FFF0F5' },
      minimal: { primary: '#90A4AE', secondary: '#ECEFF1' },
      elegant: { primary: '#D4A574', secondary: '#FFF8F0' },
    };
    
    handleSettingsChange({ 
      style,
      primaryColor: styleColors[style].primary,
      secondaryColor: styleColors[style].secondary,
    });
  };

  const handleColorPresetChange = (preset: typeof COLOR_PRESETS[0]) => {
    handleSettingsChange({ 
      primaryColor: preset.color,
      secondaryColor: preset.secondary,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveSettings(localSettings);
    setIsSaving(false);
    if (success) {
      toast({
        title: '¡Guardado!',
        description: 'Tu diseño de cotización se ha guardado',
      });
    }
    return success;
  };

  const handleDownload = async () => {
    if (!localSettings.businessName.trim()) {
      toast({
        title: 'Nombre requerido',
        description: 'Por favor ingresa el nombre de tu negocio',
        variant: 'destructive',
      });
      setActiveTab('design');
      return;
    }

    setIsDownloading(true);
    try {
      await downloadStyledQuotationPDF(displayQuotation, {
        currencySymbol: appSettings.currencySymbol,
        pdfSettings: localSettings,
      });

      toast({
        title: 'PDF descargado',
        description: `Tu cotización personalizada está lista`,
      });

      // Save settings after successful download
      saveSettings(localSettings);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el PDF',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose?.();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Sparkles className="w-4 h-4 mr-1" />
      Personalizar
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="w-[98vw] sm:w-[95vw] max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden bg-background p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-2 sm:p-3 md:p-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Diseñador de Cotización
            </DialogTitle>
          </DialogHeader>

          {/* Main content */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
            {/* Left panel - Settings */}
            <div className="w-full lg:w-1/2 lg:border-r flex flex-col min-h-0 flex-1 lg:flex-initial">
              <Tabs 
                value={activeTab} 
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                className="flex flex-col flex-1 min-h-0"
              >
                <TabsList className="w-full grid grid-cols-3 rounded-none border-b bg-muted/50 shrink-0 h-auto">
                  <TabsTrigger value="design" className="gap-1.5 text-xs sm:text-sm py-2.5 sm:py-3 flex-col sm:flex-row">
                    <Palette className="w-4 h-4" />
                    <span>Diseño</span>
                  </TabsTrigger>
                  <TabsTrigger value="content" className="gap-1.5 text-xs sm:text-sm py-2.5 sm:py-3 flex-col sm:flex-row">
                    <Type className="w-4 h-4" />
                    <span>Contenido</span>
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1.5 lg:hidden text-xs sm:text-sm py-2.5 sm:py-3 flex-col sm:flex-row">
                    <Eye className="w-4 h-4" />
                    <span>Vista</span>
                  </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-3 sm:p-4">
                  {/* Design Tab */}
                  <TabsContent value="design" className="mt-0 space-y-4 sm:space-y-6">
                    {/* Business Identity */}
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <h3 className="font-semibold text-sm sm:text-base">Tu negocio</h3>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="businessName" className="text-xs sm:text-sm">Nombre del negocio *</Label>
                          <Input
                            id="businessName"
                            placeholder="Mi Pastelería Artesanal"
                            value={localSettings.businessName}
                            onChange={(e) => handleSettingsChange({ businessName: e.target.value.slice(0, 100) })}
                            className="mt-1 text-sm"
                            maxLength={100}
                          />
                        </div>

                        <div>
                          <Label className="flex items-center gap-1 mb-2 text-xs sm:text-sm">
                            <ImageIcon className="w-3 h-3" />
                            Logo (opcional)
                          </Label>
                          <LogoUpload
                            logoUrl={localSettings.logoUrl}
                            onLogoChange={(url) => handleSettingsChange({ logoUrl: url })}
                          />
                        </div>

                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="businessPhone" className="flex items-center gap-1 text-xs sm:text-sm">
                              <Phone className="w-3 h-3" />
                              Teléfono
                            </Label>
                            <Input
                              id="businessPhone"
                              placeholder="555-123-4567"
                              value={localSettings.businessPhone}
                              onChange={(e) => handleSettingsChange({ businessPhone: e.target.value.slice(0, 20) })}
                              className="mt-1 text-sm"
                              maxLength={20}
                            />
                          </div>
                          <div>
                            <Label htmlFor="businessEmail" className="flex items-center gap-1 text-xs sm:text-sm">
                              <Mail className="w-3 h-3" />
                              Email
                            </Label>
                            <Input
                              id="businessEmail"
                              type="email"
                              placeholder="info@miempresa.com"
                              value={localSettings.businessEmail}
                              onChange={(e) => handleSettingsChange({ businessEmail: e.target.value.slice(0, 100) })}
                              className="mt-1 text-sm"
                              maxLength={100}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Style Selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                        <h3 className="font-semibold text-sm sm:text-base">Estilo base</h3>
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
                        {PDF_STYLE_OPTIONS.map((option) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStyleChange(option.value)}
                            className={cn(
                              'relative flex flex-row xs:flex-col items-center gap-2 xs:gap-1 p-3 rounded-xl border-2 transition-all text-left xs:text-center',
                              localSettings.style === option.value
                                ? 'border-primary bg-primary/10'
                                : 'border-muted hover:border-primary/50'
                            )}
                          >
                            {localSettings.style === option.value && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <span className="font-medium text-sm">{option.label}</span>
                            <span className="text-xs text-muted-foreground flex-1 xs:flex-none">
                              {option.description}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Color Selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                        <h3 className="font-semibold text-sm sm:text-base">Paleta de colores</h3>
                      </div>

                      {/* Color presets - responsive grid */}
                      <div className="grid grid-cols-4 xs:grid-cols-8 gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <motion.button
                            key={preset.color}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleColorPresetChange(preset)}
                            className={cn(
                              'relative aspect-square rounded-lg overflow-hidden transition-all ring-2 ring-offset-2 ring-offset-background',
                              localSettings.primaryColor === preset.color
                                ? 'ring-primary'
                                : 'ring-transparent hover:ring-muted-foreground/30'
                            )}
                            title={preset.name}
                          >
                            <div 
                              className="absolute inset-0"
                              style={{ 
                                background: `linear-gradient(135deg, ${preset.color} 50%, ${preset.secondary} 50%)` 
                              }}
                            />
                            {localSettings.primaryColor === preset.color && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Check className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                            )}
                          </motion.button>
                        ))}
                      </div>

                      {/* Custom color pickers - always visible */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Color principal</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localSettings.primaryColor}
                              onChange={(e) => handleSettingsChange({ primaryColor: e.target.value })}
                              className="w-10 h-10 rounded-lg cursor-pointer border-0 shrink-0"
                            />
                            <Input
                              value={localSettings.primaryColor}
                              onChange={(e) => handleSettingsChange({ primaryColor: e.target.value })}
                              className="flex-1 font-mono text-xs h-10"
                              maxLength={7}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Color secundario</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localSettings.secondaryColor}
                              onChange={(e) => handleSettingsChange({ secondaryColor: e.target.value })}
                              className="w-10 h-10 rounded-lg cursor-pointer border-0 shrink-0"
                            />
                            <Input
                              value={localSettings.secondaryColor}
                              onChange={(e) => handleSettingsChange({ secondaryColor: e.target.value })}
                              className="flex-1 font-mono text-xs h-10"
                              maxLength={7}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Content Tab */}
                  <TabsContent value="content" className="mt-0 space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <h3 className="font-semibold text-sm sm:text-base">Textos editables</h3>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label htmlFor="quotationTitle" className="text-xs sm:text-sm">Título de la cotización</Label>
                          <Input
                            id="quotationTitle"
                            value={localSettings.quotationTitle}
                            onChange={(e) => handleSettingsChange({ quotationTitle: e.target.value.slice(0, 60) })}
                            className="mt-1 text-sm"
                            maxLength={60}
                          />
                        </div>

                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="eventDateLabel" className="text-xs sm:text-sm">Etiqueta de fecha</Label>
                            <Input
                              id="eventDateLabel"
                              value={localSettings.eventDateLabel}
                              onChange={(e) => handleSettingsChange({ eventDateLabel: e.target.value.slice(0, 40) })}
                              className="mt-1 text-sm"
                              maxLength={40}
                            />
                          </div>
                          <div>
                            <Label htmlFor="eventTypeLabel" className="text-xs sm:text-sm">Etiqueta de evento</Label>
                            <Input
                              id="eventTypeLabel"
                              value={localSettings.eventTypeLabel}
                              onChange={(e) => handleSettingsChange({ eventTypeLabel: e.target.value.slice(0, 40) })}
                              className="mt-1 text-sm"
                              maxLength={40}
                            />
                          </div>
                        </div>


                        <div>
                          <Label htmlFor="footerMessage" className="text-xs sm:text-sm">Mensaje del pie</Label>
                          <Textarea
                            id="footerMessage"
                            value={localSettings.footerMessage}
                            onChange={(e) => handleSettingsChange({ footerMessage: e.target.value.slice(0, 200) })}
                            className="mt-1 text-sm"
                            rows={2}
                            maxLength={200}
                          />
                        </div>

                        <div>
                          <Label htmlFor="thankYouMessage" className="text-xs sm:text-sm">Mensaje de agradecimiento</Label>
                          <Input
                            id="thankYouMessage"
                            value={localSettings.thankYouMessage}
                            onChange={(e) => handleSettingsChange({ thankYouMessage: e.target.value.slice(0, 80) })}
                            className="mt-1 text-sm"
                            maxLength={80}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Mobile/Tablet Preview Tab */}
                  <TabsContent value="preview" className="mt-0 lg:hidden">
                    <div className="p-2">
                      <QuotationHTMLPreview
                        quotation={displayQuotation}
                        pdfSettings={localSettings}
                        currencySymbol={appSettings.currencySymbol}
                      />
                    </div>
                  </TabsContent>
                  </div>
                </ScrollArea>
              </Tabs>
            </div>

            {/* Right panel - Live Preview (desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col bg-muted/30 min-h-0">
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50 shrink-0">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Vista previa en tiempo real</span>
              </div>
              <ScrollArea className="flex-1 p-4 min-h-0">
                <QuotationHTMLPreview
                  quotation={displayQuotation}
                  pdfSettings={localSettings}
                  currencySymbol={appSettings.currencySymbol}
                />
              </ScrollArea>
            </div>
          </div>

          {/* Footer with actions */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 p-3 sm:p-4 border-t bg-muted/30 shrink-0">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
              className="gap-1 text-xs sm:text-sm h-9 sm:h-10"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>

            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                onClick={() => handleOpenChange(false)}
                className="text-xs sm:text-sm h-9 sm:h-10 flex-1 xs:flex-initial"
              >
                Cerrar
              </Button>
              <Button 
                variant="warm" 
                onClick={handleDownload}
                disabled={isDownloading}
                className="gap-1 text-xs sm:text-sm h-9 sm:h-10 flex-1 xs:flex-initial"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {isDownloading ? 'Generando...' : 'Descargar PDF'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}