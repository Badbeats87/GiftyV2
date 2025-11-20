import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function BusinessDashboardPage({
  params,
}: {
  params: { businessId: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  // Fetch gift card summary data for the business
  const { data: giftCards, error: giftCardsError } = await supabase
    .from('gift_cards')
    .select('amount, remaining_balance, status')
    .eq('business_id', params.businessId);

  if (giftCardsError) {
    console.error('Error fetching gift cards:', giftCardsError);
    notFound();
  }

  const totalIssuedAmount = giftCards.reduce((sum, card) => sum + card.amount, 0);
  const totalRemainingBalance = giftCards.reduce((sum, card) => sum + card.remaining_balance, 0);
  const totalRedeemedAmount = totalIssuedAmount - totalRemainingBalance;
  const activeCardsCount = giftCards.filter(card => card.status === 'issued' || card.status === 'partially_redeemed').length;
  const redeemedCardsCount = giftCards.filter(card => card.status === 'redeemed').length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total Issued Value" value={`$${totalIssuedAmount.toFixed(2)}`} />
        <DashboardCard title="Total Redeemed Value" value={`$${totalRedeemedAmount.toFixed(2)}`} />
        <DashboardCard title="Active Gift Cards" value={activeCardsCount.toString()} />
        <DashboardCard title="Redeemed Gift Cards" value={redeemedCardsCount.toString()} />
      </div>

      {/* You can add more sections here, e.g., recent activity, charts, etc. */}
    </div>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">{value}</dd>
      </div>
    </div>
  );
}
