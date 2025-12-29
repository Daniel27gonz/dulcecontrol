import jsPDF from 'jspdf';
import { Quotation } from '@/types/quotation';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PDFOptions {
  businessName: string;
  currencySymbol: string;
  businessPhone?: string;
  businessEmail?: string;
}

export function generateQuotationPDF(quotation: Quotation, options: PDFOptions): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [93, 64, 55]; // #5D4037
  const accentColor: [number, number, number] = [200, 150, 120];
  const textColor: [number, number, number] = [50, 50, 50];
  const mutedColor: [number, number, number] = [120, 120, 120];

  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Business name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(options.businessName || 'Postres Rentables', margin, y + 12);

  // Quotation label
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('COTIZACIÓN', pageWidth - margin, y + 8, { align: 'right' });
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${quotation.number}`, pageWidth - margin, y + 18, { align: 'right' });

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const createdDate = format(parseISO(quotation.createdAt), "d 'de' MMMM, yyyy", { locale: es });
  doc.text(`Fecha: ${createdDate}`, pageWidth - margin, y + 28, { align: 'right' });

  y = 55;

  // Client info section
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');

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
      doc.setFillColor(250, 248, 245);
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
    doc.text(`${options.currencySymbol}${item.unitPrice.toFixed(2)}`, margin + 130, y + 5);
    
    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`${options.currencySymbol}${item.total.toFixed(2)}`, pageWidth - margin - 5, y + 5, { align: 'right' });

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
  doc.text(`${options.currencySymbol}${quotation.subtotal.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

  // Discount (if any)
  if (quotation.discount > 0) {
    y += 8;
    doc.setTextColor(...mutedColor);
    const discountLabel = quotation.discountType === 'percentage' 
      ? `Descuento (${quotation.discount}%):` 
      : 'Descuento:';
    doc.text(discountLabel, pageWidth - margin - 80, y);
    
    const discountAmount = quotation.discountType === 'percentage'
      ? quotation.subtotal * (quotation.discount / 100)
      : quotation.discount;
    doc.setTextColor(200, 50, 50);
    doc.text(`-${options.currencySymbol}${discountAmount.toFixed(2)}`, pageWidth - margin, y, { align: 'right' });
  }

  // Total
  y += 12;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(pageWidth - margin - 80, y - 6, 80, 16, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', pageWidth - margin - 75, y + 4);
  doc.setFontSize(14);
  doc.text(`${options.currencySymbol}${quotation.total.toFixed(2)}`, pageWidth - margin - 5, y + 4, { align: 'right' });

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
  doc.setDrawColor(...accentColor);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  
  doc.setTextColor(...mutedColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Gracias por su preferencia 🧁', pageWidth / 2, footerY, { align: 'center' });
  
  if (options.businessPhone) {
    doc.text(`Tel: ${options.businessPhone}`, pageWidth / 2, footerY + 6, { align: 'center' });
  }

  return doc;
}

export function downloadQuotationPDF(quotation: Quotation, options: PDFOptions): void {
  const doc = generateQuotationPDF(quotation, options);
  doc.save(`cotizacion-${quotation.number}.pdf`);
}

export function getQuotationPDFBlob(quotation: Quotation, options: PDFOptions): Blob {
  const doc = generateQuotationPDF(quotation, options);
  return doc.output('blob');
}
