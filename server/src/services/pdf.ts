import PDFDocument from 'pdfkit';
import { ContractFormData } from '../types.js';

export function generatePDF(
  contractText: string,
  data: ContractFormData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: `${data.projectTitle} - Freelance Design Contract`,
        Author: data.designerName,
        Subject: 'Freelance Design Services Agreement',
        Creator: 'Freelance Contract Generator',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const navy = '#1a2744';
    const slate = '#475569';
    const lightGray = '#f8fafc';
    const borderGray = '#e2e8f0';
    const accentBlue = '#3b82f6';
    const pageWidth = doc.page.width - 144;

    // ── HEADER BANNER ──
    doc.rect(0, 0, doc.page.width, 120).fill(navy);

    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('FREELANCE DESIGN SERVICES AGREEMENT', 72, 34, {
        width: pageWidth,
        align: 'center',
      });

    doc
      .fillColor('#94a3b8')
      .font('Helvetica')
      .fontSize(11)
      .text(data.projectTitle, 72, 64, { width: pageWidth, align: 'center' });

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc
      .fillColor('#cbd5e1')
      .font('Helvetica')
      .fontSize(9)
      .text(`Effective Date: ${today}`, 72, 85, {
        width: pageWidth,
        align: 'center',
      });

    // ── PARTIES CARD ──
    const partiesTop = 136;
    const cardHeight = 118;
    doc.rect(72, partiesTop, pageWidth, cardHeight).fill(lightGray);
    doc.rect(72, partiesTop, pageWidth, cardHeight).stroke(borderGray);

    const colWidth = pageWidth / 2 - 1;

    // Designer
    doc
      .fillColor(navy)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('SERVICE PROVIDER', 84, partiesTop + 10);
    doc
      .fillColor(slate)
      .font('Helvetica')
      .fontSize(9)
      .text(data.businessName || data.designerName, 84, partiesTop + 24)
      .text(data.designerName, 84, partiesTop + 36)
      .text(data.designerEmail, 84, partiesTop + 48)
      .text(data.designerPhone || '', 84, partiesTop + 60)
      .text(data.designerAddress || '', 84, partiesTop + 72, {
        width: colWidth - 12,
      });

    // Divider
    doc
      .moveTo(72 + colWidth, partiesTop + 8)
      .lineTo(72 + colWidth, partiesTop + cardHeight - 8)
      .strokeColor(borderGray)
      .stroke();

    // Client
    const cx = 72 + colWidth + 12;
    doc
      .fillColor(navy)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text('CLIENT', cx, partiesTop + 10);
    doc
      .fillColor(slate)
      .font('Helvetica')
      .fontSize(9)
      .text(data.clientCompany || data.clientName, cx, partiesTop + 24)
      .text(data.clientName, cx, partiesTop + 36)
      .text(data.clientEmail, cx, partiesTop + 48)
      .text(data.clientPhone || '', cx, partiesTop + 60)
      .text(data.clientAddress || '', cx, partiesTop + 72, {
        width: colWidth - 12,
      });

    // ── ACCENT LINE ──
    const accentY = partiesTop + cardHeight + 10;
    doc.rect(72, accentY, pageWidth, 2).fill(accentBlue);

    doc.y = accentY + 16;

    // ── CONTRACT BODY ──
    renderContractText(doc, contractText, pageWidth, navy, slate, borderGray, accentBlue);

    // ── SIGNATURE BLOCK (only if not found in text) ──
    const hasSignatureInText = /IN WITNESS|signature\s+block|sign.*below/i.test(contractText);
    if (!hasSignatureInText) {
      appendSignatureBlock(doc, data, pageWidth, navy, slate, borderGray);
    }

    doc.end();
  });
}

function renderContractText(
  doc: InstanceType<typeof PDFDocument>,
  text: string,
  pageWidth: number,
  navy: string,
  slate: string,
  _borderGray: string,
  accentBlue: string
) {
  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      doc.moveDown(0.25);
      continue;
    }

    // Need a new page?
    if (doc.y > doc.page.height - doc.page.margins.bottom - 60) {
      doc.addPage();
    }

    // Strip markdown bold/italic markers for display
    const clean = trimmed
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/^#+\s*/, '');

    // Section heading: ALL-CAPS words or "SECTION N - TITLE"
    const isSectionHeading =
      /^[A-Z][A-Z\s0-9\-–&:,.']+$/.test(clean) &&
      clean.length > 3 &&
      clean.length < 90 &&
      !/^(N\/A|USD|US|OR|AND|OF|FOR|THE|IN|TO|A)$/.test(clean);

    // Numbered section like "1. TITLE" or "Section 1:"
    const isNumberedHeading = /^(\d+\.|Section\s+\d+[:.])/.test(clean) && clean.length < 100;

    if (isSectionHeading || isNumberedHeading) {
      if (doc.y > 150) doc.moveDown(0.6);
      if (doc.y > doc.page.height - doc.page.margins.bottom - 80) doc.addPage();

      doc
        .fillColor(navy)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(clean, 72, doc.y, { width: pageWidth });

      doc
        .moveTo(72, doc.y + 2)
        .lineTo(72 + Math.min(doc.widthOfString(clean), pageWidth), doc.y + 2)
        .strokeColor(accentBlue)
        .lineWidth(1)
        .stroke();

      doc.moveDown(0.5);
    } else if (/^[-•]\s+/.test(trimmed) || /^\s{2,}[-•]\s+/.test(line)) {
      const bullet = clean.replace(/^[-•]\s*/, '');
      doc
        .fillColor(slate)
        .font('Helvetica')
        .fontSize(10)
        .text(`  • ${bullet}`, 72, doc.y, { width: pageWidth });
      doc.moveDown(0.2);
    } else if (/^\d+\.\s+[a-z]/.test(trimmed)) {
      // Sub-numbered item
      doc
        .fillColor(slate)
        .font('Helvetica')
        .fontSize(10)
        .text(`     ${clean}`, 72, doc.y, { width: pageWidth });
      doc.moveDown(0.2);
    } else if (/^_{3,}/.test(trimmed) || /^-{3,}/.test(trimmed)) {
      // Signature line
      doc
        .moveTo(72, doc.y + 8)
        .lineTo(72 + pageWidth / 2, doc.y + 8)
        .strokeColor('#000000')
        .lineWidth(0.5)
        .stroke();
      doc.moveDown(1.2);
    } else {
      doc
        .fillColor(slate)
        .font('Helvetica')
        .fontSize(10)
        .text(clean, 72, doc.y, { width: pageWidth });
      doc.moveDown(0.3);
    }
  }
}

function appendSignatureBlock(
  doc: InstanceType<typeof PDFDocument>,
  data: ContractFormData,
  pageWidth: number,
  navy: string,
  slate: string,
  borderGray: string
) {
  if (doc.y > doc.page.height - 250) doc.addPage();

  doc.moveDown(1.5);
  doc.rect(72, doc.y, pageWidth, 1.5).fill(borderGray);
  doc.moveDown(1.5);

  doc
    .fillColor(navy)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('SIGNATURES', 72, doc.y, { width: pageWidth });
  doc.moveDown(0.5);

  doc
    .fillColor(slate)
    .font('Helvetica')
    .fontSize(9)
    .text(
      'By signing below, both parties agree to all terms and conditions of this Agreement.',
      72,
      doc.y,
      { width: pageWidth }
    );
  doc.moveDown(1.5);

  const sigTop = doc.y;
  const colW = pageWidth / 2 - 24;

  // Designer signature
  doc
    .fillColor(navy)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('SERVICE PROVIDER', 72, sigTop);

  doc
    .moveTo(72, sigTop + 40)
    .lineTo(72 + colW, sigTop + 40)
    .strokeColor('#000000')
    .lineWidth(0.5)
    .stroke();
  doc
    .fillColor(slate)
    .font('Helvetica')
    .fontSize(8)
    .text('Signature', 72, sigTop + 44);
  doc
    .fillColor(slate)
    .font('Helvetica')
    .fontSize(9)
    .text(data.designerName, 72, sigTop + 56);

  doc
    .moveTo(72, sigTop + 80)
    .lineTo(72 + colW, sigTop + 80)
    .strokeColor('#000000')
    .lineWidth(0.5)
    .stroke();
  doc
    .fillColor(slate)
    .font('Helvetica')
    .fontSize(8)
    .text('Date', 72, sigTop + 84);

  // Client signature
  const clientSigX = 72 + pageWidth / 2 + 24;
  doc
    .fillColor(navy)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('CLIENT', clientSigX, sigTop);

  doc
    .moveTo(clientSigX, sigTop + 40)
    .lineTo(clientSigX + colW, sigTop + 40)
    .strokeColor('#000000')
    .lineWidth(0.5)
    .stroke();
  doc
    .fillColor(slate)
    .font('Helvetica')
    .fontSize(8)
    .text('Signature', clientSigX, sigTop + 44);
  doc
    .fillColor(slate)
    .font('Helvetica')
    .fontSize(9)
    .text(data.clientName, clientSigX, sigTop + 56);

  doc
    .moveTo(clientSigX, sigTop + 80)
    .lineTo(clientSigX + colW, sigTop + 80)
    .strokeColor('#000000')
    .lineWidth(0.5)
    .stroke();
  doc
    .fillColor(slate)
    .font('Helvetica')
    .fontSize(8)
    .text('Date', clientSigX, sigTop + 84);
}
