import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Send, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  CheckCircle,
  ShoppingCart,
  Clock,
  Copy,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Quotation } from '@/types/quotation';
import { useApp } from '@/context/AppContext';
import { useQuotations } from '@/hooks/useQuotations';
import { usePDFSettings } from '@/hooks/usePDFSettings';
import { QuotationForm } from './QuotationForm';
import { downloadStyledQuotationPDF } from '@/lib/generateQuotationPDFStyled';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface QuotationCardProps {
  quotation: Quotation;
  onUpdate?: () => void;
}

export function QuotationCard({ quotation, onUpdate }: QuotationCardProps) {
  const { settings, addOrder, recipes, calculateRecipeCost } = useApp();
  const { updateQuotation, deleteQuotation, duplicateQuotation } = useQuotations();
  const { settings: pdfSettings, isLoading: isPdfSettingsLoading } = usePDFSettings();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const isExpired = isPast(parseISO(quotation.validUntil));

  const statusConfig = {
    draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground' },
    sent: { label: 'Enviada', color: 'bg-primary/20 text-primary' },
    accepted: { label: 'Aceptada', color: 'bg-success/20 text-success' },
    rejected: { label: 'Rechazada', color: 'bg-destructive/20 text-destructive' },
    converted: { label: 'Convertida', color: 'bg-caramel/20 text-caramel' },
  };

  const status = statusConfig[quotation.status];

  const formatCurrency = (amount: number) => {
    return `${settings.currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const handleQuickDownload = async () => {
    // Use saved settings with fallback to user name
    const effectiveSettings = {
      ...pdfSettings,
      businessName: pdfSettings.businessName || settings.userName || 'Mi Negocio de Postres',
    };

    setIsDownloading(true);
    try {
      await downloadStyledQuotationPDF(quotation, {
        currencySymbol: settings.currencySymbol,
        pdfSettings: effectiveSettings,
      });
      toast({
        title: 'PDF descargado',
        description: `Cotización #${quotation.number} guardada`,
      });
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

  const handleSendWhatsApp = async () => {
    if (!quotation.clientPhone) {
      toast({
        title: 'Sin número de teléfono',
        description: 'Agrega el teléfono del cliente para enviar por WhatsApp',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      // Generate summary message
      const itemsList = quotation.items
        .map(item => `• ${item.name} x${item.quantity} - ${formatCurrency(item.total)}`)
        .join('\n');

      const message = `
🧁 *COTIZACIÓN #${quotation.number}*
━━━━━━━━━━━━━━━━━━

Hola ${quotation.clientName}! 👋

Aquí está tu cotización:

${itemsList}

${quotation.discount > 0 ? `\n💫 Descuento: -${formatCurrency(quotation.subtotal - quotation.total)}\n` : ''}
💰 *TOTAL: ${formatCurrency(quotation.total)}*

📅 Válida hasta: ${format(parseISO(quotation.validUntil), "d 'de' MMMM", { locale: es })}
${quotation.notes ? `\n📝 ${quotation.notes}` : ''}

¡Gracias por tu preferencia! 🎂
      `.trim();

      // Clean phone number
      const phone = quotation.clientPhone.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');

      // Update status to sent
      updateQuotation(quotation.id, { status: 'sent' });
      
      toast({
        title: '¡Enviado a WhatsApp!',
        description: 'La cotización se abrió en WhatsApp',
      });
      onUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo abrir WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleConvertToOrder = () => {
    // For each item, try to find matching recipe or create a simple order
    const mainItem = quotation.items[0];
    const matchingRecipe = recipes.find(r => 
      r.name.toLowerCase() === mainItem?.name.toLowerCase()
    );

    const newOrder = {
      id: crypto.randomUUID(),
      clientName: quotation.clientName,
      recipeId: matchingRecipe?.id || '',
      recipeName: mainItem?.name || 'Pedido personalizado',
      quantity: quotation.items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: quotation.total,
      status: 'pending' as const,
      deliveryDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    addOrder(newOrder);
    updateQuotation(quotation.id, { 
      status: 'converted', 
      convertedToOrderId: newOrder.id 
    });

    toast({
      title: '¡Convertido a pedido!',
      description: `Pedido para ${quotation.clientName} creado`,
    });
    onUpdate?.();
  };

  const handleDelete = () => {
    deleteQuotation(quotation.id);
    toast({
      title: 'Cotización eliminada',
      description: `Cotización #${quotation.number} eliminada`,
    });
    setShowDeleteDialog(false);
    onUpdate?.();
  };

  const handleDuplicate = async () => {
    const newQuotation = await duplicateQuotation(quotation.id);
    if (newQuotation) {
      toast({
        title: '¡Cotización duplicada!',
        description: `Nueva cotización #${newQuotation.number} creada`,
      });
      onUpdate?.();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        layout
      >
        <Card className="overflow-hidden hover:shadow-card transition-shadow">
          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{quotation.clientName}</p>
                  <p className="text-xs text-muted-foreground">#{quotation.number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={status.color}>{status.label}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border">
                    <QuotationForm
                      quotation={quotation}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      }
                      onSave={onUpdate}
                    />
                    <DropdownMenuItem onClick={handleDuplicate}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    {quotation.status !== 'converted' && (
                      <DropdownMenuItem onClick={handleConvertToOrder}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Convertir a pedido
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Items preview */}
            <div className="mb-3 text-sm text-muted-foreground">
              {quotation.items.slice(0, 2).map(item => (
                <p key={item.id} className="truncate">
                  • {item.name} x{item.quantity}
                </p>
              ))}
              {quotation.items.length > 2 && (
                <p className="text-xs">+{quotation.items.length - 2} más...</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-xl font-bold text-foreground">{formatCurrency(quotation.total)}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className={isExpired ? 'text-destructive' : ''}>
                    {isExpired ? 'Expirada' : `Válida hasta ${format(parseISO(quotation.validUntil), 'dd/MM')}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickDownload}
                  disabled={isDownloading || isPdfSettingsLoading}
                  title="Descargar PDF"
                >
                  <Download className="w-4 h-4 mr-1" />
                  {isDownloading ? '...' : 'PDF'}
                </Button>
                <Button
                  variant="warm"
                  size="sm"
                  onClick={handleSendWhatsApp}
                  disabled={isSending || !quotation.clientPhone}
                >
                  <Send className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la cotización #{quotation.number} permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
