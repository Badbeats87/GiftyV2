import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminUserManagement.css'; // Assuming you'll create a CSS file for styling

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsersAndBusinesses = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        // Fetch regular users
        const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(usersResponse.data.users);

        // Fetch businesses
        const businessesResponse = await axios.get('http://localhost:5000/api/admin/businesses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setBusinesses(businessesResponse.data.businesses);

      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch user and business data.');
        console.error('Admin user management error:', err);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndBusinesses();
  }, [navigate]);

  const handleToggleUserStatus = async (userId, currentIsActive) => {
    const token = localStorage.getItem('adminToken');
    const newIsActive = !currentIsActive; // Toggle boolean
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/status`, { is_active: newIsActive }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_active: newIsActive } : user
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status.');
      console.error('Toggle user status error:', err);
    }
  };

  const handleToggleBusinessStatus = async (businessId, currentIsActive) => {
    const token = localStorage.getItem('adminToken');
    const newIsActive = !currentIsActive; // Toggle boolean
    try {
      await axios.put(`http://localhost:5000/api/admin/businesses/${businessId}/status`, { is_active: newIsActive }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBusinesses(businesses.map(business =>
        business.id === businessId ? { ...business, is_active: newIsActive } : business
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update business status.');
      console.error('Toggle business status error:', err);
    }
  };

  if (loading) {
    return <div className="admin-user-management-container">Loading user and business data...</div>;
  }

  if (error) {
    return <div className="admin-user-management-container error-message">{error}</div>;
  }

  return (
    <div className="admin-user-management-container">
      <h2>User and Business Management</h2>

      <div className="management-section">
        <h3>Customer Accounts</h3>
        {users.length === 0 ? (
          <p>No customer accounts found.</p>
        ) : (
          <div className="user-list">
            {users.map((user) => (
              <div key={user.id} className="user-card">
                <p>Email: {user.email}</p>
                <p>Status: {user.is_active ? 'Active' : 'Suspended'}</p>
                <button
                  onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                  className={user.is_active ? 'suspend-button' : 'activate-button'}
                >
                  {user.is_active ? 'Suspend' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="management-section">
        <h3>Business Accounts</h3>
        {businesses.length === 0 ? (
          <p>No business accounts found.</p>
        ) : (
          <div className="business-list">
            {businesses.map((business) => (
              <div key={business.id} className="business-card">
                <p>Name: {business.name}</p>
                <p>Email: {business.email}</p>
                <p>Approved: {business.is_approved ? 'Yes' : 'No'}</p>
                <p>Active: {business.is_active ? 'Yes' : 'No'}</p>
                <button
                  onClick={() => handleToggleBusinessStatus(business.id, business.is_active)}
                  className={business.is_active ? 'suspend-button' : 'activate-button'}
                >
                  {business.is_active ? 'Suspend' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserManagement;
