import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusinessGiftCardCreate.css';

const BusinessGiftCardCreate = () => {
  const [formData, setFormData] = useState({
    value: '',
    isFixedValue: true,
    customValue: '',
    quantity: 1,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleValueChange = (e) => {
    setFormData({
      ...formData,
      value: e.target.value,
      customValue: '', // Clear custom value if a fixed value is selected
    });
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

    let giftCardValue = formData.isFixedValue ? formData.value : formData.customValue;

    if (!giftCardValue || isNaN(parseFloat(giftCardValue)) || parseFloat(giftCardValue) <= 0) {
      setError('Please enter a valid gift card value.');
      return;
    }

    if (formData.quantity <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/gift-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          value: parseFloat(giftCardValue),
          quantity: parseInt(formData.quantity, 10),
          // The businessId will be extracted from the JWT token on the backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully created ${formData.quantity} gift card(s) with value $${parseFloat(giftCardValue).toFixed(2)}!`);
        setFormData({
          value: '',
          isFixedValue: true,
          customValue: '',
          quantity: 1,
        });
        // Optionally redirect to a list of gift cards
        // setTimeout(() => {
        //   navigate('/business/giftcards');
        // }, 2000);
      } else {
        setError(data.message || 'Failed to create gift card.');
      }
    } catch (err) {
      setError('An error occurred during gift card creation.');
      console.error('Gift card creation error:', err);
    }
  };

  return (
    <div className="business-gift-card-create-container">
      <h2>Create New Gift Card</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit} className="gift-card-create-form">
        <div className="form-group">
          <label>Gift Card Value Type:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="isFixedValue"
                checked={formData.isFixedValue}
                onChange={() => setFormData({ ...formData, isFixedValue: true, customValue: '' })}
              />
              Fixed Value
            </label>
            <label>
              <input
                type="radio"
                name="isFixedValue"
                checked={!formData.isFixedValue}
                onChange={() => setFormData({ ...formData, isFixedValue: false, value: '' })}
              />
              Custom Value
            </label>
          </div>
        </div>

        {formData.isFixedValue ? (
          <div className="form-group">
            <label htmlFor="value">Select Value:</label>
            <select id="value" name="value" value={formData.value} onChange={handleValueChange} required>
              <option value="">Select an amount</option>
              <option value="25">€25</option>
              <option value="50">€50</option>
              <option value="100">€100</option>
              <option value="200">€200</option>
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="customValue">Custom Value (€):</label>
            <input
              type="number"
              id="customValue"
              name="customValue"
              value={formData.customValue}
              onChange={handleChange}
              min="1"
              step="0.01"
              required
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <button type="submit" className="create-gift-card-button">Create Gift Card(s)</button>
      </form>
    </div>
  );
};

export default BusinessGiftCardCreate;
