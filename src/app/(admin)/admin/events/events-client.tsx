'use client';

import { useState, useTransition } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { createEvent, updateEvent, toggleEventActive, toggleEventFeatured } from './actions';

interface Event {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  category: string;
  startsAt: string;
  endsAt: string | null;
  posterUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  _count: { playbackSources: number; accessCodes: number; entitlements: number };
}

export function EventsClient({ events }: { events: Event[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCreate = () => { setEditing(null); setError(null); setModalOpen(true); };
  const openEdit = (event: Event) => { setEditing(event); setError(null); setModalOpen(true); };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = editing ? await updateEvent(formData) : await createEvent(formData);
      if (!result.success) setError(result.error || 'Something went wrong');
      else { setModalOpen(false); setError(null); }
    });
  };

  const handleToggleActive = (id: string, current: boolean) => {
    startTransition(() => { toggleEventActive(id, !current); });
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    startTransition(() => { toggleEventFeatured(id, !current); });
  };

  const columns = [
    {
      key: 'title', label: 'Event',
      render: (row: Event) => (
        <div>
          <p className="font-medium">{row.title}</p>
          <p className="text-xs text-white/40">/{row.slug}</p>
        </div>
      ),
    },
    { key: 'category', label: 'Category', className: 'w-28' },
    {
      key: 'startsAt', label: 'Date', className: 'w-40',
      render: (row: Event) => (
        <span className="text-xs">{new Date(row.startsAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'isActive', label: 'Status', className: 'w-24',
      render: (row: Event) => (
        <button onClick={() => handleToggleActive(row.id, row.isActive)}>
          <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>
            {row.isActive ? 'Active' : 'Inactive'}
          </StatusBadge>
        </button>
      ),
    },
    {
      key: 'isFeatured', label: 'Featured', className: 'w-24',
      render: (row: Event) => (
        <button onClick={() => handleToggleFeatured(row.id, row.isFeatured)}>
          <StatusBadge variant={row.isFeatured ? 'info' : 'neutral'}>
            {row.isFeatured ? '⭐ Yes' : 'No'}
          </StatusBadge>
        </button>
      ),
    },
    {
      key: 'sources', label: 'Sources', className: 'w-20',
      render: (row: Event) => (
        <span className="text-xs text-white/40">{row._count.playbackSources}</span>
      ),
    },
    {
      key: 'actions', label: '', className: 'w-16',
      render: (row: Event) => (
        <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>Edit</Button>
      ),
    },
  ];

  // Auto-generate slug from title
  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button size="sm" onClick={openCreate}>+ Add Event</Button>
      </div>

      <DataTable columns={columns} data={events} keyField="id" emptyMessage="No events yet" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Event' : 'Add Event'} maxWidth="lg">
        <form action={handleSubmit} className="space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}

          <Input name="title" label="Title" defaultValue={editing?.title || ''} required placeholder="e.g. Manchester United vs Liverpool"
            onChange={(e) => {
              if (!editing) {
                const slugInput = e.target.form?.querySelector('input[name="slug"]') as HTMLInputElement;
                if (slugInput) slugInput.value = autoSlug(e.target.value);
              }
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input name="slug" label="Slug" defaultValue={editing?.slug || ''} required placeholder="man-utd-vs-liverpool" />
            <Input name="category" label="Category" defaultValue={editing?.category || ''} required placeholder="e.g. football" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-white/60">Description</label>
            <textarea name="description" defaultValue={editing?.description || ''} placeholder="Optional event description" rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input name="startsAt" label="Starts At" type="datetime-local" defaultValue={editing ? new Date(editing.startsAt).toISOString().slice(0, 16) : ''} required />
            <Input name="endsAt" label="Ends At" type="datetime-local" defaultValue={editing?.endsAt ? new Date(editing.endsAt).toISOString().slice(0, 16) : ''} />
          </div>

          <Input name="posterUrl" label="Poster URL (optional)" defaultValue={editing?.posterUrl || ''} placeholder="https://example.com/poster.jpg" />

          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isActive" defaultChecked={editing?.isActive ?? true} className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-600 focus:ring-brand-500/50" />
              <span className="text-sm text-white/60">Active</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="isFeatured" defaultChecked={editing?.isFeatured ?? false} className="w-4 h-4 rounded border-white/20 bg-white/5 text-brand-600 focus:ring-brand-500/50" />
              <span className="text-sm text-white/60">Featured</span>
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" type="submit" loading={isPending}>{editing ? 'Save Changes' : 'Create Event'}</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
