'use client';

import { useState } from 'react';
import { supabase, type GiftCard } from '@/lib/supabase';

export default function Dashboard() {
  const [searchCode, setSearchCode] = useState('');
  const [giftCard, setGiftCard] = useState<GiftCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchGiftCard = async () => {
    if (!searchCode.trim()) return;

    setLoading(true);
    setError('');
    setGiftCard(null);

    try {
      const { data, error: searchError } = await supabase
        .from('gift_cards')
        .select(`
          *,
          business:businesses(name),
          customer:customers(email, name)
        `)
        .eq('code', searchCode.trim().toUpperCase())
        .single();

      if (searchError) throw searchError;
      setGiftCard(data);
    } catch (err: any) {
      setError(err.message || 'Gift card not found');
    } finally {
      setLoading(false);
    }
  };

  const redeemGiftCard = async () => {
    if (!giftCard) return;

    setLoading(true);
    try {
      const { error: redeemError } = await supabase
        .from('gift_cards')
        .update({
          status: 'redeemed',
          redeemed_at: new Date().toISOString(),
          redeemed_by: 'admin',
          remaining_balance: 0
        })
        .eq('id', giftCard.id);

      if (redeemError) throw redeemError;

      // Refresh the gift card data
      await searchGiftCard();
      alert('Gift card redeemed successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Gift Card Admin Dashboard</h1>
          <a
            href="/businesses"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Manage Businesses
          </a>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Lookup Gift Card</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchGiftCard()}
              placeholder="Enter gift card code (e.g., GIFT-XXXX-YYYY)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchGiftCard}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-red-600">{error}</p>
          )}
        </div>

        {/* Gift Card Details */}
        {giftCard && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Gift Card Details</h2>
                <p className="text-gray-600 mt-1">Code: <span className="font-mono font-bold">{giftCard.code}</span></p>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                giftCard.status === 'issued' ? 'bg-green-100 text-green-800' :
                giftCard.status === 'redeemed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {giftCard.status.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Business</p>
                <p className="font-semibold">{(giftCard.business as any)?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-semibold text-2xl">${giftCard.amount} {giftCard.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Balance</p>
                <p className="font-semibold">${giftCard.remaining_balance} {giftCard.currency}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold">{(giftCard.customer as any)?.name || (giftCard.customer as any)?.email}</p>
                <p className="text-sm text-gray-500">{(giftCard.customer as any)?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expires</p>
                <p className="font-semibold">{new Date(giftCard.expires_at).toLocaleDateString()}</p>
              </div>
              {giftCard.redeemed_at && (
                <div>
                  <p className="text-sm text-gray-600">Redeemed</p>
                  <p className="font-semibold">{new Date(giftCard.redeemed_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {giftCard.status === 'issued' && giftCard.remaining_balance > 0 && (
              <button
                onClick={redeemGiftCard}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
              >
                {loading ? 'Redeeming...' : 'Redeem Gift Card'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
