import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import './BusinessDashboard.css';

const BusinessDashboard = () => {
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessData = async () => {
      const token = localStorage.getItem('businessToken');
      if (!token) {
        navigate('/business/login');
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        const businessId = decodedToken.id;

        const response = await axios.get(`http://localhost:5000/api/businesses/${businessId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.data) {
          setBusinessData(response.data);
        } else {
          setError('Failed to fetch business data.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching business data.');
        console.error('Fetch business data error:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('businessToken');
          navigate('/business/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [navigate]);

  if (loading) {
    return <div className="business-dashboard-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="business-dashboard-container error-message">{error}</div>;
  }

  if (!businessData) {
    return <div className="business-dashboard-container">No business data found.</div>;
  }

  return (
    <div className="business-dashboard-container">
      <h2>{businessData.name}'s Dashboard</h2>
      <div className="dashboard-overview">
        <div className="metric-card">
          <h3>Total Sales</h3>
          <p>${businessData.total_sales || '0.00'}</p>
        </div>
        <div className="metric-card">
          <h3>Gift Cards Sold</h3>
          <p>{businessData.gift_cards_sold || 0}</p>
        </div>
        <div className="metric-card">
          <h3>Gift Cards Redeemed</h3>
          <p>{businessData.gift_cards_redeemed || 0}</p>
        </div>
      </div>

      <div className="business-status">
        <h3>Application Status: {businessData.is_approved ? 'Approved' : 'Pending Approval'}</h3>
        {!businessData.is_approved && (
          <p>Your business application is currently under review. We will notify you once it has been approved by an administrator.</p>
        )}
      </div>

      <div className="dashboard-actions">
        <button onClick={() => navigate(`/business/profile/${businessData.id}`)} className="action-button">Manage Profile</button>
        <button onClick={() => navigate('/business/giftcards/create')} className="action-button">Create Gift Card</button>
        <button onClick={() => navigate('/business/giftcards/redeem')} className="action-button">Redeem Gift Card</button>
        <button onClick={() => navigate('/business/transactions')} className="action-button">View Transactions</button>
        <button onClick={() => navigate('/business/invoices')} className="action-button">Download Invoices</button>
      </div>
    </div>
  );
};

export default BusinessDashboard;
