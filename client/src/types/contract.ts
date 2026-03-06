export type PricingType = 'hourly' | 'fixed' | 'retainer' | 'milestone';

export interface MilestonePayment {
  name: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface PricingDetails {
  type: PricingType;
  // Hourly
  hourlyRate?: number;
  estimatedHours?: number;
  billingFrequency?: 'weekly' | 'biweekly' | 'monthly';
  // Fixed price
  fixedAmount?: number;
  depositPercent?: number;
  // Retainer
  retainerAmount?: number;
  hoursIncluded?: number;
  overtimeRate?: number;
  // Milestone
  milestones?: MilestonePayment[];
}

export interface ContractFormData {
  // Designer info
  designerName: string;
  designerEmail: string;
  designerPhone: string;
  designerAddress: string;
  businessName: string;

  // Client info
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCompany: string;

  // Project details
  projectTitle: string;
  projectDescription: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  revisionRounds: number;

  // Pricing
  pricing: PricingDetails;

  // Extra
  additionalTerms: string;
  jurisdiction: string;
}

export interface GeneratedContract {
  content: string;
  generatedAt: string;
}
