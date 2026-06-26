import { getCustomers } from './actions';
import { CustomersClient } from './customers-client';

export const metadata = { title: 'Customers — Admin' };

interface Props {
  searchParams: Promise<{ search?: string }>;
}

export default async function CustomersPage({ searchParams }: Props) {
  const { search } = await searchParams;
  const result = await getCustomers(search);
  
  const customers = (result.data || []).map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <CustomersClient customers={customers} />;
}
