import { jsPDF } from 'jspdf';
import { Order } from '@/types/order';
import { formatCurrency } from './analytics';
import { MEMORALK_LOGO_BASE64 } from './logoBase64';

export function generateInvoicePDF(order: Order, shouldDownload: boolean = true): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const secondaryColor = [79, 70, 229]; // Indigo 600
  const mutedText = [100, 116, 139]; // Slate 500
  const lightBg = [248, 250, 252]; // Slate 50
  const borderLight = [226, 232, 240]; // Slate 200

  // 1. Header & Brand (with Company Logo)
  const logoSize = 22;
  const logoX = margin;
  const logoY = 16;
  doc.addImage(MEMORALK_LOGO_BASE64, 'JPEG', logoX, logoY, logoSize, logoSize);

  const textX = logoX + logoSize + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('MEMORALK', textX, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Framing memories, not just photos', textX, 28);
  doc.text('Enterprise Orders & Custom Framing Systems', textX, 33);
  doc.text('Colombo, Sri Lanka · support@memoralk.com', textX, 37);

  // Invoice Big Label right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('INVOICE', pageWidth - margin, 24, { align: 'right' });

  // Invoice metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Invoice #: ${order.invoiceNumber}`, pageWidth - margin, 31, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(`Order Ref: ${order.id}`, pageWidth - margin, 36, { align: 'right' });
  doc.text(`Issue Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - margin, 41, { align: 'right' });
  doc.text(`Due Date: ${new Date(order.dueDate).toLocaleDateString()}`, pageWidth - margin, 46, { align: 'right' });

  // Divider line
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, 52, pageWidth - margin, 52);

  // 2. Bill To & Payment Info boxes
  let y = 60;

  // Left: Bill To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('BILLED TO', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(order.customer.name, margin, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);

  let customerY = y + 11;
  if (order.customer.company) {
    doc.text(order.customer.company, margin, customerY);
    customerY += 4.5;
  }
  doc.text(order.customer.address, margin, customerY);
  customerY += 4.5;
  doc.text(
    `${order.customer.city}${order.customer.state ? ', ' + order.customer.state : ''} ${order.customer.postalCode || ''}`,
    margin,
    customerY
  );
  customerY += 4.5;
  doc.text(order.customer.country, margin, customerY);
  customerY += 4.5;
  doc.text(`${order.customer.email} · ${order.customer.phone}`, margin, customerY);

  // Right: Status & Payment details card
  const rightBoxX = 125;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(rightBoxX, y - 3, contentWidth - (rightBoxX - margin), 32, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(rightBoxX, y - 3, contentWidth - (rightBoxX - margin), 32, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('PAYMENT DETAILS', rightBoxX + 5, y + 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Status:', rightBoxX + 5, y + 9);
  doc.setFont('helvetica', 'bold');
  const isPaid = order.paymentStatus === 'paid';
  doc.setTextColor(isPaid ? 22 : 180, isPaid ? 101 : 83, isPaid ? 52 : 9);
  doc.text(order.paymentStatus.toUpperCase(), rightBoxX + 32, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Method:', rightBoxX + 5, y + 15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(order.paymentMethod.replace('_', ' ').toUpperCase(), rightBoxX + 32, y + 15);

  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Fulfillment:', rightBoxX + 5, y + 21);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(order.status.toUpperCase(), rightBoxX + 32, y + 21);

  // 3. Line Items Table
  let tableY = Math.max(customerY + 10, y + 36);

  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, tableY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM & DESCRIPTION', margin + 4, tableY + 5.5);
  doc.text('SKU', margin + 95, tableY + 5.5);
  doc.text('QTY', margin + 120, tableY + 5.5, { align: 'center' });
  doc.text('UNIT PRICE', margin + 145, tableY + 5.5, { align: 'right' });
  doc.text('AMOUNT', pageWidth - margin - 4, tableY + 5.5, { align: 'right' });

  tableY += 8;

  // Table Rows
  order.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(margin, tableY, contentWidth, 8.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

    // Truncate name if too long
    const cleanName = item.name.length > 46 ? item.name.substring(0, 44) + '...' : item.name;
    doc.text(cleanName, margin + 4, tableY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(item.sku, margin + 95, tableY + 5.5);

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(String(item.quantity), margin + 120, tableY + 5.5, { align: 'center' });
    doc.text(formatCurrency(item.sellingPrice), margin + 145, tableY + 5.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(item.totalSelling), pageWidth - margin - 4, tableY + 5.5, {
      align: 'right',
    });

    // Row bottom border
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, tableY + 8.5, pageWidth - margin, tableY + 8.5);

    tableY += 8.5;
  });

  tableY += 6;

  // 4. Financial Totals (Right side)
  const totalsLeft = 120;
  const totalsRight = pageWidth - margin - 4;

  const addTotalRow = (label: string, value: string, isBold: boolean = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 10 : 8.5);
    doc.setTextColor(isBold ? primaryColor[0] : mutedText[0], isBold ? primaryColor[1] : mutedText[1], isBold ? primaryColor[2] : mutedText[2]);
    doc.text(label, totalsLeft, tableY);
    doc.text(value, totalsRight, tableY, { align: 'right' });
    tableY += 5.5;
  };

  addTotalRow('Subtotal:', formatCurrency(order.subtotalSelling));
  if (order.discount > 0) {
    addTotalRow(`Discount Applied:`, `-${formatCurrency(order.discount)}`);
  }
  addTotalRow(`Sales Tax (${order.taxRate}%):`, formatCurrency(order.taxAmount));
  addTotalRow('Shipping & Logistics:', formatCurrency(order.shippingCost));

  // Grand Total highlight box
  tableY += 2;
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(totalsLeft - 4, tableY - 4, contentWidth - (totalsLeft - margin) + 4, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL DUE:', totalsLeft, tableY + 2.5);
  doc.text(formatCurrency(order.grandTotal), totalsRight, tableY + 2.5, { align: 'right' });

  // 5. Notes & Wire Transfer Instructions (Left side)
  const notesY = tableY - 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('PAYMENT INSTRUCTIONS & NOTES', margin, notesY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Bank: Commercial Bank of Ceylon', margin, notesY + 5);
  doc.text('Branch: Colombo · SWIFT: CCEYLKLX', margin, notesY + 9);
  doc.text(`Account #: 1000849201 · Reference: ${order.invoiceNumber}`, margin, notesY + 13);

  if (order.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
    doc.text(`Note: ${order.notes}`, margin, notesY + 18, { maxWidth: 95 });
  }

  // 6. Footer
  const footerY = 282;
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text('Thank you for partnering with Memoralk. Questions? Contact billing@memoralk.com', margin, footerY);
  doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`, pageWidth - margin, footerY, {
    align: 'right',
  });

  if (shouldDownload) {
    doc.save(`Invoice_${order.invoiceNumber}.pdf`);
  }

  return doc;
}
