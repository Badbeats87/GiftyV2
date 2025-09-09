import React, { useState, useEffect } from 'react';
import './UserDashboard.css'; // We'll create this CSS file next

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Simulate fetching user data and purchase history
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockUser = {
          id: 1,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
        };
        const mockPurchases = [
          { id: 101, businessName: 'The Grand Restaurant', giftCardValue: 50, purchaseDate: '2024-07-15', recipientEmail: 'john.doe@example.com' },
          { id: 102, businessName: 'Cozy Corner Cafe', giftCardValue: 20, purchaseDate: '2024-06-20', recipientEmail: 'mary.smith@example.com' },
        ];
        setUser(mockUser);
        setPurchases(mockPurchases);
      } catch (err) {
        setError('Failed to fetch user data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return <div className="user-dashboard-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="user-dashboard-container error">{error}</div>;
  }

  if (!user) {
    return <div className="user-dashboard-container">Please log in to view your dashboard.</div>;
  }

  return (
    <div className="user-dashboard-container">
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>

      <div className="purchase-history">
        <h2>Your Purchase History</h2>
        {purchases.length === 0 ? (
          <p>You haven't made any gift card purchases yet.</p>
        ) : (
          <ul className="purchase-list">
            {purchases.map(purchase => (
              <li key={purchase.id} className="purchase-item">
                <span><strong>{purchase.businessName}</strong> - ${purchase.giftCardValue}</span>
                <span>Purchased on: {purchase.purchaseDate} for {purchase.recipientEmail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
