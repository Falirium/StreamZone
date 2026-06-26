'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { createPrice, updatePrice, togglePriceActive } from './actions';
import { Decimal } from '@prisma/client/runtime/library';

interface PlanRef { id: string; name: string }
interface CountryRef { id: string; name: string; code: string; currency: string }

interface Price {
  id: string;
  amount: Decimal;
  currency: string;
  whopPlanId: string | null;
  isActive: boolean;
  plan: { id: string; name: string };
  country: { id: string; name: string; code: string };
}

interface PricesClientProps {
  prices: Price[];
  plans: PlanRef[];
  countries: CountryRef[];
}

export function PricesClient({ prices, plans, countries }: PricesClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Price | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setSelectedCountryId('');
    setModalOpen(true);
  };

  const openEdit = (price: Price) => {
    setEditing(price);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updatePrice(formData)
        : await createPrice(formData);

      if (!result.success) {
        setError(result.error || 'Something went wrong');
      } else {
        setModalOpen(false);
        setError(null);
      }
    });
  };

  const handleToggle = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      await togglePriceActive(id, !currentActive);
    });
  };

  // Auto-fill currency when country changes
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId);
  };

  const selectedCurrency = countries.find((c) => c.id === selectedCountryId)?.currency || '';

  const columns = [
    {
      key: 'plan',
      label: 'Plan',
      render: (row: Price) => <span className="font-medium">{row.plan.name}</span>,
    },
    {
      key: 'country',
      label: 'Country',
      render: (row: Price) => `${row.country.name} (${row.country.code})`,
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'w-32',
      render: (row: Price) => (
        <span className="font-mono">
          {Number(row.amount).toFixed(2)} {row.currency}
        </span>
      ),
    },
    {
      key: 'whopPlanId',
      label: 'Whop Plan ID',
      render: (row: Price) => (
        <span className="font-mono text-xs text-white/60">
          {row.whopPlanId || '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      className: 'w-24',
      render: (row: Price) => (
        <button onClick={() => handleToggle(row.id, row.isActive)}>
          <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-16',
      render: (row: Price) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Prices</h1>
        <Button size="sm" onClick={openCreate}>
          + Add Price
        </Button>
      </div>

      <DataTable columns={columns} data={prices} keyField="id" emptyMessage="No prices configured yet" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Price' : 'Add Price'}
      >
        <form action={handleSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          {!editing && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/60">Plan</label>
                <select
                  name="planId"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm"
                >
                  <option value="">Select a plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id} className="bg-surface-800">
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/60">Country</label>
                <select
                  name="countryId"
                  required
                  value={selectedCountryId}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm"
                >
                  <option value="">Select a country...</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id} className="bg-surface-800">
                      {country.name} ({country.code})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="amount"
              label="Amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={editing ? Number(editing.amount) : ''}
              required
              placeholder="9.99"
            />
            <Input
              name="currency"
              label="Currency"
              defaultValue={editing?.currency || selectedCurrency}
              required
              placeholder="USD"
              maxLength={3}
            />
          </div>

          <Input
            name="whopPlanId"
            label="Whop Plan ID (Optional)"
            defaultValue={editing?.whopPlanId || ''}
            placeholder="plan_XYZ123"
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={editing?.isActive ?? true}
              className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-600 focus:ring-brand-500/50"
            />
            <span className="text-sm text-white/60">Active</span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={isPending}>
              {editing ? 'Save Changes' : 'Create Price'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
