import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';
import { JWT_SECRET, authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = db.getUserByEmail(email);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
  }

  const payload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: payload
  });
});

// GET /api/auth/me
router.get('/me', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.user
  });
});

// GET /api/auth/demo-credentials
router.get('/demo-credentials', (_req: Request, res: Response) => {
  const users = db.getUsers().map(u => ({
    name: u.name,
    email: u.email,
    role: u.role,
    password: 'Password123!'
  }));

  return res.json({
    success: true,
    demoAccounts: users
  });
});

export default router;
