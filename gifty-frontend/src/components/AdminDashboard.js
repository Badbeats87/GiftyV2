import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css'; // Assuming you'll create a CSS file for styling

const AdminDashboard = () => {
  const [adminInfo, setAdminInfo] = useState(null);
  const [platformStripeAccountDetails, setPlatformStripeAccountDetails] = useState(null); // New state for platform Stripe details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminInfo = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        // This endpoint would need to be created on the backend to verify the token and return admin info
        const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAdminInfo(response.data.admin);
        setPlatformStripeAccountDetails(response.data.platformStripeAccountDetails); // Set platform Stripe details
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch admin data.');
        console.error('Admin dashboard error:', err);
        localStorage.removeItem('adminToken'); // Clear invalid token
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="admin-dashboard-container">Loading admin dashboard...</div>;
  }

  if (error) {
    return <div className="admin-dashboard-container error-message">{error}</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <h2>Welcome, Admin {adminInfo?.email}</h2>
      <p>This is your central hub for managing the Gifty platform.</p>

      {platformStripeAccountDetails && (
        <div className="dashboard-card stripe-account-details">
          <h3>Platform Stripe Account</h3>
          <p>Account ID: <strong>{platformStripeAccountDetails.id}</strong></p>
          {platformStripeAccountDetails.business_name && <p>Business Name: <strong>{platformStripeAccountDetails.business_name}</strong></p>}
          {platformStripeAccountDetails.email && <p>Account Email: <strong>{platformStripeAccountDetails.email}</strong></p>}
          <p>Charges Enabled: {platformStripeAccountDetails.charges_enabled ? 'Yes' : 'No'}</p>
          <p>Payouts Enabled: {platformStripeAccountDetails.payouts_enabled ? 'Yes' : 'No'}</p>
          <p>Details Submitted: {platformStripeAccountDetails.details_submitted ? 'Yes' : 'No'}</p>
        </div>
      )}

      <div className="dashboard-sections">
        <div className="dashboard-card">
          <h3>Business Applications</h3>
          <p>Review and manage pending business registrations.</p>
          <button onClick={() => navigate('/admin/business-applications')}>View Applications</button>
        </div>

        <div className="dashboard-card">
          <h3>User Management</h3>
          <p>Manage customer and business accounts.</p>
          <button onClick={() => navigate('/admin/users')}>Manage Users</button>
        </div>

        <div className="dashboard-card">
          <h3>Transaction Logs</h3>
          <p>Monitor all gift card transactions and payouts.</p>
          <button onClick={() => navigate('/admin/transactions')}>View Transactions</button>
        </div>

        <div className="dashboard-card">
          <h3>Fee Management</h3>
          <p>Configure platform fees and payout settings.</p>
          <button onClick={() => navigate('/admin/fees')}>Manage Fees</button>
        </div>

        <div className="dashboard-card">
          <h3>System Health</h3>
          <p>Monitor the overall health and performance of the platform.</p>
          <button onClick={() => navigate('/admin/health')}>View System Health</button>
        </div>
      </div>

      <button onClick={handleLogout} className="logout-button">Logout</button>
    </div>
  );
};

export default AdminDashboard;
