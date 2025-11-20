'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Business {
  id: string;
  name: string;
  slug: string;
  status: string;
  contact_email: string | null;
  iban: string | null;
  wix_product_id: string | null;
  created_at: string;
}

interface Application {
  id: string;
  business_name: string;
  contact_email: string;
  contact_name: string;
  phone: string;
  iban: string;
  status: string;
  created_at: string;
}

export default function BusinessManagement() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [allInvites, setAllInvites] = useState<any[]>([]); // Using any for now for simplicity
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'businesses' | 'applications' | 'invites' | 'sendInvite'>('businesses');
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([]);
  const businessSelectAllRef = useRef<HTMLInputElement | null>(null);
  const inviteSelectAllRef = useRef<HTMLInputElement | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedBusinessIds((prev) => {
      const filtered = prev.filter((id) => businesses.some((biz) => biz.id === id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [businesses]);

  useEffect(() => {
    setSelectedInviteIds((prev) => {
      const filtered = prev.filter((id) =>
        allInvites.some((invite) => invite.id === id && invite.status === 'pending')
      );
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [allInvites]);

  useEffect(() => {
    if (businessSelectAllRef.current) {
      businessSelectAllRef.current.indeterminate =
        selectedBusinessIds.length > 0 && selectedBusinessIds.length < businesses.length;
    }
  }, [businesses, selectedBusinessIds]);

  useEffect(() => {
    const pendingInvites = allInvites.filter((invite) => invite.status === 'pending');
    if (inviteSelectAllRef.current) {
      inviteSelectAllRef.current.indeterminate =
        selectedInviteIds.length > 0 && selectedInviteIds.length < pendingInvites.length;
    }
  }, [allInvites, selectedInviteIds]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch businesses
      const { data: bizData } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch pending applications
      const { data: appData } = await supabase
        .from('business_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      // Fetch all invites
      const { data: inviteData } = await supabase
        .from('business_invites')
        .select('*')
        .order('created_at', { ascending: false });

      setBusinesses(bizData || []);
      setApplications(appData || []);
      setAllInvites(inviteData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setInviteError('');
    setInviteSuccess('');

    try {
      console.log('Sending invite to:', inviteEmail);
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-business-invite`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: inviteEmail,
            invitedBy: 'Admin',
            message: inviteMessage || undefined
          })
        }
      );

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        let errorMessage = 'Failed to send invite';
        try {
          const error = JSON.parse(responseText);
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      setInviteSuccess(`Invitation sent! Registration URL: ${data.invite.registrationUrl}`);
      setInviteEmail('');
      setInviteMessage('');
    } catch (err: any) {
      console.error('Error sending invite:', err);
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleApplicationAction = async (appId: string, status: 'approved' | 'rejected', rejectionReason?: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/approve-business-application`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            applicationId: appId,
            status,
            rejectionReason
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${status} application`);
      }

      await fetchData(); // Refresh data after action
      alert(`Application ${status} successfully!`);
    } catch (err: any) {
      console.error(`Error ${status} application:`, err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const approveApplication = async (appId: string) => {
    if (confirm('Are you sure you want to approve this application?')) {
      await handleApplicationAction(appId, 'approved');
    }
  };

  const rejectApplication = async (appId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (confirm('Are you sure you want to reject this application?')) {
      await handleApplicationAction(appId, 'rejected', reason || undefined);
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (!confirm('⚠️ Are you sure you want to DELETE this business?\n\nThis will also delete:\n- All associated gift cards\n- All transaction history\n- This action CANNOT be undone!')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      await fetchData();
      alert('✅ Business deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting business:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteBusinesses = async () => {
    if (selectedBusinessIds.length === 0) {
      return;
    }

    if (
      !confirm(
        `⚠️ Delete ${selectedBusinessIds.length} selected business(es)?\n\nThis will also remove related gift cards and transaction history.`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('businesses').delete().in('id', selectedBusinessIds);
      if (error) throw error;

      setSelectedBusinessIds([]);
      await fetchData();
      alert('✅ Selected businesses deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting selected businesses:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('business_invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId);

      if (error) throw error;

      await fetchData();
      alert('✅ Invitation revoked successfully!');
    } catch (err: any) {
      console.error('Error revoking invitation:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const bulkRevokeInvites = async () => {
    if (selectedInviteIds.length === 0) {
      return;
    }

    if (!confirm(`Revoke ${selectedInviteIds.length} selected pending invitation(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('business_invites')
        .update({ status: 'revoked' })
        .in('id', selectedInviteIds);

      if (error) throw error;

      setSelectedInviteIds([]);
      await fetchData();
      alert('✅ Selected invitations revoked successfully!');
    } catch (err: any) {
      console.error('Error revoking selected invitations:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteApplication = async (appId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('business_applications')
        .delete()
        .eq('id', appId);

      if (error) throw error;

      await fetchData();
      alert('✅ Application deleted successfully!');
    } catch (err: any) {
      console.error('Error deleting application:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL pending applications and pending invites.\n\nAre you sure?')) {
      return;
    }

    if (prompt('Type DELETE to confirm:') !== 'DELETE') {
      alert('Cleanup cancelled.');
      return;
    }

    setLoading(true);
    try {
      // Delete pending applications
      const { error: appError } = await supabase
        .from('business_applications')
        .delete()
        .eq('status', 'pending');

      if (appError) throw appError;

      // Delete pending invites
      const { error: inviteError } = await supabase
        .from('business_invites')
        .delete()
        .eq('status', 'pending');

      if (inviteError) throw inviteError;

      await fetchData();
      alert('✅ Test data cleaned up successfully!');
    } catch (err: any) {
      console.error('Error cleaning up test data:', err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const allBusinessesSelected = businesses.length > 0 && selectedBusinessIds.length === businesses.length;
  const pendingInvites = allInvites.filter((invite) => invite.status === 'pending');
  const allPendingInvitesSelected =
    pendingInvites.length > 0 && selectedInviteIds.length === pendingInvites.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Business Management</h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('businesses')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'businesses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Businesses ({businesses.length})
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Pending Applications ({applications.length})
              </button>
              <button
                onClick={() => setActiveTab('invites')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'invites'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Invitations ({allInvites.length})
              </button>
              <button
                onClick={() => setActiveTab('sendInvite')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'sendInvite'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Send Invite
              </button>
            </nav>
          </div>

          {/* Businesses Tab */}
          {activeTab === 'businesses' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    {selectedBusinessIds.length === 0
                      ? 'No businesses selected'
                      : `${selectedBusinessIds.length} business(es) selected`}
                  </p>
                  <button
                    onClick={bulkDeleteBusinesses}
                    disabled={selectedBusinessIds.length === 0}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Delete Selected
                  </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3">
                        <input
                          ref={businessSelectAllRef}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          onChange={() => {
                            if (allBusinessesSelected) {
                              setSelectedBusinessIds([]);
                            } else {
                              setSelectedBusinessIds(businesses.map((biz) => biz.id));
                            }
                          }}
                          checked={allBusinessesSelected}
                          disabled={businesses.length === 0}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wix Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {businesses.map((business) => (
                      <tr key={business.id}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={selectedBusinessIds.includes(business.id)}
                            onChange={() =>
                              setSelectedBusinessIds((prev) =>
                                prev.includes(business.id)
                                  ? prev.filter((id) => id !== business.id)
                                  : [...prev, business.id]
                              )
                            }
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{business.name}</div>
                          <div className="text-sm text-gray-500">{business.slug}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {business.contact_email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            business.status === 'active' ? 'bg-green-100 text-green-800' :
                            business.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {business.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {business.wix_product_id ? '✓' : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(business.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => deleteBusiness(business.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-6">
              {applications.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={cleanupTestData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                  >
                    🗑️ Clean Up All Pending
                  </button>
                </div>
              )}
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No pending applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{app.business_name}</h3>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Contact:</span>
                              <span className="ml-2 font-medium">{app.contact_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <span className="ml-2 font-medium">{app.contact_email}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone:</span>
                              <span className="ml-2 font-medium">{app.phone || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">IBAN:</span>
                              <span className="ml-2 font-medium font-mono text-xs">{app.iban}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Applied: {new Date(app.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="ml-4 flex gap-2 flex-col">
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveApplication(app.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectApplication(app.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                              Reject
                            </button>
                          </div>
                          <button
                            onClick={() => deleteApplication(app.id)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Invitations Tab */}
          {activeTab === 'invites' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    {selectedInviteIds.length === 0
                      ? 'No pending invites selected'
                      : `${selectedInviteIds.length} invite(s) selected`}
                  </p>
                  <button
                    onClick={bulkRevokeInvites}
                    disabled={selectedInviteIds.length === 0}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Revoke Selected
                  </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3">
                        <input
                          ref={inviteSelectAllRef}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          onChange={() => {
                            if (allPendingInvitesSelected) {
                              setSelectedInviteIds([]);
                            } else {
                              setSelectedInviteIds(pendingInvites.map((invite) => invite.id));
                            }
                          }}
                          checked={allPendingInvitesSelected}
                          disabled={pendingInvites.length === 0}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invited At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allInvites.map((invite) => (
                      <tr key={invite.id}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={selectedInviteIds.includes(invite.id)}
                            disabled={invite.status !== 'pending'}
                            onChange={() => {
                              if (invite.status !== 'pending') return;
                              setSelectedInviteIds((prev) =>
                                prev.includes(invite.id)
                                  ? prev.filter((id) => id !== invite.id)
                                  : [...prev, invite.id]
                              );
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {invite.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {invite.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invite.invited_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(invite.expires_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {invite.status === 'pending' && (
                            <button
                              onClick={() => revokeInvite(invite.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Send Invite Tab */}
          {activeTab === 'sendInvite' && (
            <div className="p-6">
              <div className="max-w-xl">
                <h2 className="text-xl font-semibold mb-4">Send Business Invitation</h2>
                <form onSubmit={sendInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="business@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add a personal message to include in the invitation email..."
                    />
                  </div>

                  {inviteSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium">✓ Success!</p>
                      <p className="text-green-700 text-sm mt-1">{inviteSuccess}</p>
                    </div>
                  )}

                  {inviteError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800">{inviteError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
                  >
                    {sending ? 'Sending...' : 'Send Invitation'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
