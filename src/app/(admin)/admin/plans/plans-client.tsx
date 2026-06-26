'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { createPlan, updatePlan, togglePlanActive } from './actions';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  durationDays: number;
  maxDevices: number;
  isActive: boolean;
  _count: { prices: number; accessCodes: number; entitlements: number };
}

export function PlansClient({ plans }: { plans: Plan[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => {
    setEditing(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editing
        ? await updatePlan(formData)
        : await createPlan(formData);

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
      await togglePlanActive(id, !currentActive);
    });
  };

  const columns = [
    { key: 'name', label: 'Plan Name' },
    {
      key: 'description',
      label: 'Description',
      render: (row: Plan) => (
        <span className="text-white/50 text-xs max-w-[200px] truncate block">
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'durationDays',
      label: 'Duration',
      className: 'w-24',
      render: (row: Plan) => `${row.durationDays} day${row.durationDays > 1 ? 's' : ''}`,
    },
    {
      key: 'maxDevices',
      label: 'Screens',
      className: 'w-24',
      render: (row: Plan) => `${row.maxDevices} screen${row.maxDevices > 1 ? 's' : ''}`,
    },
    {
      key: 'isActive',
      label: 'Status',
      className: 'w-24',
      render: (row: Plan) => (
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
      className: 'w-36',
      render: (row: Plan) => (
        <span className="text-xs text-white/40">
          {row._count.prices} prices · {row._count.accessCodes} codes
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-16',
      render: (row: Plan) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Plans</h1>
        <Button size="sm" onClick={openCreate}>
          + Add Plan
        </Button>
      </div>

      <DataTable columns={columns} data={plans} keyField="id" emptyMessage="No plans yet" />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Plan' : 'Add Plan'}
      >
        <form action={handleSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <Input
            name="name"
            label="Plan Name"
            defaultValue={editing?.name || ''}
            required
            placeholder="e.g. Match Pass"
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Description</label>
            <textarea
              name="description"
              defaultValue={editing?.description || ''}
              placeholder="e.g. Access to a single live event"
              rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm resize-none"
            />
          </div>

          <Input
            name="durationDays"
            label="Duration (days)"
            type="number"
            min={1}
            defaultValue={editing?.durationDays || 1}
            required
          />

          <Input
            name="maxDevices"
            label="Device Limit (Simultaneous Screens)"
            type="number"
            min={1}
            defaultValue={editing?.maxDevices || 1}
            required
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
              {editing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
