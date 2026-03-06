import { useState } from "react";
import PricingSection from './components/PricingSection';
import { ContractFormData, GeneratedContract } from './types/contract';

const DEFAULT_FORM: ContractFormData = {
  designerName: '',
  designerEmail: '',
  designerPhone: '',
  designerAddress: '',
  businessName: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  clientCompany: '',
  projectTitle: '',
  projectDescription: '',
  deliverables: '',
  startDate: '',
  endDate: '',
  revisionRounds: 2,
  pricing: { type: 'fixed', fixedAmount: undefined, depositPercent: 50 },
  additionalTerms: '',
  jurisdiction: '',
};

type Step = 'form' | 'generating' | 'review';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-base font-semibold text-gray-800">{children}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<ContractFormData>(DEFAULT_FORM);
  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const set = (updates: Partial<ContractFormData>) =>
    setForm((f) => ({ ...f, ...updates }));

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('generating');

    try {
      const res = await fetch('/api/contract/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setContract({ content: data.contractText, generatedAt: new Date().toISOString() });
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate contract');
      setStep('form');
    }
  };

  const handleDownloadPDF = async () => {
    if (!contract) return;
    setDownloading(true);
    setError(null);

    try {
      const res = await fetch('/api/contract/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractText: contract.content, formData: form }),
      });

      if (!res.ok) {
        throw new Error(`PDF generation failed: ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${form.projectTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Contract.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">ContractGen</span>
            <span className="text-gray-400 text-sm">for Freelance Designers</span>
          </div>
          {step === 'review' && (
            <button
              onClick={() => { setStep('form'); setContract(null); }}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium"
            >
              ← Start New Contract
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* GENERATING STATE */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Contract</h2>
              <p className="text-gray-500 text-sm max-w-md">
                Claude is drafting a professional, legally protective contract tailored to your project details...
              </p>
            </div>
          </div>
        )}

        {/* REVIEW STATE */}
        {step === 'review' && contract && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Contract is Ready</h1>
                <p className="text-gray-500 text-sm mt-1">Review the contract below, then download as PDF for signing.</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                {downloading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Contract header */}
              <div className="bg-slate-800 text-white px-8 py-6">
                <h2 className="text-lg font-semibold">Freelance Design Services Agreement</h2>
                <p className="text-slate-400 text-sm mt-1">{form.projectTitle}</p>
              </div>
              {/* Contract body */}
              <div className="px-8 py-8">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                  {contract.content}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* FORM STATE */}
        {step === 'form' && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Create Your Contract</h1>
              <p className="text-gray-500 mt-2">
                Fill in your project details and Claude will generate a professional, legally protective freelance design contract.
              </p>
            </div>

            <form onSubmit={handleGenerate} className="space-y-8">

              {/* ── YOUR INFORMATION ── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SectionTitle>Your Information</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Your Full Name" required>
                    <input
                      type="text"
                      required
                      value={form.designerName}
                      onChange={(e) => set({ designerName: e.target.value })}
                      placeholder="Jane Doe"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Business / Studio Name">
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={(e) => set({ businessName: e.target.value })}
                      placeholder="Jane Doe Design Studio"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Email" required>
                    <input
                      type="email"
                      required
                      value={form.designerEmail}
                      onChange={(e) => set({ designerEmail: e.target.value })}
                      placeholder="jane@designstudio.com"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      type="tel"
                      value={form.designerPhone}
                      onChange={(e) => set({ designerPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="input-field"
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Business Address">
                      <input
                        type="text"
                        value={form.designerAddress}
                        onChange={(e) => set({ designerAddress: e.target.value })}
                        placeholder="123 Main St, City, State 12345"
                        className="input-field"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* ── CLIENT INFORMATION ── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SectionTitle>Client Information</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Client Full Name" required>
                    <input
                      type="text"
                      required
                      value={form.clientName}
                      onChange={(e) => set({ clientName: e.target.value })}
                      placeholder="John Smith"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Client Company">
                    <input
                      type="text"
                      value={form.clientCompany}
                      onChange={(e) => set({ clientCompany: e.target.value })}
                      placeholder="Acme Corp"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Client Email" required>
                    <input
                      type="email"
                      required
                      value={form.clientEmail}
                      onChange={(e) => set({ clientEmail: e.target.value })}
                      placeholder="john@acmecorp.com"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Client Phone">
                    <input
                      type="tel"
                      value={form.clientPhone}
                      onChange={(e) => set({ clientPhone: e.target.value })}
                      placeholder="+1 (555) 000-0001"
                      className="input-field"
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Client Address">
                      <input
                        type="text"
                        value={form.clientAddress}
                        onChange={(e) => set({ clientAddress: e.target.value })}
                        placeholder="456 Business Ave, City, State 67890"
                        className="input-field"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* ── PROJECT DETAILS ── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SectionTitle>Project Details</SectionTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Project Title" required>
                      <input
                        type="text"
                        required
                        value={form.projectTitle}
                        onChange={(e) => set({ projectTitle: e.target.value })}
                        placeholder="Brand Identity Design for Acme Corp"
                        className="input-field"
                      />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Project Description" required>
                      <textarea
                        required
                        rows={3}
                        value={form.projectDescription}
                        onChange={(e) => set({ projectDescription: e.target.value })}
                        placeholder="Describe the project scope, goals, and context..."
                        className="input-field resize-none"
                      />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Deliverables" required>
                      <textarea
                        required
                        rows={3}
                        value={form.deliverables}
                        onChange={(e) => set({ deliverables: e.target.value })}
                        placeholder="List all deliverables, e.g.:&#10;• Logo (SVG, PNG, PDF formats)&#10;• Brand style guide (PDF)&#10;• Business card design"
                        className="input-field resize-none"
                      />
                    </Field>
                  </div>
                  <Field label="Start Date" required>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => set({ startDate: e.target.value })}
                      className="input-field"
                    />
                  </Field>
                  <Field label="End Date / Deadline" required>
                    <input
                      type="date"
                      required
                      value={form.endDate}
                      onChange={(e) => set({ endDate: e.target.value })}
                      className="input-field"
                    />
                  </Field>
                  <Field label="Revision Rounds Included">
                    <select
                      value={form.revisionRounds}
                      onChange={(e) => set({ revisionRounds: Number(e.target.value) })}
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n} round{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Governing Jurisdiction" required>
                    <input
                      type="text"
                      required
                      value={form.jurisdiction}
                      onChange={(e) => set({ jurisdiction: e.target.value })}
                      placeholder="e.g. California, USA"
                      className="input-field"
                    />
                  </Field>
                </div>
              </div>

              {/* ── PRICING ── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SectionTitle>Pricing & Payment Terms</SectionTitle>
                <PricingSection
                  pricing={form.pricing}
                  onChange={(pricing) => set({ pricing })}
                />
              </div>

              {/* ── ADDITIONAL TERMS ── */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <SectionTitle>Additional Terms (Optional)</SectionTitle>
                <textarea
                  rows={4}
                  value={form.additionalTerms}
                  onChange={(e) => set({ additionalTerms: e.target.value })}
                  placeholder="Any special terms, exclusions, or notes you want included in the contract..."
                  className="input-field resize-none w-full"
                />
              </div>

              {/* ── SUBMIT ── */}
              <div className="flex justify-end pb-8">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors shadow-sm text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generate Contract
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
