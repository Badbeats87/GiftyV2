import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './GiftCardPurchase.css';
import axios from 'axios';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Container, Typography, Box, TextField, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material'; // Import Material UI components

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
  const [processingPayment, setProcessingPayment] = useState(false);
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
            setSelectedAmount(50);
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
          email: recipientEmail,
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
    return (
      <Container className="gift-card-purchase-container" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Loading purchase options...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="gift-card-purchase-container error" sx={{ py: 4, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h5">{error}</Typography>
      </Container>
    );
  }

  if (!business) {
    return (
      <Container className="gift-card-purchase-container" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">No business data available for purchase.</Typography>
      </Container>
    );
  }

  return (
    <Container className="gift-card-purchase-container" sx={{ py: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: '10px', boxShadow: 3, maxWidth: 600, mx: 'auto', my: 4 }}>
      <Typography variant="h1" component="h1" gutterBottom>
        Purchase Gift Card for {business.name}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="amount-select-label">Select Amount</InputLabel>
          <Select
            labelId="amount-select-label"
            id="amount"
            value={selectedAmount}
            label="Select Amount"
            onChange={(e) => setSelectedAmount(parseInt(e.target.value))}
            required
          >
            <MenuItem value="">Select an amount</MenuItem>
            {(business.giftCards && business.giftCards.length > 0
              ? business.giftCards
              : [{ value: 10 }, { value: 25 }, { value: 50 }, { value: 100 }]
            ).map((card, index) => (
              <MenuItem key={index} value={card.value}>${card.value}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Recipient Email"
          type="email"
          id="recipientEmail"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="recipient@example.com"
          required
          fullWidth
          sx={{ mb: 3 }}
        />

        <TextField
          label="Personal Message (Optional)"
          id="personalMessage"
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
          multiline
          rows={4}
          placeholder="Add a personal message for the recipient..."
          fullWidth
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.default' }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Card Details:</Typography>
          <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
        </Box>

        <Button type="submit" variant="contained" color="primary" fullWidth disabled={!stripe || processingPayment} sx={{ py: 1.5 }}>
          {processingPayment ? 'Processing...' : `Proceed to Payment ($${selectedAmount || '0'})`}
        </Button>
      </Box>
    </Container>
  );
}

export default GiftCardPurchase;
