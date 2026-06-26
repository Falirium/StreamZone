import { getSupportCases } from './actions';
import { SupportClient } from './support-client';

export const metadata = { title: 'Support Cases — Admin' };

export default async function SupportPage() {
  const result = await getSupportCases();
  
  const cases = (result.data || []).map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return <SupportClient cases={cases} />;
}
