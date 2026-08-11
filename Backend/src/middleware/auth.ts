import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthPayload, UserRole } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'fundsroom_secret_jwt_key_2026_super_secure';

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
      }

      req.user = decoded as AuthPayload;
      next();
    });
  } else {
    res.status(401).json({ success: false, message: 'Authentication required. Authorization header missing.' });
  }
};

export const requireRoles = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
};
