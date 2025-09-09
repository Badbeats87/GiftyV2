import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusinessProfileManagement.css'; // Assuming you'll create a CSS file for this

const BusinessProfileManagement = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    description: '',
    logo_url: '',
    images_urls: '', // This will be a string of comma-separated URLs for now
    operating_hours: '',
    terms_and_conditions: '',
    bank_account_details: '', // This will be a string for now
  });
  const [businessId, setBusinessId] = useState(null);
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [stripeAccountDetails, setStripeAccountDetails] = useState(null); // New state for Stripe details
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      const token = localStorage.getItem('businessToken');
      if (!token) {
        navigate('/business/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/businesses/me', { // Assuming a /me endpoint for authenticated business
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setBusinessId(data.id);
          setBusinessId(data.id);
          setStripeAccountId(data.stripe_account_id);
          setStripeAccountDetails(data.stripeAccountDetails); // Set new Stripe details
          console.log('Frontend: Fetched stripe_account_id:', data.stripe_account_id); // Debugging line
          console.log('Frontend: Fetched stripeAccountDetails:', data.stripeAccountDetails); // Debugging line
          setFormData({
            name: data.name || '',
            address: data.address || '',
            contact_phone: data.contact_phone || '',
            contact_email: data.contact_email || '',
            description: data.description || '',
            logo_url: data.logo_url || '',
            images_urls: data.images_urls ? data.images_urls.join(', ') : '', // Convert array to comma-separated string
            operating_hours: data.operating_hours ? (typeof data.operating_hours === 'object' ? JSON.stringify(data.operating_hours) : data.operating_hours) : '',
            terms_and_conditions: data.terms_and_conditions || '',
            bank_account_details: data.bank_account_details ? (typeof data.bank_account_details === 'object' ? JSON.stringify(data.bank_account_details) : data.bank_account_details) : '',
          });
        } else {
          setError(data.message || 'Failed to fetch business profile.');
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('businessToken');
            navigate('/business/login');
          }
        }
      } catch (err) {
        setError('An error occurred while fetching profile data.');
        console.error('Fetch profile error:', err);
      }
    };

    fetchBusinessProfile();
  }, [navigate, stripeAccountId]); // Add stripeAccountId to dependency array

  const handleConnectStripe = async () => {
    const token = localStorage.getItem('businessToken');
    if (!token) {
      navigate('/business/login');
      return;
    }

    setError('');
    setSuccess('');

    try {
      let currentStripeAccountId = stripeAccountId;

      // Step 1: Create Stripe Connect account if it doesn't exist
      if (!currentStripeAccountId) {
        const createAccountResponse = await fetch('http://localhost:5000/api/payments/connect-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            country: 'US', // Placeholder: In a real app, this would come from business registration data
            business_type: 'individual', // Placeholder: In a real app, this would come from business registration data
          }),
        });

        const createAccountData = await createAccountResponse.json();

        if (!createAccountResponse.ok) {
          setError(createAccountData.message || 'Failed to create Stripe Connect account.');
          return;
        }
        currentStripeAccountId = createAccountData.accountId;
        setStripeAccountId(currentStripeAccountId); // Update state with new account ID
        setSuccess('Stripe Connect account created. Redirecting to onboarding...');
      }

      // Step 2: Generate account link for onboarding
      const accountLinkResponse = await fetch('http://localhost:5000/api/payments/connect-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          // No additional body needed for link generation if account is already created
        }),
      });

      const accountLinkData = await accountLinkResponse.json();

      if (accountLinkResponse.ok && accountLinkData.url) {
        // Redirect to Stripe for onboarding
        window.location.href = accountLinkData.url;
        // After the redirect, the user will return to the app.
        // The useEffect will then re-fetch the business profile,
        // which should now include the stripe_account_id.
      } else {
        setError(accountLinkData.message || 'Failed to generate Stripe Connect account link.');
      }
    } catch (err) {
      setError('An error occurred while connecting to Stripe.');
      console.error('Stripe connect error:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    let parsedOperatingHours = null;
    let parsedBankAccountDetails = null;

    try {
      if (formData.operating_hours) {
        parsedOperatingHours = JSON.parse(formData.operating_hours);
      }
    } catch (jsonError) {
      setError('Invalid JSON format for Operating Hours. Please ensure it is valid JSON (e.g., {"Monday": "9am-5pm"}).');
      console.error('Operating Hours JSON parse error:', jsonError);
      return;
    }

    try {
      if (formData.bank_account_details) {
        parsedBankAccountDetails = JSON.parse(formData.bank_account_details);
      }
    } catch (jsonError) {
      setError('Invalid JSON format for Bank Account Details. Please ensure it is valid JSON (e.g., {"account_number": "12345", "routing_number": "67890"}).');
      console.error('Bank Account Details JSON parse error:', jsonError);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/businesses/${businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          images_urls: formData.images_urls.split(',').map(url => url.trim()).filter(url => url), // Convert back to array
          operating_hours: parsedOperatingHours,
          bank_account_details: parsedBankAccountDetails,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully!');
      } else {
        setError(data.message || 'Failed to update profile.');
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('businessToken');
          navigate('/business/login');
        }
      }
    } catch (err) {
      setError('An error occurred during profile update.');
      console.error('Profile update error:', err);
    }
  };

  return (
    <div className="business-profile-management-container">
      <h2>Manage Your Business Profile</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form onSubmit={handleSubmit} className="business-profile-management-form">
        <div className="form-group">
          <label htmlFor="name">Business Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            autoComplete="organization"
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
          <label htmlFor="contact_phone">Contact Phone:</label>
          <input
            type="text"
            id="contact_phone"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            autoComplete="tel"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contact_email">Contact Email:</label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="logo_url">Logo URL:</label>
          <input
            type="text"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            autoComplete="url"
          />
        </div>
        <div className="form-group">
          <label htmlFor="images_urls">Image URLs (comma-separated):</label>
          <input
            type="text"
            id="images_urls"
            name="images_urls"
            value={formData.images_urls}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label htmlFor="operating_hours">Operating Hours:</label>
          <input
            type="text"
            id="operating_hours"
            name="operating_hours"
            value={formData.operating_hours}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        <div className="form-group">
          <label htmlFor="terms_and_conditions">Terms and Conditions:</label>
          <textarea
            id="terms_and_conditions"
            name="terms_and_conditions"
            value={formData.terms_and_conditions}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="bank_account_details">Bank Account Details:</label>
          <input
            type="text"
            id="bank_account_details"
            name="bank_account_details"
            value={formData.bank_account_details}
            onChange={handleChange}
            autoComplete="off"
          />
        </div>
        <button type="submit" className="save-profile-button">Save Profile</button>
      </form>

      {stripeAccountId ? (
        <div className="stripe-connect-section">
          <h3>Stripe Account Connected</h3>
          {stripeAccountDetails && (
            <>
              <p>Account ID: <strong>{stripeAccountDetails.id}</strong></p>
              {stripeAccountDetails.business_name && <p>Business Name: <strong>{stripeAccountDetails.business_name}</strong></p>}
              {stripeAccountDetails.email && <p>Account Email: <strong>{stripeAccountDetails.email}</strong></p>}
              <p>Charges Enabled: {stripeAccountDetails.charges_enabled ? 'Yes' : 'No'}</p>
              <p>Payouts Enabled: {stripeAccountDetails.payouts_enabled ? 'Yes' : 'No'}</p>
              <p>Details Submitted: {stripeAccountDetails.details_submitted ? 'Yes' : 'No'}</p>
            </>
          )}
          <p>You are ready to accept payments for your gift cards.</p>
          {/* Optionally, add a button to view Stripe dashboard or disconnect */}
        </div>
      ) : (
        <div className="stripe-connect-section">
          <h3>Accept Payments</h3>
          <p>Connect your Stripe account to start accepting payments for your gift cards.</p>
          <button onClick={handleConnectStripe} className="connect-stripe-button">Connect to Stripe</button>
        </div>
      )}
    </div>
  );
};

export default BusinessProfileManagement;
