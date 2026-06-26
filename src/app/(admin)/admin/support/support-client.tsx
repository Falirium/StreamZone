'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { updateSupportCase } from './actions';

interface SupportCase {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminNote: string | null;
  resolvedBy: string | null;
  createdAt: string;
  user: { phone: string | null; email: string } | null;
}

export function SupportClient({ cases }: { cases: SupportCase[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<SupportCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const filtered = filter === 'all' ? cases : cases.filter((c) => c.status === filter);

  const openEdit = (c: SupportCase) => {
    setSelected(c);
    setError(null);
    setModalOpen(true);
  };

  const handleUpdate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await updateSupportCase(formData);
      if (!result.success) setError(result.error || 'Something went wrong');
      else { setModalOpen(false); setError(null); }
    });
  };

  const columns = [
    {
      key: 'user', label: 'User', className: 'w-36',
      render: (row: SupportCase) => <span className="text-sm font-medium text-white">{row.user?.email || row.user?.phone || 'Guest'}</span>,
    },
    {
      key: 'subject', label: 'Subject',
      render: (row: SupportCase) => <span className="font-medium">{row.subject}</span>,
    },
    {
      key: 'status', label: 'Status', className: 'w-28',
      render: (row: SupportCase) => (
        <StatusBadge variant={getStatusVariant(row.status)}>
          {row.status.replace('_', ' ')}
        </StatusBadge>
      ),
    },
    {
      key: 'createdAt', label: 'Created', className: 'w-32',
      render: (row: SupportCase) => <span className="text-xs">{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'actions', label: '', className: 'w-20',
      render: (row: SupportCase) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Manage</Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Support Cases</h1>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              {s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyField="id" emptyMessage="No support cases found" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Manage Support Case" maxWidth="lg">
        {selected && (
          <div className="space-y-6">
            <div className="glass rounded-lg p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{selected.subject}</h3>
                  <p className="text-sm text-white/50 font-mono mt-1">{selected.user?.email || selected.user?.phone || 'Guest'}</p>
                </div>
                <StatusBadge variant={getStatusVariant(selected.status)}>
                  {selected.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              <div className="bg-surface-900 rounded p-4 text-sm text-white/80 whitespace-pre-wrap">
                {selected.message}
              </div>
            </div>

            <form action={handleUpdate} className="space-y-4">
              <input type="hidden" name="id" value={selected.id} />
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/60">Status</label>
                <select name="status" defaultValue={selected.status} className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm">
                  <option value="open" className="bg-surface-800">Open</option>
                  <option value="in_progress" className="bg-surface-800">In Progress</option>
                  <option value="resolved" className="bg-surface-800">Resolved</option>
                  <option value="closed" className="bg-surface-800">Closed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/60">Admin Notes (internal only)</label>
                <textarea name="adminNote" defaultValue={selected.adminNote || ''} rows={3} placeholder="Add notes about how this was resolved..."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button size="sm" type="submit" loading={isPending}>Save Changes</Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}
