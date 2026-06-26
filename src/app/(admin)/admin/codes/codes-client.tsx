'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { generateCodes, revokeCode } from './actions';

interface PlanRef { id: string; name: string }
interface EventRef { id: string; title: string }

interface Code {
  id: string;
  code: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  plan: { id: string; name: string };
  event: { id: string; title: string } | null;
  redemption: { user: { phone: string | null; email: string } } | null;
}

interface CodesClientProps {
  codes: Code[];
  plans: PlanRef[];
  events: EventRef[];
}

export function CodesClient({ codes, plans, events }: CodesClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [isPending, startTransition] = useTransition();

  const filtered = filter === 'all' ? codes : codes.filter((c) => c.status === filter);

  const handleGenerate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await generateCodes(formData);
      if (!result.success) setError(result.error || 'Something went wrong');
      else { setModalOpen(false); setError(null); }
    });
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    startTransition(async () => {
      await revokeCode(revokeTarget);
      setRevokeTarget(null);
    });
  };

  const columns = [
    {
      key: 'code', label: 'Code',
      render: (row: Code) => <span className="font-mono text-xs tracking-wider">{row.code}</span>,
    },
    {
      key: 'plan', label: 'Plan',
      render: (row: Code) => row.plan.name,
    },
    {
      key: 'event', label: 'Event', className: 'w-40',
      render: (row: Code) => (
        <span className="text-xs text-white/50 truncate block max-w-[150px]">
          {row.event?.title || '—'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status', className: 'w-28',
      render: (row: Code) => (
        <StatusBadge variant={getStatusVariant(row.status)}>{row.status}</StatusBadge>
      ),
    },
    {
      key: 'assignedTo', label: 'Assigned To', className: 'w-36',
      render: (row: Code) => (
        <span className="font-mono text-xs">{row.redemption?.user.email || row.redemption?.user.phone || row.assignedTo || '—'}</span>
      ),
    },
    {
      key: 'createdAt', label: 'Created', className: 'w-32',
      render: (row: Code) => <span className="text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions', label: '', className: 'w-20',
      render: (row: Code) =>
        row.status === 'available' || row.status === 'assigned' || row.status === 'redeemed' ? (
          <Button variant="ghost" size="sm" onClick={() => { setRevokeTarget(row.id); setConfirmOpen(true); }}>
            Revoke
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Access Codes</h1>
        <div className="flex gap-3 items-center">
          <div className="flex gap-1">
            {['all', 'available', 'assigned', 'redeemed', 'revoked'].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => { setError(null); setModalOpen(true); }}>+ Generate</Button>
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyField="id" emptyMessage="No codes generated yet" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Generate Access Codes" maxWidth="sm">
        <form action={handleGenerate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Plan</label>
            <select name="planId" required className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm">
              <option value="">Select a plan...</option>
              {plans.map((p) => <option key={p.id} value={p.id} className="bg-surface-800">{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Event (optional)</label>
            <select name="eventId" className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm">
              <option value="" className="bg-surface-800">No specific event</option>
              {events.map((e) => <option key={e.id} value={e.id} className="bg-surface-800">{e.title}</option>)}
            </select>
          </div>

          <Input name="count" label="Number of codes" type="number" min={1} max={100} defaultValue={1} required />
          <Input name="assignedTo" label="Assign to phone (optional)" placeholder="+1234567890" />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={isPending}>Generate</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setRevokeTarget(null); }}
        onConfirm={handleRevoke}
        title="Revoke Code"
        message="This code will be permanently revoked. The user will lose access if they've redeemed it."
        confirmLabel="Revoke"
      />
    </>
  );
}
