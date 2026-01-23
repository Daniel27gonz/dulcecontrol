import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quotation } from '@/types/quotation';
import { PDFSettings } from '@/types/pdfSettings';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface QuotationHTMLPreviewProps {
  quotation: Quotation;
  pdfSettings: PDFSettings;
  currencySymbol: string;
  isEditing?: boolean;
  onFieldEdit?: (field: keyof PDFSettings, value: string) => void;
}

export function QuotationHTMLPreview({
  quotation,
  pdfSettings,
  currencySymbol,
  isEditing = false,
  onFieldEdit,
}: QuotationHTMLPreviewProps) {
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  };

  const creationDate = format(parseISO(quotation.createdAt), "d / MM / yyyy", { locale: es });

  // Estilos basados en el estilo seleccionado
  const getStyleClasses = () => {
    switch (pdfSettings.style) {
      case 'pastel':
        return {
          container: 'bg-gradient-to-b from-pink-50 to-white',
          header: 'text-pink-800',
          headerBg: pdfSettings.primaryColor,
          border: `border-[${pdfSettings.primaryColor}]`,
          accent: pdfSettings.secondaryColor,
          tableBg: pdfSettings.primaryColor,
          tableText: 'text-pink-900',
          decorative: true,
        };
      case 'minimal':
        return {
          container: 'bg-white',
          header: 'text-gray-800',
          headerBg: pdfSettings.primaryColor,
          border: 'border-gray-200',
          accent: pdfSettings.secondaryColor,
          tableBg: pdfSettings.primaryColor,
          tableText: 'text-gray-800',
          decorative: false,
        };
      case 'elegant':
        return {
          container: 'bg-gradient-to-b from-amber-50/30 to-white',
          header: 'text-amber-900',
          headerBg: pdfSettings.primaryColor,
          border: 'border-amber-200',
          accent: pdfSettings.secondaryColor,
          tableBg: pdfSettings.primaryColor,
          tableText: 'text-amber-900',
          decorative: true,
        };
      default:
        return {
          container: 'bg-white',
          header: 'text-gray-800',
          headerBg: pdfSettings.primaryColor,
          border: 'border-gray-300',
          accent: pdfSettings.secondaryColor,
          tableBg: pdfSettings.primaryColor,
          tableText: 'text-gray-800',
          decorative: false,
        };
    }
  };

  const styles = getStyleClasses();

  const EditableField = ({ 
    field, 
    value, 
    className = '',
    as = 'span',
    style = {},
  }: { 
    field: keyof PDFSettings; 
    value: string; 
    className?: string;
    as?: 'span' | 'p' | 'h1' | 'h2';
    style?: React.CSSProperties;
  }) => {
    const Tag = as;
    
    if (isEditing && onFieldEdit) {
      return (
        <Tag
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onFieldEdit(field, e.currentTarget.textContent || '')}
          className={`outline-none focus:ring-2 focus:ring-primary/50 rounded px-1 ${className}`}
          style={{ minWidth: '20px', display: 'inline-block', ...style }}
        >
          {value}
        </Tag>
      );
    }
    
    return <Tag className={className} style={style}>{value}</Tag>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto px-1 sm:px-0"
    >
      <div 
        className={`relative shadow-xl rounded-lg overflow-hidden ${styles.container}`}
        style={{ 
          aspectRatio: '8.5/11',
          backgroundColor: pdfSettings.secondaryColor,
        }}
      >
        {/* Fondo decorativo */}
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: styles.decorative ? `
              radial-gradient(circle at 5% 5%, ${pdfSettings.primaryColor}40 0%, transparent 25%),
              radial-gradient(circle at 95% 5%, ${pdfSettings.primaryColor}40 0%, transparent 25%),
              radial-gradient(circle at 5% 95%, ${pdfSettings.primaryColor}30 0%, transparent 20%),
              radial-gradient(circle at 95% 95%, ${pdfSettings.primaryColor}30 0%, transparent 20%)
            ` : 'none',
          }}
        />

        {/* Contenido principal */}
        <div className="relative z-10 p-3 sm:p-4 md:p-6 h-full flex flex-col">
          {/* Header con título y logo */}
          <div className="text-center mb-3 sm:mb-4 md:mb-6">
            {pdfSettings.logoUrl && (
              <div className="flex justify-center mb-2 sm:mb-3">
                <img 
                  src={pdfSettings.logoUrl} 
                  alt="Logo" 
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                />
              </div>
            )}
            
            <EditableField
              field="quotationTitle"
              value={pdfSettings.quotationTitle}
              as="h1"
              className="text-sm sm:text-lg md:text-xl font-bold tracking-wide"
              style={{ color: pdfSettings.primaryColor }}
            />
            
            {pdfSettings.businessName && (
              <p className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1 font-medium opacity-80">
                {pdfSettings.businessName}
              </p>
            )}
            
            <p className="text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 text-gray-600">
              Fecha: {creationDate}
            </p>
          </div>

          {/* Línea decorativa ondulada */}
          {styles.decorative && (
            <div 
              className="h-1.5 sm:h-2 md:h-3 w-full mb-2 sm:mb-3 md:mb-4 rounded-full"
              style={{
                background: `repeating-linear-gradient(
                  90deg,
                  ${pdfSettings.primaryColor},
                  ${pdfSettings.primaryColor} 8px,
                  transparent 8px,
                  transparent 12px
                )`,
              }}
            />
          )}

          {/* Datos del cliente */}
          <div 
            className="rounded-md sm:rounded-lg p-2 sm:p-3 md:p-4 mb-2 sm:mb-3 md:mb-4"
            style={{ backgroundColor: `${pdfSettings.primaryColor}30` }}
          >
            <div 
              className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs md:text-sm font-semibold mb-2 sm:mb-3"
              style={{ 
                backgroundColor: pdfSettings.primaryColor,
                color: '#fff',
              }}
            >
              DATOS DEL CLIENTE:
            </div>
            
            <div className="space-y-1 sm:space-y-1.5 md:space-y-2 text-[9px] sm:text-xs md:text-sm">
              <p className="flex flex-wrap items-baseline gap-1">
                <span className="font-medium whitespace-nowrap">Nombre:</span>
                <span className="border-b border-dashed border-gray-400 flex-1 min-w-[60px] sm:min-w-[100px] md:min-w-[150px] truncate">
                  {quotation.clientName}
                </span>
              </p>
              <p className="flex flex-wrap items-baseline gap-1">
                <span className="font-medium whitespace-nowrap">Teléfono:</span>
                <span className="border-b border-dashed border-gray-400 flex-1 min-w-[60px] sm:min-w-[100px] md:min-w-[150px]">
                  {quotation.clientPhone || ''}
                </span>
              </p>
              <p className="flex flex-wrap items-baseline gap-1">
                <span className="font-medium whitespace-nowrap">{pdfSettings.eventDateLabel}:</span>
                <span className="border-b border-dashed border-gray-400 flex-1 min-w-[60px] sm:min-w-[100px] md:min-w-[150px]">
                  {quotation.validUntil ? format(parseISO(quotation.validUntil), "d 'de' MMMM, yyyy", { locale: es }) : ''}
                </span>
              </p>
              <p className="flex flex-wrap items-baseline gap-1">
                <span className="font-medium whitespace-nowrap">{pdfSettings.eventTypeLabel}:</span>
                <span className="border-b border-dashed border-gray-400 flex-1 min-w-[60px] sm:min-w-[100px] md:min-w-[150px]"></span>
              </p>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="mb-2 sm:mb-3 md:mb-4 flex-1 min-h-0">
            {/* Header de tabla */}
            <div 
              className="rounded-t-md sm:rounded-t-lg overflow-hidden"
              style={{ backgroundColor: pdfSettings.primaryColor }}
            >
              <div className="grid grid-cols-12 gap-1 sm:gap-2 p-1.5 sm:p-2 text-white text-[8px] sm:text-[10px] md:text-xs font-semibold">
                <div className="col-span-6">DETALLE</div>
                <div className="col-span-3 text-center">CANT.</div>
                <div className="col-span-3 text-right">PRECIO</div>
              </div>
            </div>
            
            {/* Filas de productos */}
            <div 
              className="border-l border-r"
              style={{ borderColor: pdfSettings.primaryColor }}
            >
              {quotation.items.map((item, index) => (
                <div 
                  key={item.id}
                  className="grid grid-cols-12 gap-1 sm:gap-2 p-1 sm:p-1.5 md:p-2 text-[8px] sm:text-[10px] md:text-sm border-b border-dashed"
                  style={{ 
                    borderColor: `${pdfSettings.primaryColor}50`,
                    backgroundColor: index % 2 === 0 ? 'transparent' : `${pdfSettings.primaryColor}10`,
                  }}
                >
                  <div className="col-span-6 truncate">{item.name}</div>
                  <div className="col-span-3 text-center">{item.quantity}</div>
                  <div className="col-span-3 text-right font-medium">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              ))}
              
              {/* Filas vacías para completar - menos en móvil */}
              {Array.from({ length: Math.max(0, 2 - quotation.items.length) }).map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className="grid grid-cols-12 gap-1 sm:gap-2 p-1 sm:p-1.5 md:p-2 text-[8px] sm:text-[10px] md:text-sm border-b border-dashed h-4 sm:h-6 md:h-8"
                  style={{ borderColor: `${pdfSettings.primaryColor}50` }}
                />
              ))}
            </div>
            
            <div 
              className="h-1 sm:h-1.5 md:h-2 rounded-b-md sm:rounded-b-lg"
              style={{ backgroundColor: pdfSettings.primaryColor }}
            />
          </div>

          {/* Total */}
          <div className="text-right mb-2 sm:mb-3 md:mb-4">
            <p className="text-xs sm:text-sm md:text-lg font-bold">
              TOTAL: {formatCurrency(quotation.total)}
            </p>
          </div>

          {/* Observaciones */}
          <div className="mb-2 sm:mb-3 md:mb-4">
            <p className="text-[8px] sm:text-[10px] md:text-sm">
              <span className="font-medium">Obs:</span>{' '}
              <span className="border-b border-dashed border-gray-400 inline-block min-w-full truncate">
                {pdfSettings.observationsText || quotation.notes || ''}
              </span>
            </p>
          </div>

          {/* Footer con mensaje */}
          <div className="mt-auto text-center space-y-1 sm:space-y-1.5 md:space-y-2">
            <EditableField
              field="footerMessage"
              value={pdfSettings.footerMessage}
              as="p"
              className="text-[7px] sm:text-[9px] md:text-xs text-gray-600 italic line-clamp-2"
            />
            
            <EditableField
              field="thankYouMessage"
              value={pdfSettings.thankYouMessage}
              as="p"
              className="text-[9px] sm:text-xs md:text-sm font-script"
              style={{ color: pdfSettings.primaryColor }}
            />

            {/* Decoración de corazones */}
            {styles.decorative && (
              <div className="flex justify-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] md:text-xs" style={{ color: pdfSettings.primaryColor }}>
                ♥ ♥ ♥
              </div>
            )}
          </div>
        </div>

        {/* Bordes decorativos según estilo */}
        {pdfSettings.style === 'elegant' && (
          <>
            <div 
              className="absolute top-0 left-0 right-0 h-0.5 sm:h-1"
              style={{ backgroundColor: pdfSettings.primaryColor }}
            />
            <div 
              className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1"
              style={{ backgroundColor: pdfSettings.primaryColor }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}