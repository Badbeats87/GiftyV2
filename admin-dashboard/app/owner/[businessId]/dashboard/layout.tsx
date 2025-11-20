import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function BusinessOwnerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { businessId: string };
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login if no session
    // This should ideally be handled by a middleware or a dedicated login page
    // For now, we'll just show notFound
    notFound();
  }

  // Fetch business details to ensure the user has access and to display info
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, owner_user_id')
    .eq('id', params.businessId)
    .single();

  if (error || !business) {
    console.error('Error fetching business:', error);
    notFound();
  }

  // Basic authorization: check if the logged-in user is the owner of this business
  if (business.owner_user_id !== session.user.id) {
    console.warn(`User ${session.user.id} attempted to access business ${business.id} (owner: ${business.owner_user_id}) without authorization.`);
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            {business.name} Dashboard
          </h1>
          <nav>
            <Link href={`/owner/${business.id}/dashboard`} className="text-blue-600 hover:text-blue-800 mr-4">
              Overview
            </Link>
            <Link href={`/owner/${business.id}/gift-cards`} className="text-blue-600 hover:text-blue-800 mr-4">
              Gift Cards
            </Link>
            <Link href={`/owner/${business.id}/transactions`} className="text-blue-600 hover:text-blue-800">
              Transactions
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
