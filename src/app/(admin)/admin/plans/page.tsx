import { getPlans } from './actions';
import { PlansClient } from './plans-client';

export const metadata = { title: 'Plans — Admin' };

export default async function PlansPage() {
  const result = await getPlans();

  return <PlansClient plans={result.data || []} />;
}
