import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminTransactionLogs.css'; // Assuming you'll create a CSS file for styling

const AdminTransactionLogs = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransactions = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/admin/transactions', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTransactions(response.data.transactions);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch transaction logs.');
        console.error('Admin transaction logs error:', err);
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [navigate]);

  if (loading) {
    return <div className="admin-transaction-logs-container">Loading transaction logs...</div>;
  }

  if (error) {
    return <div className="admin-transaction-logs-container error-message">{error}</div>;
  }

  return (
    <div className="admin-transaction-logs-container">
      <h2>Transaction Logs</h2>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
        <div className="transactions-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Business</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.id}</td>
                  <td>{transaction.transaction_type}</td>
                  <td>${parseFloat(transaction.amount).toFixed(2)}</td>
                  <td>{transaction.sender_email || 'N/A'}</td>
                  <td>{transaction.recipient_email || 'N/A'}</td>
                  <td>{transaction.business_name || 'N/A'}</td>
                  <td>{new Date(transaction.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionLogs;
