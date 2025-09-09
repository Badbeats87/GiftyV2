const express = require('express');
const router = express.Router();
const db = require('../database/db');
const logger = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Import Stripe
const { authenticate, authorize } = require('../middleware/authMiddleware'); // Destructure authenticate and authorize

// Middleware to protect admin routes and ensure the user is an admin
const protectAdminRoute = (req, res, next) => {
  // The authenticate middleware should populate req.user with user information including role
  logger.info(`ProtectAdminRoute: req.user = ${JSON.stringify(req.user)}`); // Added detailed logging
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Unauthorized access attempt to admin route. User ID: ${req.user ? req.user.id : 'N/A'}, Role: ${req.user ? req.user.role : 'N/A'}`);
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Admin Dashboard Data Endpoint
router.get('/dashboard', authenticate, protectAdminRoute, async (req, res) => {
  try {
    // req.user is populated by authenticate middleware
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    // In a real application, you might fetch various metrics here:
    // - Total number of businesses
    // - Number of pending business applications
    // - Total number of users
    // - Recent transactions
    // - System health indicators (e.g., database connection status)

    let platformStripeAccountDetails = null;
    if (process.env.PLATFORM_STRIPE_ACCOUNT_ID) {
      try {
        const account = await stripe.accounts.retrieve(process.env.PLATFORM_STRIPE_ACCOUNT_ID);
        platformStripeAccountDetails = {
          id: account.id,
          email: account.email || account.individual?.email,
          business_name: account.business_profile?.name || account.settings?.dashboard?.display_name,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        };
      } catch (stripeError) {
        logger.error(`Error fetching platform Stripe account details: ${stripeError.message}`);
      }
    }

    logger.info(`Admin dashboard accessed by: ${adminEmail} (ID: ${adminId})`);
    res.status(200).json({
      message: 'Admin dashboard data',
      admin: {
        id: adminId,
        email: adminEmail,
        role: 'admin',
      },
      metrics: {
        totalBusinesses: 0, // Placeholder
        pendingApplications: 0, // Placeholder
        totalUsers: 0, // Placeholder
      },
      platformStripeAccountDetails,
    });
  } catch (error) {
    logger.error(`Error fetching admin dashboard data: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all pending business applications
router.get('/business-applications', authenticate, protectAdminRoute, async (req, res) => {
  try {
    const pendingApplications = await db('businesses')
      .where({ is_approved: false, is_active: true }) // Filter by is_approved: false and is_active: true for pending
      .select('id', 'name', 'email', 'address', 'contact_phone', 'is_approved', 'is_active', 'created_at'); // Select relevant fields

    logger.info(`Admin ${req.user.email} fetched ${pendingApplications.length} pending business applications.`);
    res.status(200).json({ applications: pendingApplications });
  } catch (error) {
    logger.error(`Error fetching business applications: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Approve a business application
router.put('/business-applications/:id/approve', authenticate, protectAdminRoute, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedRows = await db('businesses')
      .where({ id, is_approved: false }) // Only approve if not already approved
      .update({ is_approved: true, is_active: true, updated_at: db.fn.now() }); // Set to approved and active

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to approve non-existent or already approved business application ID: ${id}`);
      return res.status(404).json({ message: 'Business application not found or already approved.' });
    }

    logger.info(`Admin ${req.user.email} approved business application ID: ${id}`);
    res.status(200).json({ message: 'Business application approved successfully.' });
  } catch (error) {
    logger.error(`Error approving business application ID ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reject a business application
router.put('/business-applications/:id/reject', authenticate, protectAdminRoute, async (req, res) => {
  const { id } = req.params;
  try {
    const updatedRows = await db('businesses')
      .where({ id, is_approved: false }) // Only reject if not already approved
      .update({ is_approved: false, is_active: false, updated_at: db.fn.now() }); // Set to rejected and inactive

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to reject non-existent or already approved business application ID: ${id}`);
      return res.status(404).json({ message: 'Business application not found or already approved.' });
    }

    logger.info(`Admin ${req.user.email} rejected business application ID: ${id}`);
    res.status(200).json({ message: 'Business application rejected successfully.' });
  } catch (error) {
    logger.error(`Error rejecting business application ID ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all regular users
router.get('/users', authenticate, protectAdminRoute, async (req, res) => {
  try {
    const users = await db('users').select('id', 'email', 'created_at'); // Removed 'status'
    logger.info(`Admin ${req.user.email} fetched ${users.length} user accounts.`);
    res.status(200).json({ users });
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle user status (active/suspended)
router.put('/users/:id/status', authenticate, protectAdminRoute, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // Use is_active (boolean)

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'Invalid status provided. Must be a boolean (true/false).' });
  }

  try {
    const updatedRows = await db('users')
      .where({ id })
      .update({ is_active, updated_at: db.fn.now() });

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to update status for non-existent user ID: ${id}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`Admin ${req.user.email} updated user ID ${id} is_active status to ${is_active}.`);
    res.status(200).json({ message: `User status updated to ${is_active ? 'active' : 'suspended'} successfully.` });
  } catch (error) {
    logger.error(`Error updating user status for ID ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all businesses (approved, pending, rejected, suspended)
router.get('/businesses', authenticate, protectAdminRoute, async (req, res) => {
  try {
    const businesses = await db('businesses').select('id', 'name', 'email', 'is_approved', 'is_active', 'created_at'); // Select is_approved and is_active
    logger.info(`Admin ${req.user.email} fetched ${businesses.length} business accounts.`);
    res.status(200).json({ businesses });
  } catch (error) {
    logger.error(`Error fetching all businesses: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Toggle business status (active/suspended)
router.put('/businesses/:id/status', authenticate, protectAdminRoute, async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body; // Use is_active (boolean)

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'Invalid status provided. Must be a boolean (true/false).' });
  }

  try {
    const updatedRows = await db('businesses')
      .where({ id })
      .update({ is_active, updated_at: db.fn.now() });

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to update status for non-existent business ID: ${id}`);
      return res.status(404).json({ message: 'Business not found.' });
    }

    logger.info(`Admin ${req.user.email} updated business ID ${id} is_active status to ${is_active}.`);
    res.status(200).json({ message: `Business status updated to ${is_active ? 'active' : 'suspended'} successfully.` });
  } catch (error) {
    logger.error(`Error updating business status for ID ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all transactions
router.get('/transactions', authenticate, protectAdminRoute, async (req, res) => {
  try {
    const transactions = await db('transactions')
      .leftJoin('gift_cards', function() {
        this.on('transactions.entity_id', '=', 'gift_cards.id')
            .andOn(function() {
                this.on('transactions.type', '=', db.raw('?', ['purchase']))
                    .orOn('transactions.type', '=', db.raw('?', ['platform_fee_customer']))
                    .orOn('transactions.type', '=', db.raw('?', ['platform_fee_business']));
            });
      })
      .leftJoin('users as purchasing_users', 'gift_cards.purchased_by_user_id', '=', 'purchasing_users.id')
      .leftJoin('businesses as issuing_businesses', 'gift_cards.business_id', '=', 'issuing_businesses.id')
      .leftJoin('businesses as payout_businesses', function() {
        this.on('transactions.entity_id', '=', 'payout_businesses.id')
            .andOn('transactions.type', '=', db.raw('?', ['payout']))
            .andOn('transactions.entity_type', '=', db.raw('?', ['business']));
      })
      .select(
        'transactions.id',
        'transactions.type as transaction_type',
        'transactions.amount',
        'transactions.created_at',
        'transactions.entity_id',
        'transactions.entity_type',
        'transactions.status',
        'transactions.description',
        db.raw(`
          CASE
            WHEN transactions.type IN ('purchase', 'platform_fee_customer') THEN purchasing_users.email
            ELSE NULL
          END AS sender_email
        `),
        db.raw(`
          CASE
            WHEN transactions.type IN ('purchase', 'platform_fee_customer', 'platform_fee_business') THEN issuing_businesses.name
            WHEN transactions.type = 'payout' THEN payout_businesses.name
            ELSE NULL
          END AS business_name
        `)
      )
      .orderBy('transactions.created_at', 'desc');

    logger.info(`Admin ${req.user.email} fetched ${transactions.length} transaction logs.`);
    res.status(200).json({ transactions });
  } catch (error) {
    logger.error(`Error fetching transaction logs: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get platform and customer fee percentages
router.get('/fees', authenticate, protectAdminRoute, async (req, res) => {
  try {
    const platformFee = await db('platform_fees').where({ fee_type: 'platform' }).first(); // Use fee_type
    const customerFee = await db('platform_fees').where({ fee_type: 'customer' }).first(); // Use fee_type

    if (!platformFee || !customerFee) {
      logger.error('Platform or customer fee not found in database.');
      return res.status(500).json({ message: 'Fee configuration missing.' });
    }

    logger.info(`Admin ${req.user.email} fetched fee settings.`);
    res.status(200).json({ platformFee, customerFee });
  } catch (error) {
    logger.error(`Error fetching fee settings: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update platform and customer fee percentages
router.put('/fees', authenticate, protectAdminRoute, async (req, res) => {
  const { platformFeePercentage, customerFeePercentage } = req.body;

  if (typeof platformFeePercentage !== 'number' || typeof customerFeePercentage !== 'number' ||
      platformFeePercentage < 0 || platformFeePercentage > 100 ||
      customerFeePercentage < 0 || customerFeePercentage > 100) {
    return res.status(400).json({ message: 'Invalid fee percentages. Must be numbers between 0 and 100.' });
  }

  try {
    await db('platform_fees')
      .where({ fee_type: 'platform' }) // Use fee_type
      .update({ percentage: platformFeePercentage, updated_at: db.fn.now() });

    await db('platform_fees')
      .where({ fee_type: 'customer' }) // Use fee_type
      .update({ percentage: customerFeePercentage, updated_at: db.fn.now() });

    logger.info(`Admin ${req.user.email} updated fee settings.`);
    res.status(200).json({ message: 'Fee settings updated successfully.' });
  } catch (error) {
    logger.error(`Error updating fee settings: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// System Health Endpoint
router.get('/health', authenticate, protectAdminRoute, async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'down';
    let dbMessage = 'Database connection failed.';
    try {
      await db.raw('SELECT 1');
      dbStatus = 'up';
      dbMessage = 'Database is operational.';
    } catch (dbError) {
      logger.error(`Database health check failed: ${dbError.message}`);
      dbMessage = `Database connection error: ${dbError.message}`;
    }

    // Simulate API uptime/degradation (can be replaced with actual monitoring)
    const apiStatus = 'up'; // Placeholder: assume API is up if this endpoint is reached
    const apiMessage = 'All core API endpoints are responsive.';

    // Simulate external services status (e.g., Stripe, SES)
    const externalServicesStatus = 'up'; // Placeholder
    const externalServicesMessage = 'All external services are operational.';

    logger.info(`Admin ${req.user.email} checked system health.`);
    res.status(200).json({
      message: 'System health data',
      health: {
        database: { status: dbStatus, message: dbMessage },
        api: { status: apiStatus, message: apiMessage },
        externalServices: { status: externalServicesStatus, message: externalServicesMessage },
      },
    });
  } catch (error) {
    logger.error(`Error fetching system health data: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Temporary endpoint to get all businesses regardless of status for debugging
router.get('/all-businesses-debug', authenticate, protectAdminRoute, async (req, res) => {
  try {
    const businesses = await db('businesses').select('*'); // Select all columns
    logger.info(`Admin ${req.user.email} fetched all businesses for debugging.`);
    res.status(200).json({ businesses });
  } catch (error) {
    logger.error(`Error fetching all businesses for debug: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
