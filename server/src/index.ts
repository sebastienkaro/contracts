import express from 'express';
import cors from 'cors';
import { generateContract } from './services/claude.js';
import { generatePDF } from './services/pdf.js';
import { ContractFormData } from './types.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Generate contract text
app.post('/api/contract/generate', async (req, res) => {
  try {
    const data: ContractFormData = req.body;

    if (!data.designerName || !data.clientName || !data.projectTitle) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const contractText = await generateContract(data);
    res.json({ contractText });
  } catch (err) {
    console.error('Contract generation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate contract';
    res.status(500).json({ error: message });
  }
});

// Generate PDF
app.post('/api/contract/pdf', async (req, res) => {
  try {
    const { contractText, formData }: { contractText: string; formData: ContractFormData } = req.body;

    if (!contractText || !formData) {
      res.status(400).json({ error: 'Missing contractText or formData' });
      return;
    }

    const pdfBuffer = await generatePDF(contractText, formData);

    const filename = `${formData.projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Contract.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate PDF';
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Contract generator server running on port ${PORT}`);
});
