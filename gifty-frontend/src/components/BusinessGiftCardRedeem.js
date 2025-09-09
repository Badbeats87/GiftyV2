import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusinessGiftCardRedeem.css';

const BusinessGiftCardRedeem = () => {
  const [giftCardCode, setGiftCardCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setGiftCardCode(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('businessToken');
    if (!token) {
      navigate('/business/login');
      return;
    }

    if (!giftCardCode) {
      setError('Please enter a gift card code.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/gift-cards/${giftCardCode}/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Gift card "${giftCardCode}" redeemed successfully!`);
        setGiftCardCode('');
      } else {
        setError(data.message || 'Failed to redeem gift card.');
      }
    } catch (err) {
      setError('An error occurred during gift card redemption.');
      console.error('Gift card redemption error:', err);
    }
  };

  return (
    <div className="business-gift-card-redeem-container">
      <h2>Redeem Gift Card</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit} className="gift-card-redeem-form">
        <div className="form-group">
          <label htmlFor="giftCardCode">Gift Card Code:</label>
          <input
            type="text"
            id="giftCardCode"
            name="giftCardCode"
            value={giftCardCode}
            onChange={handleChange}
            required
            placeholder="Enter unique gift card code"
          />
        </div>
        <button type="submit" className="redeem-button">Redeem Gift Card</button>
      </form>
      <p className="qr-scan-info">
        (Future: Implement QR code scanning functionality here)
      </p>
    </div>
  );
};

export default BusinessGiftCardRedeem;
