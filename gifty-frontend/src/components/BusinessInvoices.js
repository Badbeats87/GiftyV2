import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusinessInvoices.css';

const BusinessInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      const token = localStorage.getItem('businessToken');
      if (!token) {
        navigate('/business/login');
        return;
      }

      try {
        // This endpoint needs to be implemented on the backend to fetch invoices for the logged-in business
        // For now, we'll simulate data
        const response = await fetch('http://localhost:5000/api/invoices/business/me', { // Placeholder endpoint
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          // Placeholder data for invoices
          setInvoices([
            { id: 'INV-2024-001', month: 'July 2024', amount: 150.75, status: 'Paid', downloadUrl: '#' },
            { id: 'INV-2024-002', month: 'August 2024', amount: 210.50, status: 'Paid', downloadUrl: '#' },
          ]);
        } else {
          setError(data.message || 'Failed to fetch invoices.');
          if (response.status === 401) {
            localStorage.removeItem('businessToken');
            navigate('/business/login');
          }
        }
      } catch (err) {
        setError('An error occurred while fetching invoices.');
        console.error('Fetch invoices error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [navigate]);

  if (loading) {
    return <div className="business-invoices-container">Loading invoices...</div>;
  }

  if (error) {
    return <div className="business-invoices-container error-message">{error}</div>;
  }

  return (
    <div className="business-invoices-container">
      <h2>Monthly Invoices</h2>
      {invoices.length === 0 ? (
        <p>No invoices found.</p>
      ) : (
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Month</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.id}</td>
                <td>{invoice.month}</td>
                <td>€{invoice.amount.toFixed(2)}</td>
                <td>{invoice.status}</td>
                <td>
                  <a href={invoice.downloadUrl} target="_blank" rel="noopener noreferrer" className="download-button">
                    Download PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BusinessInvoices;
