import { getPayments } from './actions';
import { PaymentsClient } from './payments-client';

export const metadata = { title: 'Payments — Admin' };

export default async function PaymentsPage() {
  const result = await getPayments();
  const payments = (result.data || []).map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return <PaymentsClient payments={payments} />;
}
