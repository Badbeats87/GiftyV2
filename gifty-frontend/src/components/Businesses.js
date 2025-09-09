import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Businesses.css'; // We'll create this CSS file next

function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/businesses');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBusinesses(data);
      } catch (err) {
        setError('Failed to fetch businesses.');
        console.error('Error fetching businesses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  if (loading) {
    return <div className="businesses-container">Loading businesses...</div>;
  }

  if (error) {
    return <div className="businesses-container error">{error}</div>;
  }

  return (
    <div className="businesses-container">
      <h2>Our Partner Businesses</h2>
      <div className="business-list">
        {businesses.map(business => (
          <div key={business.id} className="business-card">
            <img src={business.logo_url || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Logo'} alt={business.name} className="business-image" />
            <h3>{business.name}</h3>
            <p>{business.business_type || 'Type N/A'} - {business.address || 'Location N/A'}</p>
            <Link to={`/businesses/${business.id}`} className="view-details-button">View Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Businesses;
