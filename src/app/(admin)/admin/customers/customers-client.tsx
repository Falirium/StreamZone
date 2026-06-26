'use client';

import { DataTable } from '@/components/ui/data-table';
import { SearchBar } from '@/components/ui/search-bar';
import { StatusBadge } from '@/components/ui/status-badge';

interface Customer {
  id: string;
  email: string;
  phone: string | null;
  createdAt: string;
  profile: {
    displayName: string | null;
    email: string | null;
    country: { name: string; code: string } | null;
  } | null;
  _count: { entitlements: number; payments: number };
}

export function CustomersClient({ customers }: { customers: Customer[] }) {
  const columns = [
    {
      key: 'email',
      label: 'Email Address',
      render: (row: Customer) => <span className="text-sm font-medium text-white select-all">{row.email}</span>,
    },
    {
      key: 'phone',
      label: 'Phone Number',
      render: (row: Customer) => row.phone ? <span className="font-mono text-sm select-all">{row.phone}</span> : <span className="text-white/40">—</span>,
    },
    {
      key: 'name',
      label: 'Display Name',
      render: (row: Customer) => row.profile?.displayName || <span className="text-white/40">—</span>,
    },
    {
      key: 'country',
      label: 'Country',
      render: (row: Customer) => row.profile?.country ? `${row.profile.country.name} (${row.profile.country.code})` : <span className="text-white/40">—</span>,
    },
    {
      key: 'activity',
      label: 'Activity',
      className: 'w-48',
      render: (row: Customer) => (
        <span className="text-xs text-white/50">
          {row._count.payments} payments · {row._count.entitlements} active access
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      className: 'w-24',
      render: (row: Customer) => (
        row._count.entitlements > 0 ? (
          <StatusBadge variant="success">Active Plan</StatusBadge>
        ) : (
          <StatusBadge variant="neutral">No Plan</StatusBadge>
        )
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      className: 'w-32',
      render: (row: Customer) => <span className="text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="w-64">
          <SearchBar placeholder="Search by email or phone..." paramName="search" />
        </div>
      </div>

      <DataTable columns={columns} data={customers} keyField="id" emptyMessage="No customers found" />
    </>
  );
}
