import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/user-auth';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Payment Intake — StreamZone' };

interface Props {
  searchParams: Promise<{ plan?: string; country?: string }>;
}

export default async function PayPage({ searchParams }: Props) {
  // Requires user login
  const session = await requireUser();

  const { plan, country } = await searchParams;

  if (!plan || !country) {
    redirect('/pricing');
  }

  const selectedPlan = await db.plan.findUnique({
    where: { id: plan },
    include: {
      prices: {
        where: { country: { code: country } },
        include: { country: true },
      },
    },
  });

  if (!selectedPlan || selectedPlan.prices.length === 0) {
    redirect('/pricing?error=invalid_selection');
  }

  const price = selectedPlan.prices[0];
  const countryId = price.countryId;

  // 1. Fetch active operators for the country or global default operators (no assignments)
  const operators = await db.whatsAppOperator.findMany({
    where: { isActive: true },
    include: {
      assignments: true,
    },
  });

  // Filter operators: must either be assigned to this country, or be a global fallback (no assignments at all)
  const countryOperators = operators.filter((op) =>
    op.assignments.some((a) => a.countryId === countryId)
  );

  const activePool = countryOperators.length > 0 
    ? countryOperators 
    : operators.filter((op) => op.assignments.length === 0);

  let selectedOperator = null;
  let operatorLink = null;
  let txnRef = `TXN-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

  if (activePool.length > 0) {
    // 2. Perform Weighted Random Routing
    const poolWithWeights = activePool.map((op) => {
      const assignment = op.assignments.find((a) => a.countryId === countryId);
      const weight = assignment?.customWeight ?? op.defaultWeight;
      return { operator: op, weight: Math.max(1, weight) };
    });

    const totalWeight = poolWithWeights.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const item of poolWithWeights) {
      randomNum -= item.weight;
      if (randomNum <= 0) {
        selectedOperator = item.operator;
        break;
      }
    }

    if (!selectedOperator && poolWithWeights.length > 0) {
      selectedOperator = poolWithWeights[0].operator;
    }

    if (selectedOperator) {
      // 3. Resolve template text placeholders
      const defaultTemplateText = "Hi! I would like to pay for {plan_name} ({plan_price} {plan_currency}). Reference ID: {txn_ref}";
      const template = selectedOperator.templateText || defaultTemplateText;
      const prefilledText = template
        .replace(/{plan_name}/g, selectedPlan.name)
        .replace(/{plan_price}/g, Number(price.amount).toFixed(2))
        .replace(/{plan_currency}/g, price.currency)
        .replace(/{user_id}/g, session.userId)
        .replace(/{user_phone}/g, session.phone || '')
        .replace(/{user_email}/g, session.email || '')
        .replace(/{txn_ref}/g, txnRef);

      // Clean phone number: remove any non-digit characters except leading plus if needed, but wa.me prefers digits only
      const cleanPhone = selectedOperator.phoneNumber.replace(/[^\d]/g, '');
      operatorLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(prefilledText)}`;
    }
  }

  if (operatorLink) {
    // Create the pending payment record in database
    await db.payment.create({
      data: {
        userId: session.userId,
        amount: price.amount,
        currency: price.currency,
        method: 'WhatsApp',
        reference: txnRef,
        status: 'pending',
      },
    });

    // Redirect directly to the WhatsApp chat link
    redirect(operatorLink);
  }

  // Fallback if no WhatsApp operators are configured/active
  redirect('/pricing?error=no_operators_available');
}
