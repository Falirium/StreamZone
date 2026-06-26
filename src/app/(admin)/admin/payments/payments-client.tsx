'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { reviewPayment } from './actions';
import { Decimal } from '@prisma/client/runtime/library';

interface Payment {
  id: string;
  amount: Decimal;
  currency: string;
  method: string | null;
  reference: string | null;
  proofUrl: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; email: string; phone: string | null };
}

export function PaymentsClient({ payments }: { payments: Payment[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [approvedCode, setApprovedCode] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const filtered = filter === 'all' ? payments : payments.filter((p) => p.status === filter);

  const openReview = (payment: Payment) => {
    setSelected(payment);
    setError(null);
    setModalOpen(true);
  };

  const handleReview = async (formData: FormData) => {
    startTransition(async () => {
      const result = await reviewPayment(formData);
      if (!result.success) {
        setError(result.error || 'Something went wrong');
      } else {
        setModalOpen(false);
        setError(null);
        
        const data = result.data as { id: string; status: string; code: string | null } | undefined;
        if (data?.code) {
          setApprovedCode(data.code);
          setShowCodeModal(true);
        } else {
          window.location.reload();
        }
      }
    });
  };

  const columns = [
    {
      key: 'user', label: 'User',
      render: (row: Payment) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white">{row.user.email}</span>
          {row.user.phone && <span className="font-mono text-[10px] text-white/40">{row.user.phone}</span>}
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount', className: 'w-32',
      render: (row: Payment) => <span className="font-mono">{Number(row.amount).toFixed(2)} {row.currency}</span>,
    },
    { key: 'method', label: 'Method', className: 'w-28',
      render: (row: Payment) => row.method || '—',
    },
    { key: 'reference', label: 'Reference', className: 'w-32',
      render: (row: Payment) => <span className="text-xs text-white/50 truncate block max-w-[120px]">{row.reference || '—'}</span>,
    },
    {
      key: 'status', label: 'Status', className: 'w-28',
      render: (row: Payment) => (
        <StatusBadge variant={getStatusVariant(row.status)}>
          {row.status}
        </StatusBadge>
      ),
    },
    {
      key: 'createdAt', label: 'Date', className: 'w-36',
      render: (row: Payment) => <span className="text-xs">{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'actions', label: '', className: 'w-20',
      render: (row: Payment) => row.status === 'pending' ? (
        <Button variant="ghost" size="sm" onClick={() => openReview(row)}>Review</Button>
      ) : null,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payments</h1>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={filtered} keyField="id" emptyMessage="No payments yet" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Review Payment" maxWidth="sm">
        {selected && (
          <div className="space-y-4">
            <div className="glass rounded-lg p-4 space-y-2 text-sm">
              <p><span className="text-white/40">User:</span> {selected.user.email} {selected.user.phone ? `(${selected.user.phone})` : ''}</p>
              <p><span className="text-white/40">Amount:</span> {Number(selected.amount).toFixed(2)} {selected.currency}</p>
              {selected.method && <p><span className="text-white/40">Method:</span> {selected.method}</p>}
              {selected.reference && <p><span className="text-white/40">Reference:</span> {selected.reference}</p>}
            </div>

            <form action={handleReview} className="space-y-4">
              <input type="hidden" name="id" value={selected.id} />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/60">Review Note (optional)</label>
                <textarea name="reviewNote" rows={2} placeholder="Add a note..."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3 justify-end">
                <Button variant="danger" size="sm" type="submit" name="status" value="rejected" loading={isPending}>
                  Reject
                </Button>
                <Button size="sm" type="submit" name="status" value="approved" loading={isPending}>
                  Approve
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Code Copy Snippet Modal */}
      <Modal open={showCodeModal} onClose={() => { setShowCodeModal(false); window.location.reload(); }} title="Payment Approved" maxWidth="sm">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ✓
          </div>
          <p className="text-sm text-white/70">
            Payment has been successfully approved. The access code has been automatically generated and assigned.
          </p>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-left space-y-1">
            <span className="text-[10px] text-white/40 block font-bold uppercase tracking-wider">WhatsApp Clipboard Message</span>
            <pre className="text-xs text-white/90 whitespace-pre-wrap font-sans bg-black/20 p-3 rounded-lg border border-white/5">
              {`Hi! Your payment has been verified. Here is your access code: ${approvedCode}\nRedeem it here: ${origin}/redeem`}
            </pre>
          </div>

          <Button
            onClick={() => {
              const snippet = `Hi! Your payment has been verified. Here is your access code: ${approvedCode}\nRedeem it here: ${origin}/redeem`;
              navigator.clipboard.writeText(snippet);
              setShowCodeModal(false);
              window.location.reload();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold"
          >
            Copy Message & Close
          </Button>
        </div>
      </Modal>
    </>
  );
}
