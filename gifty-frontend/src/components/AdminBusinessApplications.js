import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminBusinessApplications.css'; // Assuming you'll create a CSS file for styling

const AdminBusinessApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/admin/business-applications', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setApplications(response.data.applications);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch business applications.');
        console.error('Admin business applications error:', err);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [navigate]);

  const handleApprove = async (businessId) => {
    const token = localStorage.getItem('adminToken');
    try {
      await axios.put(`http://localhost:5000/api/admin/business-applications/${businessId}/approve`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApplications(applications.filter(app => app.id !== businessId));
      // Optionally, add a success message
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve application.');
      console.error('Approve application error:', err);
    }
  };

  const handleReject = async (businessId) => {
    const token = localStorage.getItem('adminToken');
    try {
      await axios.put(`http://localhost:5000/api/admin/business-applications/${businessId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setApplications(applications.filter(app => app.id !== businessId));
      // Optionally, add a success message
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject application.');
      console.error('Reject application error:', err);
    }
  };

  if (loading) {
    return <div className="admin-business-applications-container">Loading business applications...</div>;
  }

  if (error) {
    return <div className="admin-business-applications-container error-message">{error}</div>;
  }

  return (
    <div className="admin-business-applications-container">
      <h2>Business Applications</h2>
      {applications.length === 0 ? (
        <p>No pending business applications.</p>
      ) : (
        <div className="applications-list">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <h3>{app.name}</h3>
              <p>Email: {app.email}</p>
              <p>Address: {app.address}</p>
              <p>Contact: {app.contact_phone}</p>
              <p>Status: {app.status}</p>
              <div className="application-actions">
                <button onClick={() => handleApprove(app.id)} className="approve-button">Approve</button>
                <button onClick={() => handleReject(app.id)} className="reject-button">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBusinessApplications;
