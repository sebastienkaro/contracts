export type PricingType = 'hourly' | 'fixed' | 'retainer' | 'milestone';

export interface MilestonePayment {
  name: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface PricingDetails {
  type: PricingType;
  hourlyRate?: number;
  estimatedHours?: number;
  billingFrequency?: 'weekly' | 'biweekly' | 'monthly';
  fixedAmount?: number;
  depositPercent?: number;
  retainerAmount?: number;
  hoursIncluded?: number;
  overtimeRate?: number;
  milestones?: MilestonePayment[];
}

export interface ContractFormData {
  designerName: string;
  designerEmail: string;
  designerPhone: string;
  designerAddress: string;
  businessName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCompany: string;
  projectTitle: string;
  projectDescription: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  revisionRounds: number;
  pricing: PricingDetails;
  additionalTerms: string;
  jurisdiction: string;
}
