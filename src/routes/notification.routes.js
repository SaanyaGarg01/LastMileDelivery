const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');
const notificationService = require('../services/notification.service');

// POST /api/notifications/test-email (Public test endpoint)
router.post('/test-email', async (req, res, next) => {
  try {
    const { email } = req.body;
    const targetEmail = email || process.env.SMTP_USER || 'saanyagarg400@gmail.com';

    await notificationService.notifyUser({
      recipientEmail: targetEmail,
      title: '⚡ Live Email Delivery Test',
      message: `Congratulations! Your live email delivery from Last-Mile Tracker is working 100% cleanly to ${targetEmail}.`,
      type: 'SUCCESS',
    });

    res.json({
      success: true,
      message: `Test email dispatched to ${targetEmail}`,
    });
  } catch (error) {
    next(error);
  }
});

router.use(authenticate);

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
