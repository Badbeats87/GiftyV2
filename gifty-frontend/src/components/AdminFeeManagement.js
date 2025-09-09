import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminFeeManagement.css'; // Assuming you'll create a CSS file for styling

const AdminFeeManagement = () => {
  const [platformFee, setPlatformFee] = useState('');
  const [customerFee, setCustomerFee] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFees = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/admin/fees', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setPlatformFee(response.data.platformFee.percentage);
        setCustomerFee(response.data.customerFee.percentage);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch fee settings.');
        console.error('Admin fee management error:', err);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    try {
      await axios.put('http://localhost:5000/api/admin/fees', {
        platformFeePercentage: parseFloat(platformFee),
        customerFeePercentage: parseFloat(customerFee),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMessage('Fee settings updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update fee settings.');
      console.error('Update fee settings error:', err);
    }
  };

  if (loading) {
    return <div className="admin-fee-management-container">Loading fee settings...</div>;
  }

  return (
    <div className="admin-fee-management-container">
      <h2>Fee Management</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="fee-management-form">
        <div className="form-group">
          <label htmlFor="platformFee">Platform Fee Percentage (%):</label>
          <input
            type="number"
            id="platformFee"
            value={platformFee}
            onChange={(e) => setPlatformFee(e.target.value)}
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="customerFee">Customer Fee Percentage (%):</label>
          <input
            type="number"
            id="customerFee"
            value={customerFee}
            onChange={(e) => setCustomerFee(e.target.value)}
            min="0"
            max="100"
            step="0.01"
            required
          />
        </div>
        <button type="submit" className="update-button">Update Fees</button>
      </form>
    </div>
  );
};

export default AdminFeeManagement;
