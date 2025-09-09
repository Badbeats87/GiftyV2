const express = require('express');
const router = express.Router();
const db = require('../database/db');
const logger = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/authMiddleware'); // Destructure authenticate and authorize

// Middleware to protect admin routes and ensure the user is an admin
const protectAdminRoute = (req, res, next) => {
  // The authenticate middleware should populate req.user with user information including role
  if (!req.user || req.user.role !== 'admin') {
    logger.warn(`Unauthorized access attempt to admin route by user ID: ${req.user ? req.user.id : 'N/A'}`);
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

    // For now, just return basic admin info
    logger.info(`Admin dashboard accessed by: ${adminEmail} (ID: ${adminId})`);
    res.status(200).json({
      message: 'Admin dashboard data',
      admin: {
        id: adminId,
        email: adminEmail,
        role: 'admin',
        // Add more dashboard specific data here later
      },
      metrics: {
        totalBusinesses: 0, // Placeholder
        pendingApplications: 0, // Placeholder
        totalUsers: 0, // Placeholder
      }
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
      .where({ status: 'pending' })
      .select('id', 'name', 'email', 'address', 'contact_phone', 'status', 'created_at'); // Select relevant fields

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
      .where({ id, status: 'pending' })
      .update({ status: 'approved', updated_at: db.fn.now() });

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to approve non-existent or non-pending business application ID: ${id}`);
      return res.status(404).json({ message: 'Business application not found or not pending.' });
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
      .where({ id, status: 'pending' })
      .update({ status: 'rejected', updated_at: db.fn.now() });

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to reject non-existent or non-pending business application ID: ${id}`);
      return res.status(404).json({ message: 'Business application not found or not pending.' });
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
    const users = await db('users').select('id', 'email', 'status', 'created_at');
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
  const { status } = req.body; // 'active' or 'suspended'

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided. Must be "active" or "suspended".' });
  }

  try {
    const updatedRows = await db('users')
      .where({ id })
      .update({ status, updated_at: db.fn.now() });

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to update status for non-existent user ID: ${id}`);
      return res.status(404).json({ message: 'User not found.' });
    }

    logger.info(`Admin ${req.user.email} updated user ID ${id} status to ${status}.`);
    res.status(200).json({ message: `User status updated to ${status} successfully.` });
  } catch (error) {
    logger.error(`Error updating user status for ID ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all businesses (approved, pending, rejected, suspended)
router.get('/businesses', authenticate, protectAdminRoute, async (req, res) => { // Changed endpoint to /businesses
  try {
    const businesses = await db('businesses').select('id', 'name', 'email', 'status', 'created_at');
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
  const { status } = req.body; // 'active' or 'suspended'

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided. Must be "active" or "suspended".' });
  }

  try {
    const updatedRows = await db('businesses')
      .where({ id })
      .update({ status, updated_at: db.fn.now() });

    if (updatedRows === 0) {
      logger.warn(`Admin ${req.user.email} attempted to update status for non-existent business ID: ${id}`);
      return res.status(404).json({ message: 'Business not found.' });
    }

    logger.info(`Admin ${req.user.email} updated business ID ${id} status to ${status}.`);
    res.status(200).json({ message: `Business status updated to ${status} successfully.` });
  } catch (error) {
    logger.error(`Error updating business status for ID ${id}: ${error.message}`);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all transactions
router.get('/transactions', authenticate, protectAdminRoute, async (req, res) => {
  try {
    const transactions = await db('transactions')
      .leftJoin('users as sender', 'transactions.sender_id', 'sender.id')
      .leftJoin('users as recipient', 'transactions.recipient_id', 'recipient.id')
      .leftJoin('businesses', 'transactions.business_id', 'businesses.id')
      .select(
        'transactions.id',
        'transactions.transaction_type',
        'transactions.amount',
        'transactions.platform_fee',
        'transactions.customer_fee',
        'transactions.created_at',
        'sender.email as sender_email',
        'recipient.email as recipient_email',
        'businesses.name as business_name'
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
    const platformFee = await db('platform_fees').where({ type: 'platform' }).first();
    const customerFee = await db('platform_fees').where({ type: 'customer' }).first();

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
      .where({ type: 'platform' })
      .update({ percentage: platformFeePercentage, updated_at: db.fn.now() });

    await db('platform_fees')
      .where({ type: 'customer' })
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

module.exports = router;
