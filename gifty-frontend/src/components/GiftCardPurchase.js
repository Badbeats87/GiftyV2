import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GiftCardPurchase.css'; // We'll create this CSS file next
import axios from 'axios';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'; // Import Stripe hooks

function GiftCardPurchase() {
  const { businessId, value } = useParams();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();

  const [business, setBusiness] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(value ? parseInt(value) : '');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false); // New state for payment processing
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('GiftCardPurchase - Stripe object in useEffect:', stripe);
    console.log('GiftCardPurchase - Elements object in useEffect:', elements);

    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/businesses/${businessId}`);
        if (response.data) {
          const foundBusiness = response.data;
          setBusiness(foundBusiness);
          if (!selectedAmount && foundBusiness.giftCards && foundBusiness.giftCards.length > 0) {
            setSelectedAmount(foundBusiness.giftCards[0].value);
          } else if (!selectedAmount) {
            setSelectedAmount(50); // Default to $50
          }
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
  }, [businessId, selectedAmount, value, stripe, elements]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('GiftCardPurchase - Stripe object in handleSubmit:', stripe);
    console.log('GiftCardPurchase - Elements object in handleSubmit:', elements);

    if (!stripe || !elements || !selectedAmount || !recipientEmail || !businessId) {
      console.error('Payment system not ready or missing required fields. Stripe:', stripe, 'Elements:', elements);
      alert('Payment system not ready or missing required fields.');
      return;
    }

    setError(null);
    setProcessingPayment(true);

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
        billing_details: {
          email: recipientEmail, // Use recipient email for billing details
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessingPayment(false);
        return;
      }

      const paymentMethodId = paymentMethod.id;

      const response = await axios.post('http://localhost:5000/api/payments/purchase-gift-card', {
        value: selectedAmount,
        currency: 'USD',
        businessId: parseInt(businessId),
        paymentMethodId,
        recipientEmail,
        personalMessage,
      });

      if (response.data && response.data.giftCardUniqueCode) {
        alert(`Gift card purchased successfully! Code: ${response.data.giftCardUniqueCode}`);
        navigate('/purchase-success', { state: { uniqueCode: response.data.giftCardUniqueCode, recipientEmail } });
      } else {
        throw new Error('Gift card purchase failed: No unique code received.');
      }
    } catch (err) {
      console.error('Gift card purchase error:', err.response ? err.response.data : err.message);
      setError(err.response ? err.response.data.message : 'Failed to process gift card purchase.');
      alert(`Purchase failed: ${err.response ? err.response.data.message : err.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return <div className="gift-card-purchase-container">Loading purchase options...</div>;
  }

  if (error) {
    return <div className="gift-card-purchase-container error">{error}</div>;
  }

  if (!business) {
    return <div className="gift-card-purchase-container">No business data available for purchase.</div>;
  }

  return (
    <div className="gift-card-purchase-container">
      <h1>Purchase Gift Card for {business.name}</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Select Amount:</label>
          <select
            id="amount"
            value={selectedAmount}
            onChange={(e) => setSelectedAmount(parseInt(e.target.value))}
            required
          >
            <option value="">Select an amount</option>
            {(business.giftCards && business.giftCards.length > 0
              ? business.giftCards
              : [{ value: 10 }, { value: 25 }, { value: 50 }, { value: 100 }] // Default values
            ).map((card, index) => (
              <option key={index} value={card.value}>${card.value}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="recipientEmail">Recipient Email:</label>
          <input
            type="email"
            id="recipientEmail"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="recipient@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="personalMessage">Personal Message (Optional):</label>
          <textarea
            id="personalMessage"
            value={personalMessage}
            onChange={(e) => setPersonalMessage(e.target.value)}
            rows="4"
            placeholder="Add a personal message for the recipient..."
          ></textarea>
        </div>

        <div className="form-group">
          <label>Card Details:</label>
          <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
        </div>

        <button type="submit" disabled={!stripe || processingPayment}>
          {processingPayment ? 'Processing...' : `Proceed to Payment ($${selectedAmount || '0'})`}
        </button>
      </form>
    </div>
  );
}

export default GiftCardPurchase;
