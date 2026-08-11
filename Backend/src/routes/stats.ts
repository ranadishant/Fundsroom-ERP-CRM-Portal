import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/stats/dashboard
router.get('/dashboard', (_req: AuthenticatedRequest, res: Response) => {
  const customers = db.getCustomers();
  const products = db.getProducts();
  const challans = db.getChallans();
  const stockLogs = db.getStockLogs();

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const leadCustomers = customers.filter(c => c.status === 'Lead').length;

  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockAlert);

  const confirmedChallans = challans.filter(c => c.status === 'Confirmed');
  const draftChallans = challans.filter(c => c.status === 'Draft');

  const totalRevenue = confirmedChallans.reduce((acc, c) => acc + c.totalAmount, 0);

  return res.json({
    success: true,
    stats: {
      totalCustomers,
      activeCustomers,
      leadCustomers,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      totalChallans: challans.length,
      confirmedChallansCount: confirmedChallans.length,
      draftChallansCount: draftChallans.length,
      totalRevenue
    },
    lowStockProducts: lowStockProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert
    })),
    recentChallans: challans.slice(0, 5),
    recentStockLogs: stockLogs.slice(0, 5)
  });
});

export default router;
