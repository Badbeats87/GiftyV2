import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link
import './BusinessProfile.css'; // We'll create this CSS file next

function BusinessProfile() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/businesses/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data) {
          setBusiness(data);
        } else {
          setError('Business not found.');
        }
      } catch (err) {
        setError('Failed to fetch business details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [id]);

  if (loading) {
    return <div className="business-profile-container">Loading business details...</div>;
  }

  if (error) {
    return <div className="business-profile-container error">{error}</div>;
  }

  if (!business) {
    return <div className="business-profile-container">No business data available.</div>;
  }

  return (
    <div className="business-profile-container">
      <img src={business.logo_url || 'https://via.placeholder.com/400x200/CCCCCC/FFFFFF?text=No+Image'} alt={business.name} className="business-profile-image" />
      <h1>{business.name}</h1>
      <p className="business-type-location">{business.business_type || 'Type N/A'} - {business.address || 'Location N/A'}</p>
      <p className="business-description">{business.description}</p>

      {(() => {
        const giftCardsToDisplay = business.giftCards && business.giftCards.length > 0
          ? business.giftCards
          : [{ value: 10 }, { value: 25 }, { value: 50 }, { value: 100 }]; // Default values

        return (
          <div className="gift-card-options">
            <h2>Gift Card Options</h2>
            <div className="gift-card-list">
              {giftCardsToDisplay.map((card, index) => (
                <div key={index} className="gift-card-item">
                  ${card.value}
                  <Link to={`/purchase/${business.id}/${card.value}`} className="button">Purchase</Link>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      <div className="business-terms">
        <h2>Terms & Conditions</h2>
        <p>{business.terms_and_conditions}</p>
      </div>
    </div>
  );
}

export default BusinessProfile;
