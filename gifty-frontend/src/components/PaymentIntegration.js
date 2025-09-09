import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentIntegration.css'; // We'll create this CSS file next

function PaymentIntegration({ amount, onPaymentSuccess, onPaymentFailure }) {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      if (cardNumber.startsWith('4') && cardNumber.length === 16) { // Simple validation for a "successful" payment
        alert('Payment successful!');
        if (onPaymentSuccess) onPaymentSuccess();
        navigate('/confirmation'); // Redirect to a confirmation page
      } else {
        throw new Error('Invalid card details or payment failed.');
      }
    } catch (err) {
      setError(err.message);
      if (onPaymentFailure) onPaymentFailure(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="payment-integration-container">
      <h2>Complete Your Purchase</h2>
      <p className="payment-amount">Total Amount: ${amount ? amount.toFixed(2) : '0.00'}</p>

      <form onSubmit={handlePaymentSubmit}>
        <div className="form-group">
          <label htmlFor="cardHolderName">Card Holder Name</label>
          <input
            type="text"
            id="cardHolderName"
            value={cardHolderName}
            onChange={(e) => setCardHolderName(e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="cardNumber">Card Number</label>
          <input
            type="text"
            id="cardNumber"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))} // Only allow digits
            placeholder="**** **** **** ****"
            maxLength="16"
            required
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date (MM/YY)</label>
            <input
              type="text"
              id="expiryDate"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="MM/YY"
              maxLength="5"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="cvc">CVC</label>
            <input
              type="text"
              id="cvc"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))} // Only allow digits
              placeholder="***"
              maxLength="3"
              required
            />
          </div>
        </div>

        {error && <p className="payment-error">{error}</p>}

        <button type="submit" disabled={processing}>
          {processing ? 'Processing...' : `Pay $${amount ? amount.toFixed(2) : '0.00'}`}
        </button>
      </form>
    </div>
  );
}

export default PaymentIntegration;
