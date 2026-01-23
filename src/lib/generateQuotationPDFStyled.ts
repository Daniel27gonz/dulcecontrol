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
    case 'pastel':
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

  // Logo (if available) - centered at top
  if (pdfSettings.logoUrl) {
    try {
      const logoData = await loadImageAsBase64(pdfSettings.logoUrl);
      if (logoData) {
        const logoHeight = 25;
        const logoWidth = 40;
        doc.addImage(logoData, 'PNG', (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight);
        y += logoHeight + 5;
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Title - centered with custom text
  const quotationTitle = pdfSettings.quotationTitle || 'COTIZACIÓN DE POSTRES ARTESANALES';
  doc.setTextColor(...primaryColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  
  // Split title if needed
  const titleLines = doc.splitTextToSize(quotationTitle, contentWidth);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, y + 10, { align: 'center' });
    y += 7;
  });
  
  y += 5;

  // Business name below title
  if (pdfSettings.businessName) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(pdfSettings.businessName, pageWidth / 2, y + 5, { align: 'center' });
    y += 10;
  }

  // Date
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  const creationDate = format(parseISO(quotation.createdAt), "d 'de' MMMM, yyyy", { locale: es });
  doc.text(`Fecha: ${creationDate}`, pageWidth / 2, y + 5, { align: 'center' });
  y += 12;

  // Decorative wavy line
  if (styleConfig.showDecorations) {
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(1.5);
    
    // Scalloped border
    const scallops = 30;
    const scWidth = contentWidth / scallops;
    for (let i = 0; i < scallops; i++) {
      const x1 = margin + i * scWidth;
      const x2 = margin + (i + 1) * scWidth;
      doc.setFillColor(...primaryColor);
      doc.ellipse(x1 + scWidth / 2, y, scWidth / 2, 2, 'F');
    }
    y += 8;
  }

  // Client info section with rounded background
  doc.setFillColor(...lightPrimary);
  if (styleConfig.useRoundedCorners) {
    doc.roundedRect(margin, y, contentWidth, 45, 4, 4, 'F');
  } else {
    doc.rect(margin, y, contentWidth, 45, 'F');
  }

  // Client section header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin + 10, y + 5, 55, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE:', margin + 12, y + 10.5);

  // Client data
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const clientY = y + 18;
  doc.text(`Nombre del cliente: ${quotation.clientName}`, margin + 10, clientY);
  doc.text(`Teléfono: ${quotation.clientPhone || '_________________'}`, margin + 10, clientY + 7);
  
  const eventDateLabel = pdfSettings.eventDateLabel || 'Fecha del evento / entrega';
  const validDate = format(parseISO(quotation.validUntil), "d 'de' MMMM, yyyy", { locale: es });
  doc.text(`${eventDateLabel}: ${validDate}`, margin + 10, clientY + 14);
  
  const eventTypeLabel = pdfSettings.eventTypeLabel || 'Tipo de evento (opcional)';
  doc.text(`${eventTypeLabel}: _________________`, margin + 10, clientY + 21);

  y += 55;

  // Products table with styled header
  // Table header
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, contentWidth, 10, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DEL PEDIDO', margin + 8, y + 7);
  doc.text('CANTIDAD', margin + contentWidth * 0.55, y + 7);
  doc.text('PRECIO', margin + contentWidth * 0.8, y + 7);

  y += 12;

  // Table rows
  const rowHeight = 10;
  const tableStartY = y;
  
  // Draw table border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  
  quotation.items.forEach((item, index) => {
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(...veryLightPrimary);
    }
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    // Row content
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const itemName = item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name;
    doc.text(itemName, margin + 8, y + 7);
    doc.text(item.quantity.toString(), margin + contentWidth * 0.6, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${currencySymbol}${item.total.toFixed(2)}`, margin + contentWidth * 0.9, y + 7, { align: 'right' });
    
    // Dashed row separator
    doc.setDrawColor(...lightenColor(primaryColor, 0.5));
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
    doc.setLineDashPattern([], 0);
    
    y += rowHeight;
  });

  // Empty rows to fill space (minimum 4 rows)
  const minRows = 4;
  const emptyRows = Math.max(0, minRows - quotation.items.length);
  for (let i = 0; i < emptyRows; i++) {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    doc.setDrawColor(...lightenColor(primaryColor, 0.5));
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
    doc.setLineDashPattern([], 0);
    
    y += rowHeight;
  }

  // Table border
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(margin, tableStartY, contentWidth, y - tableStartY);
  
  // Column separators
  doc.line(margin + contentWidth * 0.5, tableStartY, margin + contentWidth * 0.5, y);
  doc.line(margin + contentWidth * 0.7, tableStartY, margin + contentWidth * 0.7, y);

  // Bottom decorative border
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 10;

  // Total
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL A PAGAR: ${currencySymbol}${quotation.total.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
  
  y += 15;

  // Observations
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  const observations = pdfSettings.observationsText || quotation.notes || '';
  doc.text(`Observaciones: ${observations || '_______________________________________________'}`, margin, y);

  y += 10;

  // Reference image (if available)
  if (quotation.referenceImage) {
    try {
      const referenceImageData = await loadImageAsBase64(quotation.referenceImage);
      if (referenceImageData) {
        // Calculate available space for the image
        const availableHeight = pageHeight - y - 55; // Leave space for footer
        const maxImageHeight = Math.min(50, availableHeight);
        const maxImageWidth = contentWidth * 0.6;
        
        // Add section label
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text('Imagen de referencia:', margin, y + 5);
        y += 10;
        
        // Draw a decorative border for the image
        doc.setFillColor(...veryLightPrimary);
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.5);
        
        // Center the image container
        const imageContainerWidth = maxImageWidth + 10;
        const containerX = (pageWidth - imageContainerWidth) / 2;
        
        if (styleConfig.useRoundedCorners) {
          doc.roundedRect(containerX, y, imageContainerWidth, maxImageHeight + 10, 4, 4, 'FD');
        } else {
          doc.rect(containerX, y, imageContainerWidth, maxImageHeight + 10, 'FD');
        }
        
        // Add the image centered
        const imageX = containerX + 5;
        const imageY = y + 5;
        doc.addImage(referenceImageData, 'JPEG', imageX, imageY, maxImageWidth, maxImageHeight);
        
        y += maxImageHeight + 15;
      }
    } catch (error) {
      console.error('Error loading reference image:', error);
    }
  }

  // Footer messages
  const footerY = pageHeight - 35;
  
  // Footer message
  const footerMessage = pdfSettings.footerMessage || 'Esta cotización ha sido elaborada considerando ingredientes de calidad, tiempo de preparación y dedicación artesanal para brindarte un resultado delicioso.';
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.setFont('helvetica', 'italic');
  const footerLines = doc.splitTextToSize(footerMessage, contentWidth - 20);
  doc.text(footerLines, pageWidth / 2, footerY, { align: 'center' });

  // Thank you message
  const thankYouMessage = pdfSettings.thankYouMessage || 'Gracias por confiar en mi trabajo para endulzar tus momentos';
  doc.setFontSize(11);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bolditalic');
  doc.text(thankYouMessage, pageWidth / 2, footerY + 12, { align: 'center' });

  // Decorative hearts
  if (styleConfig.showDecorations) {
    doc.setFontSize(10);
    doc.text('♥   ♥   ♥', pageWidth / 2, footerY + 20, { align: 'center' });
  }

  // Contact info at very bottom
  const contactParts: string[] = [];
  if (pdfSettings.businessPhone) contactParts.push(`Tel: ${pdfSettings.businessPhone}`);
  if (pdfSettings.businessEmail) contactParts.push(pdfSettings.businessEmail);

  if (contactParts.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.setFont('helvetica', 'normal');
    doc.text(contactParts.join(' | '), pageWidth / 2, pageHeight - 8, { align: 'center' });
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
