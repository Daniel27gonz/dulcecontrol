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
      className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
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
        <div className="relative z-10 p-4 sm:p-5 md:p-6 h-full flex flex-col text-[11px] sm:text-xs md:text-sm">
          {/* Header con título y logo */}
          <div className="text-center mb-3 sm:mb-4 md:mb-5">
            {pdfSettings.logoUrl && (
              <div className="flex justify-center mb-2 sm:mb-3">
                <img 
                  src={pdfSettings.logoUrl} 
                  alt="Logo" 
                  className="h-10 sm:h-12 md:h-14 w-auto object-contain"
                />
              </div>
            )}
            
            <EditableField
              field="quotationTitle"
              value={pdfSettings.quotationTitle}
              as="h1"
              className="text-base sm:text-lg md:text-xl font-bold tracking-wide"
              style={{ color: pdfSettings.primaryColor }}
            />
            
            {pdfSettings.businessName && (
              <p className="text-xs sm:text-sm mt-1 font-medium opacity-80">
                {pdfSettings.businessName}
              </p>
            )}
            
            <p className="text-xs sm:text-sm mt-1.5 text-gray-600">
              Fecha: {creationDate}
            </p>
          </div>

          {/* Línea decorativa ondulada */}
          {styles.decorative && (
            <div 
              className="h-2 sm:h-2.5 w-full mb-3 sm:mb-4 rounded-full"
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
            className="rounded-lg p-3 sm:p-4 mb-3 sm:mb-4"
            style={{ backgroundColor: `${pdfSettings.primaryColor}30` }}
          >
            <div 
              className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3"
              style={{ 
                backgroundColor: pdfSettings.primaryColor,
                color: '#fff',
              }}
            >
              DATOS DEL CLIENTE:
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <p className="flex items-baseline gap-2">
                <span className="font-medium whitespace-nowrap">Nombre:</span>
                <span className="border-b border-dashed border-gray-400 flex-1 truncate">
                  {quotation.clientName}
                </span>
              </p>
              <p className="flex items-baseline gap-2">
                <span className="font-medium whitespace-nowrap">Teléfono:</span>
                <span className="border-b border-dashed border-gray-400 flex-1">
                  {quotation.clientPhone || ''}
                </span>
              </p>
              <p className="flex items-baseline gap-2">
                <span className="font-medium whitespace-nowrap">{pdfSettings.eventDateLabel}:</span>
                <span className="border-b border-dashed border-gray-400 flex-1">
                  {quotation.validUntil ? format(parseISO(quotation.validUntil), "d 'de' MMMM, yyyy", { locale: es }) : ''}
                </span>
              </p>
              <p className="flex items-baseline gap-2">
                <span className="font-medium whitespace-nowrap">{pdfSettings.eventTypeLabel}:</span>
                <span className="border-b border-dashed border-gray-400 flex-1"></span>
              </p>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="mb-3 sm:mb-4 flex-1 min-h-0">
            {/* Header de tabla */}
            <div 
              className="rounded-t-lg overflow-hidden"
              style={{ backgroundColor: pdfSettings.primaryColor }}
            >
              <div className="grid grid-cols-12 gap-2 p-2 sm:p-2.5 text-white text-[10px] sm:text-xs font-semibold">
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
                  className="grid grid-cols-12 gap-2 p-2 sm:p-2.5 border-b border-dashed"
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
              
              {/* Filas vacías para completar */}
              {Array.from({ length: Math.max(0, 2 - quotation.items.length) }).map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className="grid grid-cols-12 gap-2 p-2 sm:p-2.5 border-b border-dashed h-6 sm:h-8"
                  style={{ borderColor: `${pdfSettings.primaryColor}50` }}
                />
              ))}
            </div>
            
            <div 
              className="h-1.5 sm:h-2 rounded-b-lg"
              style={{ backgroundColor: pdfSettings.primaryColor }}
            />
          </div>

          {/* Total */}
          <div className="text-right mb-3 sm:mb-4">
            <p className="text-sm sm:text-base md:text-lg font-bold">
              TOTAL: {formatCurrency(quotation.total)}
            </p>
          </div>

          {/* Observaciones */}
          <div className="mb-3 sm:mb-4">
            <p>
              <span className="font-medium">Obs:</span>{' '}
              <span className="border-b border-dashed border-gray-400 inline-block min-w-full">
                {pdfSettings.observationsText || quotation.notes || ''}
              </span>
            </p>
          </div>

          {/* Footer con mensaje */}
          <div className="mt-auto text-center space-y-1.5 sm:space-y-2">
            <EditableField
              field="footerMessage"
              value={pdfSettings.footerMessage}
              as="p"
              className="text-[10px] sm:text-xs text-gray-600 italic line-clamp-2"
            />
            
            <EditableField
              field="thankYouMessage"
              value={pdfSettings.thankYouMessage}
              as="p"
              className="text-xs sm:text-sm font-script"
              style={{ color: pdfSettings.primaryColor }}
            />

            {/* Decoración de corazones */}
            {styles.decorative && (
              <div className="flex justify-center gap-2 text-xs" style={{ color: pdfSettings.primaryColor }}>
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