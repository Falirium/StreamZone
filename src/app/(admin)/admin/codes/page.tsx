import { getCodes, getPlansAndEvents } from './actions';
import { CodesClient } from './codes-client';

export const metadata = { title: 'Access Codes — Admin' };

export default async function CodesPage() {
  const [codesResult, refResult] = await Promise.all([getCodes(), getPlansAndEvents()]);

  const codes = (codesResult.data || []).map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <CodesClient
      codes={codes}
      plans={refResult.data?.plans || []}
      events={refResult.data?.events || []}
    />
  );
}
