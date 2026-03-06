import Anthropic from '@anthropic-ai/sdk';
import { ContractFormData } from '../types.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildPricingSection(pricing: ContractFormData['pricing']): string {
  switch (pricing.type) {
    case 'hourly':
      return `Pricing Structure: Hourly Rate
- Rate: $${pricing.hourlyRate}/hour
- Estimated Hours: ${pricing.estimatedHours} hours
- Estimated Total: $${(pricing.hourlyRate ?? 0) * (pricing.estimatedHours ?? 0)}
- Billing Frequency: ${pricing.billingFrequency}
- Payment due within 14 days of invoice`;

    case 'fixed':
      return `Pricing Structure: Fixed Price
- Total Project Fee: $${pricing.fixedAmount}
- Deposit: ${pricing.depositPercent}% ($${Math.round(((pricing.fixedAmount ?? 0) * (pricing.depositPercent ?? 0)) / 100)}) due upon signing
- Remaining balance due upon project completion`;

    case 'retainer':
      return `Pricing Structure: Monthly Retainer
- Monthly Retainer Fee: $${pricing.retainerAmount}
- Hours Included: ${pricing.hoursIncluded} hours/month
- Overtime Rate: $${pricing.overtimeRate}/hour for additional hours
- Billed on the 1st of each month`;

    case 'milestone':
      const milestones = pricing.milestones ?? [];
      const total = milestones.reduce((sum, m) => sum + m.amount, 0);
      return `Pricing Structure: Milestone-Based
- Total Project Value: $${total}
- Payment Schedule:
${milestones.map((m, i) => `  Milestone ${i + 1}: ${m.name} - $${m.amount} due ${m.dueDate}`).join('\n')}`;
  }
}

export async function generateContract(data: ContractFormData): Promise<string> {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pricingSection = buildPricingSection(data.pricing);

  const prompt = `You are a legal professional specializing in freelance design contracts. Generate a comprehensive, professional freelance design services contract based on the following details. The contract must be legally protective for the designer while remaining fair and clear.

CONTRACT DETAILS:
================

EFFECTIVE DATE: ${today}

DESIGNER (Service Provider):
- Name: ${data.designerName}
- Business: ${data.businessName || data.designerName}
- Email: ${data.designerEmail}
- Phone: ${data.designerPhone}
- Address: ${data.designerAddress}

CLIENT:
- Name: ${data.clientName}
- Company: ${data.clientCompany || 'N/A'}
- Email: ${data.clientEmail}
- Phone: ${data.clientPhone}
- Address: ${data.clientAddress}

PROJECT:
- Title: ${data.projectTitle}
- Description: ${data.projectDescription}
- Deliverables: ${data.deliverables}
- Start Date: ${data.startDate}
- End Date: ${data.endDate}
- Revision Rounds Included: ${data.revisionRounds}

${pricingSection}

LEGAL JURISDICTION: ${data.jurisdiction}

ADDITIONAL TERMS:
${data.additionalTerms || 'None'}

Generate a complete, professional contract that includes ALL of the following sections, fully written out (not placeholders):

1. AGREEMENT HEADER - Title, parties, effective date
2. SERVICES & SCOPE OF WORK - Detailed description of what will be delivered
3. PROJECT TIMELINE - Start, end dates, milestone schedule if applicable
4. COMPENSATION & PAYMENT TERMS - Full payment details based on the pricing structure above
5. LATE PAYMENT POLICY - Late fees (1.5% monthly), suspension of work clause
6. REVISION POLICY - Number of included revisions, cost for additional revisions
7. INTELLECTUAL PROPERTY & COPYRIGHT - Work-for-hire terms, license grant upon full payment
8. DESIGNER'S RIGHTS - Portfolio use, credit, case study rights
9. CLIENT RESPONSIBILITIES - Timely feedback, content provision, approval process
10. CONFIDENTIALITY - NDA-style protection for both parties
11. INDEPENDENT CONTRACTOR STATUS - Not employee, no benefits, tax responsibility
12. TERMINATION CLAUSE - 14-day notice, kill fee (50% of remaining balance), deliverables upon payment
13. LIMITATION OF LIABILITY - Cap at project value, no indirect damages
14. FORCE MAJEURE - Reasonable delays for unforeseen circumstances
15. DISPUTE RESOLUTION - Good faith negotiation, then mediation, then jurisdiction courts
16. ENTIRE AGREEMENT - Supersedes prior agreements, amendment process
17. SIGNATURES - Formatted signature blocks for both parties

Write the entire contract in formal legal language. Use clear section headings. Be specific about the amounts, dates, and terms provided. Do not use placeholder text — every field should be filled in with the actual data provided. The contract should be ready to print and sign.`;

  // Use type assertion to support adaptive thinking (SDK types may lag)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamParams: any = {
    model: 'claude-opus-4-6',
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  };
  const stream = client.messages.stream(streamParams);

  const finalMessage = await stream.finalMessage();

  const textBlock = finalMessage.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return textBlock.text;
}
