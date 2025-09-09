import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminSystemHealth.css'; // Assuming you'll create a CSS file for styling

const AdminSystemHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSystemHealth = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/admin/health', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setHealthData(response.data.health);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch system health data.');
        console.error('Admin system health error:', err);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchSystemHealth();
  }, [navigate]);

  if (loading) {
    return <div className="admin-system-health-container">Loading system health data...</div>;
  }

  if (error) {
    return <div className="admin-system-health-container error-message">{error}</div>;
  }

  return (
    <div className="admin-system-health-container">
      <h2>System Health Indicators</h2>
      <div className="health-metrics">
        <div className="metric-card">
          <h3>Database Status</h3>
          <p className={`status-${healthData.database.status}`}>
            {healthData.database.status === 'up' ? 'Operational' : 'Down'}
          </p>
          {healthData.database.message && <p className="detail">{healthData.database.message}</p>}
        </div>
        <div className="metric-card">
          <h3>API Uptime</h3>
          <p className={`status-${healthData.api.status}`}>
            {healthData.api.status === 'up' ? 'Operational' : 'Degraded'}
          </p>
          {healthData.api.message && <p className="detail">{healthData.api.message}</p>}
        </div>
        <div className="metric-card">
          <h3>External Services</h3>
          <p className={`status-${healthData.externalServices.status}`}>
            {healthData.externalServices.status === 'up' ? 'Operational' : 'Issues'}
          </p>
          {healthData.externalServices.message && <p className="detail">{healthData.externalServices.message}</p>}
        </div>
        {/* Add more metrics as needed */}
      </div>
    </div>
  );
};

export default AdminSystemHealth;
