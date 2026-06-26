import { getOperators, getCountriesForSelection } from './actions';
import { OperatorsClient } from './operators-client';

export const metadata = { title: 'WhatsApp Operators — Admin' };

export default async function OperatorsPage() {
  const [opsResult, countriesResult] = await Promise.all([
    getOperators(),
    getCountriesForSelection(),
  ]);

  const rawOperators = opsResult.data || [];
  const operators = rawOperators.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    assignments: o.assignments.map((a) => ({
      ...a,
      country: {
        id: a.country.id,
        name: a.country.name,
        code: a.country.code,
      },
    })),
  }));

  const countries = countriesResult.data || [];

  return <OperatorsClient initialOperators={operators} countries={countries} />;
}
