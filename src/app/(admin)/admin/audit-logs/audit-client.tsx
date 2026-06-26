'use client';

import { useState } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { SearchBar } from '@/components/ui/search-bar';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
  admin: { name: string; email: string } | null;
}

interface AuditClientProps {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

export function AuditClient({ logs, total, page, pageSize }: AuditClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<string>('');

  const openDetails = (details: unknown) => {
    setSelectedDetails(JSON.stringify(details, null, 2));
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'admin', label: 'Admin',
      render: (row: AuditLog) => (
        <div>
          <p className="font-medium">{row.admin?.name || 'System'}</p>
          <p className="text-xs text-white/40">{row.admin?.email}</p>
        </div>
      ),
    },
    {
      key: 'action', label: 'Action',
      render: (row: AuditLog) => (
        <span className="px-2 py-1 bg-white/5 rounded text-xs font-mono">{row.action}</span>
      ),
    },
    {
      key: 'entity', label: 'Entity',
      render: (row: AuditLog) => (
        <span className="text-sm text-white/60">{row.entity} <span className="text-white/30 text-xs">#{row.entityId}</span></span>
      ),
    },
    {
      key: 'createdAt', label: 'Date', className: 'w-40',
      render: (row: AuditLog) => <span className="text-xs">{new Date(row.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'details', label: '', className: 'w-24',
      render: (row: AuditLog) => row.details ? (
        <Button variant="ghost" size="sm" onClick={() => openDetails(row.details)}>Details</Button>
      ) : null,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <div className="w-64">
          <SearchBar placeholder="Search logs..." />
        </div>
      </div>

      <div className="space-y-4">
        <DataTable columns={columns} data={logs} keyField="id" emptyMessage="No audit logs found" />
        <Pagination total={total} page={page} pageSize={pageSize} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Audit Details" maxWidth="md">
        <pre className="bg-surface-900 rounded-lg p-4 overflow-auto text-xs text-white/80 font-mono border border-white/5 max-h-[60vh]">
          {selectedDetails}
        </pre>
      </Modal>
    </>
  );
}
