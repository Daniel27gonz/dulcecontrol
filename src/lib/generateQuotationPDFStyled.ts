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
    default:
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
  }
}

export async function generateStyledQuotationPDF(
  quotation: Quotation,
  options: StyledPDFOptions
): Promise<jsPDF> {
  const { currencySymbol, pdfSettings } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const primaryColor = hexToRGB(pdfSettings.primaryColor);
  const secondaryColor = hexToRGB(pdfSettings.secondaryColor || pdfSettings.primaryColor);
  const styleConfig = getStyleConfig(pdfSettings.style, primaryColor);
  const lightPrimary = lightenColor(primaryColor, 0.7);
  const veryLightPrimary = lightenColor(primaryColor, 0.9);
  const textColor: [number, number, number] = [60, 60, 60];
  const mutedColor: [number, number, number] = [120, 120, 120];

  let y = margin;

  // Background color (very light)
  doc.setFillColor(...veryLightPrimary);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative dots pattern (pastel style)
  if (styleConfig.showDecorations) {
    doc.setFillColor(...lightenColor(primaryColor, 0.6));
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * pageWidth;
      const yPos = Math.random() * 30;
      const size = Math.random() * 2 + 0.5;
      doc.circle(x, yPos, size, 'F');
    }
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * pageWidth;
      const yPos = pageHeight - (Math.random() * 30);
      const size = Math.random() * 2 + 0.5;
      doc.circle(x, yPos, size, 'F');
    }
  }

  // === HEADER SECTION ===
  // Folio - positioned in top right corner
  doc.setFillColor(...lightenColor(primaryColor, 0.85));
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.3);
  const folioText = `Folio: ${quotation.number}`;
  doc.setFontSize(9);
  const folioWidth = doc.getTextWidth(folioText) + 14;
  const folioX = pageWidth - margin - folioWidth;
  doc.roundedRect(folioX, y, folioWidth, 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(folioText, folioX + folioWidth / 2, y + 5.5, { align: 'center' });

  // Logo (if available) - positioned based on settings (left or right)
  let logoEndY = y;
  if (pdfSettings.logoUrl) {
    try {
      const logoData = await loadImageAsBase64(pdfSettings.logoUrl);
      if (logoData) {
        const logoHeight = 28;
        const logoWidth = 35;
        
        // Logo always positioned on the left
        const logoX = margin;
        
        doc.addImage(logoData, 'PNG', logoX, y, logoWidth, logoHeight);
        logoEndY = y + logoHeight;
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Title - centered
  const quotationTitle = pdfSettings.quotationTitle || 'COTIZACIÓN DE POSTRES ARTESANALES';
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  
  const titleY = y + 15;
  const titleLines = doc.splitTextToSize(quotationTitle, contentWidth - 80);
  let currentTitleY = titleY;
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, currentTitleY, { align: 'center' });
    currentTitleY += 6;
  });

  // Business name below title - centered
  let businessNameY = currentTitleY + 3;
  if (pdfSettings.businessName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(pdfSettings.businessName, pageWidth / 2, businessNameY, { align: 'center' });
    businessNameY += 8;
  }

  // Date - centered
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  const creationDate = format(parseISO(quotation.createdAt), "d 'de' MMMM, yyyy", { locale: es });
  doc.text(`Fecha: ${creationDate}`, pageWidth / 2, businessNameY + 2, { align: 'center' });

  // Calculate y position after header
  y = Math.max(logoEndY, businessNameY + 8) + 8;

  // === CLIENT INFO SECTION ===
  const clientSectionHeight = 46;
  doc.setFillColor(...lightPrimary);
  if (styleConfig.useRoundedCorners) {
    doc.roundedRect(margin, y, contentWidth, clientSectionHeight, 4, 4, 'F');
  } else {
    doc.rect(margin, y, contentWidth, clientSectionHeight, 'F');
  }

  // Client section header badge
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin + 8, y + 6, 52, 7, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE:', margin + 10, y + 11);

  // Client data - with proper spacing and underlines
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const clientDataStartY = y + 20;
  const lineSpacing = 6;
  
  // Nombre del cliente
  doc.text('Nombre del cliente: ', margin + 8, clientDataStartY);
  const nombreWidth = doc.getTextWidth('Nombre del cliente: ');
  doc.setFont('helvetica', 'normal');
  const clientNameText = quotation.clientName || '_________________';
  doc.text(clientNameText, margin + 8 + nombreWidth, clientDataStartY);
  // Underline for client name
  const clientNameWidth = doc.getTextWidth(clientNameText);
  doc.setDrawColor(...textColor);
  doc.setLineWidth(0.3);
  doc.line(margin + 8 + nombreWidth, clientDataStartY + 1, margin + 8 + nombreWidth + clientNameWidth, clientDataStartY + 1);
  
  // Teléfono
  doc.text('Teléfono: ', margin + 8, clientDataStartY + lineSpacing);
  const telWidth = doc.getTextWidth('Teléfono: ');
  const phoneText = quotation.clientPhone || '_________________';
  doc.text(phoneText, margin + 8 + telWidth, clientDataStartY + lineSpacing);
  const phoneTextWidth = doc.getTextWidth(phoneText);
  doc.line(margin + 8 + telWidth, clientDataStartY + lineSpacing + 1, margin + 8 + telWidth + phoneTextWidth, clientDataStartY + lineSpacing + 1);
  
  // Fecha de entrega
  const eventDateLabel = pdfSettings.eventDateLabel || 'Fecha de entrega';
  doc.text(`${eventDateLabel}: `, margin + 8, clientDataStartY + lineSpacing * 2);
  const fechaEntregaWidth = doc.getTextWidth(`${eventDateLabel}: `);
  const deliveryDateText = quotation.deliveryDate 
    ? format(parseISO(quotation.deliveryDate), 'dd/MM/yyyy')
    : '_________________';
  doc.text(deliveryDateText, margin + 8 + fechaEntregaWidth, clientDataStartY + lineSpacing * 2);
  const deliveryDateWidth = doc.getTextWidth(deliveryDateText);
  doc.line(margin + 8 + fechaEntregaWidth, clientDataStartY + lineSpacing * 2 + 1, margin + 8 + fechaEntregaWidth + deliveryDateWidth, clientDataStartY + lineSpacing * 2 + 1);
  
  // Válida hasta
  const validUntilLabel = pdfSettings.validUntilLabel || 'Válida hasta';
  doc.text(`${validUntilLabel}: `, margin + 8, clientDataStartY + lineSpacing * 3);
  const validaHastaWidth = doc.getTextWidth(`${validUntilLabel}: `);
  const validUntilText = quotation.validUntil 
    ? format(parseISO(quotation.validUntil), 'dd/MM/yyyy')
    : '_________________';
  doc.text(validUntilText, margin + 8 + validaHastaWidth, clientDataStartY + lineSpacing * 3);
  const validUntilWidth = doc.getTextWidth(validUntilText);
  doc.line(margin + 8 + validaHastaWidth, clientDataStartY + lineSpacing * 3 + 1, margin + 8 + validaHastaWidth + validUntilWidth, clientDataStartY + lineSpacing * 3 + 1);

  y += clientSectionHeight + 10;

  // === PRODUCTS TABLE ===
  // Table header with rounded top corners
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  
  // Column positions for better alignment
  const col1X = margin + 8;
  const col2X = margin + contentWidth * 0.58;
  const col3X = margin + contentWidth * 0.82;
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DEL PEDIDO', col1X, y + 6.5);
  doc.text('CANTIDAD', col2X, y + 6.5, { align: 'center' });
  doc.text('PRECIO', col3X, y + 6.5, { align: 'center' });

  y += 10;

  // Table body
  const rowHeight = 12;
  const tableStartY = y;
  
  // Draw table rows
  quotation.items.forEach((item, index) => {
    // Row background - white for all
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    // Row content with proper vertical centering
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const itemName = item.name.length > 45 ? item.name.substring(0, 45) + '...' : item.name;
    doc.text(itemName, col1X, y + 8);
    doc.text(item.quantity.toString(), col2X, y + 8, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${currencySymbol}${item.total.toFixed(2)}`, col3X, y + 8, { align: 'center' });
    
    y += rowHeight;
    
    // Dashed row separator
    doc.setDrawColor(...lightenColor(primaryColor, 0.4));
    doc.setLineDashPattern([3, 2], 0);
    doc.line(margin + 1, y, margin + contentWidth - 1, y);
    doc.setLineDashPattern([], 0);
  });

  // Empty rows to fill space (minimum 4 rows total)
  const minRows = 4;
  const emptyRows = Math.max(0, minRows - quotation.items.length);
  for (let i = 0; i < emptyRows; i++) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    y += rowHeight;
    
    // Dashed row separator
    doc.setDrawColor(...lightenColor(primaryColor, 0.4));
    doc.setLineDashPattern([3, 2], 0);
    doc.line(margin + 1, y, margin + contentWidth - 1, y);
    doc.setLineDashPattern([], 0);
  }

  // Table outer border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([], 0);
  doc.rect(margin, tableStartY, contentWidth, y - tableStartY);
  
  // Column separators (vertical lines)
  const col1End = margin + contentWidth * 0.48;
  const col2End = margin + contentWidth * 0.68;
  doc.line(col1End, tableStartY, col1End, y);
  doc.line(col2End, tableStartY, col2End, y);

  // Bottom decorative border (thicker line)
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 2.5, 'F');
  y += 12;

  // === TOTAL ===
  doc.setTextColor(...textColor);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL A PAGAR: ${currencySymbol}${quotation.total.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
  
  y += 12;

  // === FOOTER ===
  const footerReservedHeight = 55;
  const minFooterY = y + 8;
  const fixedFooterY = pageHeight - footerReservedHeight;
  const footerY = Math.max(minFooterY, fixedFooterY);
  
  // Footer message - italicized description
  const footerMessage = pdfSettings.footerMessage || '';
  if (footerMessage) {
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'italic');
    const footerLines = doc.splitTextToSize(footerMessage, contentWidth - 20);
    const lineHeight = 4;
    let footerMsgY = footerY;
    footerLines.slice(0, 3).forEach((line: string) => {
      doc.text(line, pageWidth / 2, footerMsgY, { align: 'center' });
      footerMsgY += lineHeight;
    });
  }
  
  // Thank you message - italic in primary color
  const thankYouMessage = pdfSettings.thankYouMessage || 'Gracias por confiar en mi trabajo para endulzar tus momentos';
  const thankYouY = footerMessage ? footerY + 16 : footerY;
  
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'italic');
  doc.text(thankYouMessage, pageWidth / 2, thankYouY, { align: 'center' });

  // Contact info below thank you message - italic
  const contactParts: string[] = [];
  if (pdfSettings.businessPhone) contactParts.push(`Tel: ${pdfSettings.businessPhone}`);
  if (pdfSettings.businessEmail) contactParts.push(pdfSettings.businessEmail);

  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'italic');
    doc.text(contactParts.join(' | '), pageWidth / 2, thankYouY + 12, { align: 'center' });
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
