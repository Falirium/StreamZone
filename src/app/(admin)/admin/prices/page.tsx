import { getPrices, getPlansAndCountries } from './actions';
import { PricesClient } from './prices-client';

export const metadata = { title: 'Prices — Admin' };

export default async function PricesPage() {
  const [pricesResult, refDataResult] = await Promise.all([
    getPrices(),
    getPlansAndCountries(),
  ]);

  return (
    <PricesClient
      prices={pricesResult.data || []}
      plans={refDataResult.data?.plans || []}
      countries={refDataResult.data?.countries || []}
    />
  );
}
