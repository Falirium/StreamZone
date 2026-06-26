'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { createCountry, updateCountry, toggleCountryActive } from './actions';

interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  paymentNotes: string | null;
  isActive: boolean;
  _count: { profiles: number; prices: number };
}

export function CountriesClient({ countries }: { countries: Country[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (country: Country) => {
    setEditing(country);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updateCountry(formData)
        : await createCountry(formData);

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
      await toggleCountryActive(id, !currentActive);
    });
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'ISO Code', className: 'w-20' },
    { key: 'currency', label: 'Currency', className: 'w-24' },
    {
      key: 'paymentNotes',
      label: 'Payment Notes',
      render: (row: Country) => (
        <span className="text-white/50 text-xs max-w-[200px] truncate block">
          {row.paymentNotes || '—'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      className: 'w-24',
      render: (row: Country) => (
        <button onClick={() => handleToggle(row.id, row.isActive)}>
          <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        </button>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      className: 'w-28',
      render: (row: Country) => (
        <span className="text-xs text-white/40">
          {row._count.profiles} users · {row._count.prices} prices
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-16',
      render: (row: Country) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Countries</h1>
        <Button size="sm" onClick={openCreate}>
          + Add Country
        </Button>
      </div>

      <DataTable columns={columns} data={countries} keyField="id" emptyMessage="No countries yet" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Country' : 'Add Country'}
      >
        <form action={handleSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <Input
            name="name"
            label="Country Name"
            defaultValue={editing?.name || ''}
            required
            placeholder="e.g. United States"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="code"
              label="ISO Code"
              defaultValue={editing?.code || ''}
              required
              placeholder="US"
              maxLength={2}
            />
            <Input
              name="currency"
              label="Currency"
              defaultValue={editing?.currency || ''}
              required
              placeholder="USD"
              maxLength={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Payment Notes</label>
            <textarea
              name="paymentNotes"
              defaultValue={editing?.paymentNotes || ''}
              placeholder="e.g. Pay via Zelle, CashApp, or Venmo"
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm resize-none"
            />
          </div>

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
              {editing ? 'Save Changes' : 'Create Country'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
