import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Businesses from './components/Businesses';
import BusinessProfile from './components/BusinessProfile';
import GiftCardPurchase from './components/GiftCardPurchase';
import UserDashboard from './components/UserDashboard'; // Import the new UserDashboard component
import BusinessRegister from './components/BusinessRegister';
import BusinessLogin from './components/BusinessLogin';
import BusinessDashboard from './components/BusinessDashboard';
import BusinessProfileManagement from './components/BusinessProfileManagement';
import BusinessGiftCardCreate from './components/BusinessGiftCardCreate';
import BusinessGiftCardRedeem from './components/BusinessGiftCardRedeem';
import BusinessTransactions from './components/BusinessTransactions';
import BusinessInvoices from './components/BusinessInvoices';
import AdminLogin from './components/AdminLogin'; // Import the new AdminLogin component
import AdminDashboard from './components/AdminDashboard'; // Import the new AdminDashboard component
import AdminBusinessApplications from './components/AdminBusinessApplications'; // Import the new AdminBusinessApplications component
import AdminUserManagement from './components/AdminUserManagement'; // Import the new AdminUserManagement component
import AdminTransactionLogs from './components/AdminTransactionLogs'; // Import the new AdminTransactionLogs component
import AdminFeeManagement from './components/AdminFeeManagement'; // Import the new AdminFeeManagement component
import AdminSystemHealth from './components/AdminSystemHealth'; // Import the new AdminSystemHealth component
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your publishable key.
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY); // Use environment variable
console.log('REACT_APP_STRIPE_PUBLISHABLE_KEY:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY); // Debugging line

function App() {
  // Ensure the Stripe publishable key is valid before loading Stripe
  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || !process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
    console.error('Stripe Publishable Key is missing or invalid. Please set REACT_APP_STRIPE_PUBLISHABLE_KEY in your .env file.');
    return <div>Error: Stripe is not configured correctly.</div>;
  }

  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="content">
          <Elements stripe={stripePromise}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/businesses" element={<Businesses />} />
              <Route path="/businesses/:id" element={<BusinessProfile />} />
              <Route path="/purchase/:businessId/:value" element={<GiftCardPurchase />} />
              <Route path="/dashboard" element={<UserDashboard />} /> {/* Route for user dashboard */}
              <Route path="/business/register" element={<BusinessRegister />} />
              <Route path="/business/login" element={<BusinessLogin />} />
              <Route path="/business/dashboard" element={<BusinessDashboard />} />
              <Route path="/business/profile/:id" element={<BusinessProfileManagement />} />
              <Route path="/business/giftcards/create" element={<BusinessGiftCardCreate />} />
              <Route path="/business/giftcards/redeem" element={<BusinessGiftCardRedeem />} />
              <Route path="/business/transactions" element={<BusinessTransactions />} />
              <Route path="/business/invoices" element={<BusinessInvoices />} />
              <Route path="/admin/login" element={<AdminLogin />} /> {/* Route for admin login */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} /> {/* Route for admin dashboard */}
              <Route path="/admin/business-applications" element={<AdminBusinessApplications />} /> {/* Route for admin business applications */}
              <Route path="/admin/users" element={<AdminUserManagement />} /> {/* Route for admin user management */}
              <Route path="/admin/transactions" element={<AdminTransactionLogs />} /> {/* Route for admin transaction logs */}
              <Route path="/admin/fees" element={<AdminFeeManagement />} /> {/* Route for admin fee management */}
              <Route path="/admin/health" element={<AdminSystemHealth />} /> {/* Route for admin system health */}
              <Route path="/return" element={<BusinessDashboard />} /> {/* Stripe Connect return URL */}
              {/* Future routes will go here */}
            </Routes>
          </Elements>
        </div>
      </div>
    </Router>
  );
}

export default App;
