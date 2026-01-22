import jsPDF from 'jspdf';
import { Quotation } from '@/types/quotation';
import { PDFSettings, PDFStyle } from '@/types/pdfSettings';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface StyledPDFOptions {
  currencySymbol: string;
  pdfSettings: PDFSettings;
}

// Helper to load image as base64
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
}

function hexToRGB(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [93, 64, 55];
}

function lightenColor(rgb: [number, number, number], factor: number): [number, number, number] {
  return [
    Math.min(255, Math.round(rgb[0] + (255 - rgb[0]) * factor)),
    Math.min(255, Math.round(rgb[1] + (255 - rgb[1]) * factor)),
    Math.min(255, Math.round(rgb[2] + (255 - rgb[2]) * factor)),
  ];
}

function getStyleConfig(style: PDFStyle, primaryColor: [number, number, number]) {
  const lightColor = lightenColor(primaryColor, 0.85);
  const accentColor = lightenColor(primaryColor, 0.5);

  switch (style) {
    case 'minimal':
      return {
        headerHeight: 35,
        headerBgColor: [255, 255, 255] as [number, number, number],
        headerTextColor: primaryColor,
        titleFontSize: 20,
        useRoundedCorners: false,
        tableBorderWidth: 0.5,
        sectionPadding: 8,
        footerStyle: 'simple',
        showDecorations: false,
        rowBgColor: [250, 250, 250] as [number, number, number],
      };
    case 'elegant':
      return {
        headerHeight: 50,
        headerBgColor: primaryColor,
        headerTextColor: [255, 255, 255] as [number, number, number],
        titleFontSize: 24,
        useRoundedCorners: true,
        tableBorderWidth: 0,
        sectionPadding: 12,
        footerStyle: 'decorated',
        showDecorations: true,
        rowBgColor: lightColor,
      };
    case 'sweet':
      return {
        headerHeight: 45,
        headerBgColor: lightColor,
        headerTextColor: primaryColor,
        titleFontSize: 22,
        useRoundedCorners: true,
        tableBorderWidth: 0,
        sectionPadding: 10,
        footerStyle: 'friendly',
        showDecorations: true,
        rowBgColor: [255, 252, 250] as [number, number, number],
      };
    case 'professional':
    default:
      return {
        headerHeight: 45,
        headerBgColor: primaryColor,
        headerTextColor: [255, 255, 255] as [number, number, number],
        titleFontSize: 22,
        useRoundedCorners: true,
        tableBorderWidth: 0,
        sectionPadding: 10,
        footerStyle: 'standard',
        showDecorations: false,
        rowBgColor: [250, 248, 245] as [number, number, number],
      };
  }
}

export async function generateStyledQuotationPDF(
  quotation: Quotation,
  options: StyledPDFOptions
): Promise<jsPDF> {
  const { currencySymbol, pdfSettings } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const primaryColor = hexToRGB(pdfSettings.primaryColor);
  const styleConfig = getStyleConfig(pdfSettings.style, primaryColor);
  const accentColor = lightenColor(primaryColor, 0.5);
  const textColor: [number, number, number] = [50, 50, 50];
  const mutedColor: [number, number, number] = [120, 120, 120];

  let y = margin;

  // Header background
  doc.setFillColor(...styleConfig.headerBgColor);
  if (styleConfig.useRoundedCorners && pdfSettings.style !== 'minimal') {
    doc.roundedRect(0, 0, pageWidth, styleConfig.headerHeight, 0, 0, 'F');
  } else {
    doc.rect(0, 0, pageWidth, styleConfig.headerHeight, 'F');
  }

  // Border for minimal style
  if (pdfSettings.style === 'minimal') {
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(2);
    doc.line(margin, styleConfig.headerHeight - 5, pageWidth - margin, styleConfig.headerHeight - 5);
  }

  // Logo (if available)
  let logoOffset = 0;
  if (pdfSettings.logoUrl) {
    try {
      const logoData = await loadImageAsBase64(pdfSettings.logoUrl);
      if (logoData) {
        const logoHeight = 18;
        const logoWidth = 30; // Will be adjusted by aspect ratio
        doc.addImage(logoData, 'PNG', margin, y + 3, logoWidth, logoHeight);
        logoOffset = logoWidth + 5;
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Business name - centered
  doc.setTextColor(...styleConfig.headerTextColor);
  doc.setFontSize(styleConfig.titleFontSize);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfSettings.businessName || 'Mi Negocio de Postres', pageWidth / 2, y + 15, { align: 'center' });

  y = styleConfig.headerHeight + 10;

  // Client info section
  doc.setFillColor(...styleConfig.rowBgColor);
  if (styleConfig.useRoundedCorners) {
    doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');
  } else {
    doc.rect(margin, y, contentWidth, 35, 'F');
  }

  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', margin + 8, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(quotation.clientName, margin + 8, y + 20);

  if (quotation.clientPhone) {
    doc.setFontSize(10);
    doc.setTextColor(...mutedColor);
    doc.text(`Tel: ${quotation.clientPhone}`, margin + 8, y + 28);
  }

  // Valid until
  doc.setTextColor(...textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('VÁLIDO HASTA', pageWidth - margin - 60, y + 10);
  doc.setFont('helvetica', 'normal');
  const validDate = format(parseISO(quotation.validUntil), "d 'de' MMMM, yyyy", { locale: es });
  doc.text(validDate, pageWidth - margin - 60, y + 20);

  y += 45;

  // Items table header
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 10, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTO', margin + 5, y + 7);
  doc.text('CANT.', margin + 95, y + 7);
  doc.text('PRECIO UNIT.', margin + 115, y + 7);
  doc.text('TOTAL', pageWidth - margin - 5, y + 7, { align: 'right' });

  y += 12;

  // Items
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  quotation.items.forEach((item, index) => {
    const rowHeight = 15;

    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(...styleConfig.rowBgColor);
      doc.rect(margin, y - 3, contentWidth, rowHeight, 'F');
    }

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');

    // Item name
    const itemName = item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name;
    doc.text(itemName, margin + 5, y + 5);

    // Quantity
    doc.text(item.quantity.toString(), margin + 100, y + 5, { align: 'center' });

    // Unit price
    doc.text(`${currencySymbol}${item.unitPrice.toFixed(2)}`, margin + 130, y + 5);

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`${currencySymbol}${item.total.toFixed(2)}`, pageWidth - margin - 5, y + 5, { align: 'right' });

    y += rowHeight;
  });

  // Totals section
  y += 10;
  doc.setDrawColor(...accentColor);
  doc.line(pageWidth - margin - 80, y, pageWidth - margin, y);

  y += 8;

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  doc.text('Subtotal:', pageWidth - margin - 80, y);
  doc.setTextColor(...textColor);
  doc.text(`${currencySymbol}${quotation.subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

  // Discount (if any)
  if (quotation.discount > 0) {
    y += 8;
    doc.setTextColor(...mutedColor);
    const discountLabel =
      quotation.discountType === 'percentage'
        ? `Descuento (${quotation.discount}%):`
        : 'Descuento:';
    doc.text(discountLabel, pageWidth - margin - 80, y);

    const discountAmount =
      quotation.discountType === 'percentage'
        ? quotation.subtotal * (quotation.discount / 100)
        : quotation.discount;
    doc.setTextColor(200, 50, 50);
    doc.text(`-${currencySymbol}${discountAmount.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
  }

  // Total
  y += 12;
  doc.setFillColor(...primaryColor);
  if (styleConfig.useRoundedCorners) {
    doc.roundedRect(pageWidth - margin - 80, y - 6, 80, 16, 2, 2, 'F');
  } else {
    doc.rect(pageWidth - margin - 80, y - 6, 80, 16, 'F');
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - margin - 75, y + 4);
  doc.setFontSize(14);
  doc.text(`${currencySymbol}${quotation.total.toFixed(2)}`, pageWidth - margin - 5, y + 4, { align: 'right' });

  // Notes
  if (quotation.notes) {
    y += 30;
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTAS:', margin, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedColor);
    const noteLines = doc.splitTextToSize(quotation.notes, contentWidth);
    doc.text(noteLines, margin, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;

  if (styleConfig.showDecorations) {
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 15, pageWidth - margin, footerY - 15);
  }

  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const footerMessages = {
    simple: '¡Gracias por su preferencia!',
    decorated: '✨ ¡Gracias por confiar en nosotros! ✨',
    friendly: '¡Gracias por tu preferencia! 🧁',
    standard: 'Gracias por su preferencia 🧁',
  };

  doc.text(footerMessages[styleConfig.footerStyle as keyof typeof footerMessages] || footerMessages.standard, pageWidth / 2, footerY, { align: 'center' });

  // Contact info
  const contactParts: string[] = [];
  if (pdfSettings.businessPhone) contactParts.push(`Tel: ${pdfSettings.businessPhone}`);
  if (pdfSettings.businessEmail) contactParts.push(pdfSettings.businessEmail);

  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), pageWidth / 2, footerY + 6, { align: 'center' });
  }

  return doc;
}

export async function downloadStyledQuotationPDF(quotation: Quotation, options: StyledPDFOptions): Promise<void> {
  const doc = await generateStyledQuotationPDF(quotation, options);
  doc.save(`cotizacion-${quotation.number}.pdf`);
}

export async function getStyledQuotationPDFBlob(quotation: Quotation, options: StyledPDFOptions): Promise<Blob> {
  const doc = await generateStyledQuotationPDF(quotation, options);
  return doc.output('blob');
}

export async function getStyledQuotationPDFDataUrl(quotation: Quotation, options: StyledPDFOptions): Promise<string> {
  const doc = await generateStyledQuotationPDF(quotation, options);
  return doc.output('dataurlstring');
}
