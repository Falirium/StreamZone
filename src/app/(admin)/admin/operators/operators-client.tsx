'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { createOperator, updateOperator, toggleOperatorActive, deleteOperator } from './actions';

interface Assignment {
  id: string;
  countryId: string;
  country: {
    id: string;
    name: string;
    code: string;
  };
}

interface Operator {
  id: string;
  phoneNumber: string;
  displayName: string;
  isActive: boolean;
  defaultWeight: number;
  templateText: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: Assignment[];
}

interface Country {
  id: string;
  name: string;
  code: string;
}

export function OperatorsClient({
  initialOperators,
  countries,
}: {
  initialOperators: Operator[];
  countries: Country[];
}) {
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Operator | null>(null);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setSelectedCountries([]);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (operator: Operator) => {
    setEditing(operator);
    setSelectedCountries(operator.assignments.map((a) => a.countryId));
    setError(null);
    setModalOpen(true);
  };

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(async () => {
      const result = await toggleOperatorActive(id, !current);
      if (result.success) {
        setOperators((prev) =>
          prev.map((op) => (op.id === id ? { ...op, isActive: !current } : op))
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this operator?')) return;
    startTransition(async () => {
      const result = await deleteOperator(id);
      if (result.success) {
        setOperators((prev) => prev.filter((op) => op.id !== id));
      }
    });
  };

  const handleCheckboxChange = (countryId: string, checked: boolean) => {
    if (checked) {
      setSelectedCountries((prev) => [...prev, countryId]);
    } else {
      setSelectedCountries((prev) => prev.filter((id) => id !== countryId));
    }
  };

  const handleSubmit = async (formData: FormData) => {
    formData.append('countryIds', JSON.stringify(selectedCountries));

    startTransition(async () => {
      const result = editing ? await updateOperator(formData) : await createOperator(formData);
      if (!result.success) {
        setError(result.error || 'Something went wrong');
      } else {
        setModalOpen(false);
        setError(null);
        // Refresh operator list locally
        window.location.reload();
      }
    });
  };

  const columns = [
    {
      key: 'displayName',
      label: 'Operator Name',
      render: (row: Operator) => (
        <div>
          <p className="font-medium text-white">{row.displayName}</p>
          <p className="text-xs text-white/40">{row.phoneNumber}</p>
        </div>
      ),
    },
    {
      key: 'defaultWeight',
      label: 'Weight',
      className: 'w-20',
      render: (row: Operator) => <span className="font-mono">{row.defaultWeight}</span>,
    },
    {
      key: 'countries',
      label: 'Assigned Countries',
      render: (row: Operator) => (
        <div className="flex flex-wrap gap-1">
          {row.assignments.length > 0 ? (
            row.assignments.map((a) => (
              <span
                key={a.id}
                className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs font-semibold text-white/70"
              >
                {a.country.name} ({a.country.code})
              </span>
            ))
          ) : (
            <span className="text-xs text-white/30 italic">All Countries (Global)</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      className: 'w-24',
      render: (row: Operator) => (
        <button onClick={() => handleToggleActive(row.id, row.isActive)}>
          <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        </button>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-36 text-right',
      render: (row: Operator) => (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)} className="text-red-400 hover:text-red-300">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">WhatsApp Operators</h1>
          <p className="text-xs text-white/50 mt-1">
            Manage agent accounts and weights for routing checkout traffic.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          + Add Operator
        </Button>
      </div>

      <DataTable columns={columns} data={operators} keyField="id" emptyMessage="No operators found" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Operator' : 'Add Operator'}
        maxWidth="lg"
      >
        <form action={handleSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="grid grid-cols-2 gap-4">
            <Input
              name="displayName"
              label="Operator Name"
              defaultValue={editing?.displayName || ''}
              required
              placeholder="e.g. Agent Khalid"
            />
            <Input
              name="phoneNumber"
              label="WhatsApp Phone Number (E.164)"
              defaultValue={editing?.phoneNumber || ''}
              required
              placeholder="e.g. +212600000000"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input
                name="defaultWeight"
                label="Weight (Capacity)"
                type="number"
                defaultValue={editing?.defaultWeight?.toString() || '1'}
                required
                min="1"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium text-white/60">Dynamic Routing Status</label>
              <div className="flex items-center h-10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editing?.isActive ?? true}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-600 focus:ring-brand-500/50"
                  />
                  <span className="text-sm text-white/70">Receive active traffic</span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Prefilled Message Template</label>
            <textarea
              name="templateText"
              defaultValue={editing?.templateText || ''}
              placeholder="Optional. Hi! I would like to pay for {plan_name}. My user ID is {user_id}."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm resize-none"
            />
            <span className="text-[10px] text-white/40 block">
              Supported template placeholders: {"{plan_name}, {plan_price}, {plan_currency}, {user_id}, {user_phone}, {txn_ref}"}.
            </span>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/60">Country Assignments</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-white/5 border border-white/10 max-h-40 overflow-y-auto">
              {countries.map((c) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
                  <input
                    type="checkbox"
                    checked={selectedCountries.includes(c.id)}
                    onChange={(e) => handleCheckboxChange(c.id, e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-600 focus:ring-brand-500/50"
                  />
                  <span>
                    {c.name} ({c.code})
                  </span>
                </label>
              ))}
            </div>
            <span className="text-[10px] text-white/40 block">
              If no country is selected, this operator acts as a global default fallback.
            </span>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" loading={isPending}>
              {editing ? 'Save Changes' : 'Create Operator'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
