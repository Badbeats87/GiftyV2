import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Navbar from './components/Navbar';
import Businesses from './components/Businesses';
import BusinessProfile from './components/BusinessProfile';
import GiftCardPurchase from './components/GiftCardPurchase';
import UserDashboard from './components/UserDashboard';
import BusinessRegister from './components/BusinessRegister';
import BusinessLogin from './components/BusinessLogin';
import BusinessDashboard from './components/BusinessDashboard';
import BusinessProfileManagement from './components/BusinessProfileManagement';
import BusinessGiftCardCreate from './components/BusinessGiftCardCreate';
import BusinessGiftCardRedeem from './components/BusinessGiftCardRedeem';
import BusinessTransactions from './components/BusinessTransactions';
import BusinessInvoices from './components/BusinessInvoices';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminBusinessApplications from './components/AdminBusinessApplications';
import AdminUserManagement from './components/AdminUserManagement';
import AdminTransactionLogs from './components/AdminTransactionLogs';
import AdminFeeManagement from './components/AdminFeeManagement';
import AdminSystemHealth from './components/AdminSystemHealth';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // Import Material UI ThemeProvider and createTheme
import CssBaseline from '@mui/material/CssBaseline'; // Import CssBaseline for consistent styling

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
// This is your publishable key.
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
console.log('REACT_APP_STRIPE_PUBLISHABLE_KEY:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Define a Material UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#34495E', // Deep Charcoal Blue
    },
    secondary: {
      main: '#C0A04B', // Muted Gold
    },
    accent: {
      main: '#008080', // Deep Teal
    },
    background: {
      default: '#F8F9FA', // Light background
      paper: '#FFFFFF', // Card background
    },
    text: {
      primary: '#2C3E50', // Darker text for professionalism
      secondary: '#7F8C8D', // Muted grey for secondary text
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      color: '#34495E', // Use new primary color
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.4rem',
      fontWeight: 600,
      color: '#34495E', // Use new primary color
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.8rem',
      fontWeight: 600,
      color: '#34495E',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#34495E',
    },
    h5: {
      fontSize: '1.2rem',
      fontWeight: 500,
      color: '#34495E',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#34495E',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      color: '#2C3E50',
    },
    body2: {
      fontSize: '0.9rem',
      lineHeight: 1.6,
      color: '#7F8C8D',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#F8F9FA',
            '& fieldset': {
              borderColor: '#E0E0E0',
            },
            '&:hover fieldset': {
              borderColor: '#C0A04B', // Use secondary color on hover
            },
            '&.Mui-focused fieldset': {
              borderColor: '#C0A04B', // Use secondary color on focus
              boxShadow: '0 0 0 3px rgba(192, 160, 75, 0.15)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: '#F8F9FA',
          '& fieldset': {
            borderColor: '#E0E0E0',
          },
          '&:hover fieldset': {
            borderColor: '#C0A04B',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#C0A04B',
            boxShadow: '0 0 0 3px rgba(192, 160, 75, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
  },
});

function App() {
  // Ensure the Stripe publishable key is valid before loading Stripe
  if (!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || !process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_')) {
    console.error('Stripe Publishable Key is missing or invalid. Please set REACT_APP_STRIPE_PUBLISHABLE_KEY in your .env file.');
    return <div>Error: Stripe is not configured correctly.</div>;
  }

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Apply global CSS reset and base styles */}
        <div className="App">
          <Navbar />
          <div className="content">
            <Elements stripe={stripePromise}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/businesses" element={<Businesses />} />
                <Route path="/businesses/:id" element={<BusinessProfile />} />
                <Route path="/purchase/:businessId/:value" element={<GiftCardPurchase />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/business/register" element={<BusinessRegister />} />
                <Route path="/business/login" element={<BusinessLogin />} />
                <Route path="/business/dashboard" element={<BusinessDashboard />} />
                <Route path="/business/profile/:id" element={<BusinessProfileManagement />} />
                <Route path="/business/giftcards/create" element={<BusinessGiftCardCreate />} />
                <Route path="/business/giftcards/redeem" element={<BusinessGiftCardRedeem />} />
                <Route path="/business/transactions" element={<BusinessTransactions />} />
                <Route path="/business/invoices" element={<BusinessInvoices />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/business-applications" element={<AdminBusinessApplications />} />
                <Route path="/admin/users" element={<AdminUserManagement />} />
                <Route path="/admin/transactions" element={<AdminTransactionLogs />} />
                <Route path="/admin/fees" element={<AdminFeeManagement />} />
                <Route path="/admin/health" element={<AdminSystemHealth />} />
                <Route path="/return" element={<BusinessDashboard />} />
              </Routes>
            </Elements>
          </div>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
