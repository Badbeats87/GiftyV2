import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './BusinessRegister.css';

const BusinessRegister = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    contactNumber: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    description: '',
    operatingHours: '',
    termsAndConditions: '',
    logoUrl: '',
    imageUrl: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/business-auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.businessName,
          email: formData.email,
          password: formData.password,
          address: formData.address,
          contact_phone: formData.contactNumber, // Changed to contact_phone to match backend
          // The following fields are for profile management, not initial registration
          // bank_account_number: formData.bankAccountNumber,
          // bank_routing_number: formData.bankRoutingNumber,
          description: formData.description,
          // operating_hours: formData.operatingHours,
          // terms_and_conditions: formData.termsAndConditions,
          // logo_url: formData.logoUrl,
          // image_url: formData.imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Business registered successfully! Awaiting admin approval.');
        // Optionally redirect to a pending approval page or login
        setTimeout(() => {
          navigate('/business/login');
        }, 3000);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('An error occurred during registration.');
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="business-register-container">
      <h2>Business Registration</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit} className="business-register-form">
        <div className="form-group">
          <label htmlFor="businessName">Business Name:</label>
          <input
            type="text"
            id="businessName"
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            required
            autoComplete="organization"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="address">Address:</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            autoComplete="street-address"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contactNumber">Contact Number:</label>
          <input
            type="text"
            id="contactNumber"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            required
            autoComplete="tel"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <button type="submit" className="register-button">Register</button>
      </form>
      <p className="login-link">
        Already have an account? <Link to="/business/login">Login here</Link>
      </p>
    </div>
  );
};

export default BusinessRegister;
