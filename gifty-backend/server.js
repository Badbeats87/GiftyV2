require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const port = process.env.PORT || 5000;

// Log database environment variables to debug
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL); // Added for debugging Stripe redirect URL
const authRoutes = require('./routes/authRoutes');
const businessAuthRoutes = require('./routes/businessAuthRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const businessRoutes = require('./routes/businessRoutes');
const giftCardRoutes = require('./routes/giftCardRoutes'); // Added missing import
const paymentRoutes = require('./routes/paymentRoutes'); // Added missing import
const adminRoutes = require('./routes/adminRoutes'); // Import admin routes

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' })); // Enable CORS for frontend origin

app.get('/', (req, res) => {
  res.send('Gifty Backend API is running!');
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/business-auth', businessAuthRoutes);
app.use('/api/admin-auth', adminAuthRoutes);

// Business routes
app.use('/api/businesses', businessRoutes);

// Gift Card routes
app.use('/api/gift-cards', giftCardRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Admin routes
app.use('/api/admin', adminRoutes); // Register admin routes

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
