const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const validate = require('../middleware/validate');
const notificationService = require('../services/notification.service');
const smsService = require('../services/sms.service');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    phone: z.string().optional(),
    role: z.enum(['CUSTOMER', 'AGENT', 'ADMIN']).default('CUSTOMER'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name, phone, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
        role: role || 'CUSTOMER',
      },
    });

    if (role === 'AGENT') {
      await prisma.agent.create({
        data: {
          userId: user.id,
          status: 'AVAILABLE',
          currentLat: 28.6139 + (Math.random() - 0.5) * 0.1,
          currentLng: 77.2090 + (Math.random() - 0.5) * 0.1,
        },
      });
    }

    // Send Welcome Email & SMS Notifications
    notificationService.notifyUser({
      userId: user.id,
      recipientEmail: user.email,
      title: '🎉 Welcome to Last-Mile Delivery Tracker!',
      message: `Hi ${user.name}, thank you for registering your ${user.role} account with Last-Mile Tracker.`,
      type: 'SUCCESS',
    }).catch(() => {});

    smsService.sendOrderStatusSMS({
      order: { id: null, customerId: user.id },
      phone: user.phone,
      type: 'WELCOME',
      status: 'REGISTERED',
      message: `Last-Mile Tracker: Welcome ${user.name}! Your ${user.role} account has been registered successfully.`,
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { agentProfile: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Send Sign In Security Alert Email & SMS Notifications
    notificationService.notifyUser({
      userId: user.id,
      recipientEmail: user.email,
      title: '🔐 Successful Sign-In Alert',
      message: `Hi ${user.name}, you logged in to your ${user.role} account on ${new Date().toLocaleString()}.`,
      type: 'INFO',
    }).catch(() => {});

    smsService.sendOrderStatusSMS({
      order: { id: null, customerId: user.id },
      phone: user.phone,
      type: 'LOGIN_ALERT',
      status: 'LOGIN',
      message: `Last-Mile Tracker: Security Alert — Account login detected at ${new Date().toLocaleTimeString()}.`,
    }).catch(() => {});

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        agentProfile: user.agentProfile || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role,
      agentProfile: req.user.agentProfile || null,
    },
  });
});

module.exports = router;
