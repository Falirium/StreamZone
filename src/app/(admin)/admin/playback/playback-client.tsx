'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { createPlaybackSource, deletePlaybackSource } from './actions';

interface EventRef { id: string; title: string }

interface PlaybackSource {
  id: string;
  matchId: string;
  sourceProvider: string;
  sourceMatchId: string;
  priority: number;
  isActive: boolean;
  event: { id: string; title: string; slug: string };
}

export function PlaybackClient({ sources, events }: { sources: PlaybackSource[]; events: EventRef[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createPlaybackSource(formData);
      if (!result.success) setError(result.error || 'Something went wrong');
      else { setModalOpen(false); setError(null); }
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deletePlaybackSource(deleteTarget);
      setDeleteTarget(null);
    });
  };

  const columns = [
    {
      key: 'event', label: 'Event',
      render: (row: PlaybackSource) => (
        <div>
          <p className="font-medium">{row.event.title}</p>
          <p className="text-xs text-white/40">/{row.event.slug}</p>
        </div>
      ),
    },
    { key: 'matchId', label: 'Match ID', className: 'w-32' },
    { key: 'sourceProvider', label: 'Provider', className: 'w-28' },
    { key: 'sourceMatchId', label: 'Source ID', className: 'w-28' },
    {
      key: 'priority', label: 'Priority', className: 'w-20',
      render: (row: PlaybackSource) => <span className="font-mono text-xs">{row.priority}</span>,
    },
    {
      key: 'isActive', label: 'Status', className: 'w-24',
      render: (row: PlaybackSource) => (
        <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'actions', label: '', className: 'w-20',
      render: (row: PlaybackSource) => (
        <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget(row.id); setConfirmOpen(true); }}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Playback Sources</h1>
        <Button size="sm" onClick={() => { setError(null); setModalOpen(true); }}>+ Add Source</Button>
      </div>

      <DataTable columns={columns} data={sources} keyField="id" emptyMessage="No playback sources configured" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Playback Source">
        <form action={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Event</label>
            <select name="eventId" required className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm">
              <option value="">Select an event...</option>
              {events.map((e) => <option key={e.id} value={e.id} className="bg-surface-800">{e.title}</option>)}
            </select>
          </div>
          <Input name="matchId" label="Match ID (from streamed.pk)" required placeholder="e.g. 12345" />
          <div className="grid grid-cols-2 gap-4">
            <Input name="sourceProvider" label="Source Provider" required placeholder="e.g. alpha" />
            <Input name="sourceMatchId" label="Source Match ID" required placeholder="e.g. 67890" />
          </div>
          <Input name="priority" label="Priority (lower = higher)" type="number" min={0} defaultValue={0} />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="isActive" defaultChecked={true} className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-600 focus:ring-brand-500/50" />
            <span className="text-sm text-white/60">Active</span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={isPending}>Create Source</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Delete Source"
        message="This playback source will be permanently deleted."
        confirmLabel="Delete"
      />
    </>
  );
}
