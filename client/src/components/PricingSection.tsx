
import { PricingDetails, PricingType, MilestonePayment } from '../types/contract';

interface Props {
  pricing: PricingDetails;
  onChange: (pricing: PricingDetails) => void;
}

const PRICING_TYPES: { value: PricingType; label: string; description: string }[] = [
  { value: 'hourly', label: 'Hourly Rate', description: 'Bill by the hour — great for ongoing or variable-scope work' },
  { value: 'fixed', label: 'Fixed Price', description: 'One flat fee for the entire project scope' },
  { value: 'retainer', label: 'Monthly Retainer', description: 'Recurring monthly fee for dedicated availability' },
  { value: 'milestone', label: 'Milestone-Based', description: 'Payments tied to project milestones' },
];

export default function PricingSection({ pricing, onChange }: Props) {
  const set = (updates: Partial<PricingDetails>) =>
    onChange({ ...pricing, ...updates });

  const addMilestone = () => {
    const ms: MilestonePayment[] = [
      ...(pricing.milestones ?? []),
      { name: '', description: '', amount: 0, dueDate: '' },
    ];
    set({ milestones: ms });
  };

  const updateMilestone = (idx: number, updates: Partial<MilestonePayment>) => {
    const ms = [...(pricing.milestones ?? [])];
    ms[idx] = { ...ms[idx], ...updates };
    set({ milestones: ms });
  };

  const removeMilestone = (idx: number) => {
    const ms = (pricing.milestones ?? []).filter((_, i) => i !== idx);
    set({ milestones: ms });
  };

  return (
    <div>
      {/* Pricing Type Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PRICING_TYPES.map((pt) => (
          <button
            key={pt.value}
            type="button"
            onClick={() => set({ type: pt.value })}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              pricing.type === pt.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`font-semibold text-sm ${pricing.type === pt.value ? 'text-blue-700' : 'text-gray-800'}`}>
              {pt.label}
            </div>
            <div className="text-xs text-gray-500 mt-1">{pt.description}</div>
          </button>
        ))}
      </div>

      {/* Hourly Fields */}
      {pricing.type === 'hourly' && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
            <input
              type="number"
              min="0"
              value={pricing.hourlyRate ?? ''}
              onChange={(e) => set({ hourlyRate: Number(e.target.value) })}
              placeholder="e.g. 150"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
            <input
              type="number"
              min="0"
              value={pricing.estimatedHours ?? ''}
              onChange={(e) => set({ estimatedHours: Number(e.target.value) })}
              placeholder="e.g. 40"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Billing Frequency</label>
            <select
              value={pricing.billingFrequency ?? 'monthly'}
              onChange={(e) => set({ billingFrequency: e.target.value as PricingDetails['billingFrequency'] })}
              className="input-field"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {pricing.hourlyRate && pricing.estimatedHours ? (
            <div className="col-span-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              Estimated total: <strong>${(pricing.hourlyRate * pricing.estimatedHours).toLocaleString()}</strong>
              {' '}(billed at ${pricing.hourlyRate}/hr × {pricing.estimatedHours} hrs)
            </div>
          ) : null}
        </div>
      )}

      {/* Fixed Price Fields */}
      {pricing.type === 'fixed' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Project Fee ($)</label>
            <input
              type="number"
              min="0"
              value={pricing.fixedAmount ?? ''}
              onChange={(e) => set({ fixedAmount: Number(e.target.value) })}
              placeholder="e.g. 5000"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Percentage (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={pricing.depositPercent ?? 50}
              onChange={(e) => set({ depositPercent: Number(e.target.value) })}
              placeholder="50"
              className="input-field"
            />
          </div>
          {pricing.fixedAmount && pricing.depositPercent ? (
            <div className="col-span-2 bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              Deposit due at signing: <strong>${Math.round(pricing.fixedAmount * pricing.depositPercent / 100).toLocaleString()}</strong>
              {' '}· Remaining at completion: <strong>${Math.round(pricing.fixedAmount * (100 - pricing.depositPercent) / 100).toLocaleString()}</strong>
            </div>
          ) : null}
        </div>
      )}

      {/* Retainer Fields */}
      {pricing.type === 'retainer' && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Retainer ($)</label>
            <input
              type="number"
              min="0"
              value={pricing.retainerAmount ?? ''}
              onChange={(e) => set({ retainerAmount: Number(e.target.value) })}
              placeholder="e.g. 3000"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours Included / Month</label>
            <input
              type="number"
              min="0"
              value={pricing.hoursIncluded ?? ''}
              onChange={(e) => set({ hoursIncluded: Number(e.target.value) })}
              placeholder="e.g. 20"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Rate ($/hr)</label>
            <input
              type="number"
              min="0"
              value={pricing.overtimeRate ?? ''}
              onChange={(e) => set({ overtimeRate: Number(e.target.value) })}
              placeholder="e.g. 175"
              className="input-field"
            />
          </div>
        </div>
      )}

      {/* Milestone Fields */}
      {pricing.type === 'milestone' && (
        <div className="space-y-4">
          {(pricing.milestones ?? []).map((m, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-700 text-sm">Milestone {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="text-red-400 hover:text-red-600 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Milestone Name</label>
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMilestone(idx, { name: e.target.value })}
                    placeholder="e.g. Brand Identity Draft"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={m.amount || ''}
                    onChange={(e) => updateMilestone(idx, { amount: Number(e.target.value) })}
                    placeholder="e.g. 1500"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={m.dueDate}
                    onChange={(e) => updateMilestone(idx, { dueDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={m.description}
                    onChange={(e) => updateMilestone(idx, { description: e.target.value })}
                    placeholder="What gets delivered"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMilestone}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-500 text-sm font-medium transition-colors"
          >
            + Add Milestone
          </button>

          {(pricing.milestones ?? []).length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              Total project value: <strong>
                ${(pricing.milestones ?? []).reduce((s, m) => s + m.amount, 0).toLocaleString()}
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
