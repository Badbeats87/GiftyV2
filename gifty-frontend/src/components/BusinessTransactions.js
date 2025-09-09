import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusinessTransactions.css';

const BusinessTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('businessToken');
      if (!token) {
        navigate('/business/login');
        return;
      }

      try {
        // This endpoint needs to be implemented on the backend to fetch transactions for the logged-in business
        // For now, we'll simulate data or fetch all gift cards and filter
        const response = await fetch('http://localhost:5000/api/gift-cards/business/me', { // Assuming a 'me' endpoint for gift cards
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // This is a placeholder. The backend should provide actual transaction data.
          // For now, we'll use gift card data as a proxy for transactions.
          const formattedTransactions = data.map(card => ({
            id: card.id,
            type: card.is_redeemed ? 'Redemption' : 'Purchase',
            amount: card.value,
            date: card.created_at,
            code: card.unique_code,
            status: card.is_redeemed ? 'Redeemed' : 'Active',
          }));
          setTransactions(formattedTransactions);
        } else {
          setError(data.message || 'Failed to fetch transactions.');
          if (response.status === 401) {
            localStorage.removeItem('businessToken');
            navigate('/business/login');
          }
        }
      } catch (err) {
        setError('An error occurred while fetching transactions.');
        console.error('Fetch transactions error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [navigate]);

  if (loading) {
    return <div className="business-transactions-container">Loading transactions...</div>;
  }

  if (error) {
    return <div className="business-transactions-container error-message">{error}</div>;
  }

  return (
    <div className="business-transactions-container">
      <h2>Transaction History</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Code</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.type}</td>
                <td>€{transaction.amount.toFixed(2)}</td>
                <td>{new Date(transaction.date).toLocaleDateString()}</td>
                <td>{transaction.code}</td>
                <td>{transaction.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BusinessTransactions;
