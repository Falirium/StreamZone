import { getCountries } from './actions';
import { CountriesClient } from './countries-client';

export const metadata = { title: 'Countries — Admin' };

export default async function CountriesPage() {
  const result = await getCountries();

  return <CountriesClient countries={result.data || []} />;
}
