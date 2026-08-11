import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { Product, StockLog } from '../types';

const router = Router();

router.use(authenticateJWT);

// GET /api/products - List, search & filter products
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { search, category, lowStock } = req.query;
  let products = db.getProducts();

  if (search) {
    const q = String(search).toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.warehouseLocation.toLowerCase().includes(q)
    );
  }

  if (category) {
    products = products.filter(p => p.category === String(category));
  }

  if (lowStock === 'true') {
    products = products.filter(p => p.currentStock <= p.minStockAlert);
  }

  return res.json({
    success: true,
    count: products.length,
    products
  });
});

// GET /api/products/stock-logs - Audit trail of stock movement
router.get('/stock-logs', (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.getStockLogs();
  return res.json({
    success: true,
    count: logs.length,
    stockLogs: logs
  });
});

// GET /api/products/:id - Single Product detail
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  return res.json({ success: true, product });
});

// POST /api/products - Create Product (Admin & Warehouse)
router.post('/', requireRoles(['Admin', 'Warehouse']), (req: AuthenticatedRequest, res: Response) => {
  const { name, sku, category, unitPrice, currentStock, minStockAlert, warehouseLocation } = req.body;

  if (!name || !sku || !category || unitPrice === undefined || currentStock === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing: name, sku, category, unitPrice, currentStock.'
    });
  }

  // Check unique SKU
  const existingSku = db.getProducts().find(p => p.sku.toLowerCase() === String(sku).toLowerCase());
  if (existingSku) {
    return res.status(400).json({ success: false, message: `Product with SKU '${sku}' already exists.` });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    sku: String(sku).toUpperCase(),
    category,
    unitPrice: Number(unitPrice),
    currentStock: Number(currentStock),
    minStockAlert: Number(minStockAlert || 10),
    warehouseLocation: warehouseLocation || 'Default Warehouse',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.addProduct(newProduct);

  // Initial stock movement log if stock > 0
  if (newProduct.currentStock > 0) {
    const initialLog: StockLog = {
      id: `log-${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      quantityChanged: newProduct.currentStock,
      movementType: 'IN',
      reason: 'Initial stock creation',
      createdBy: req.user?.name || 'Warehouse',
      createdAt: new Date().toISOString()
    };
    db.addStockLog(initialLog);
  }

  return res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    product: newProduct
  });
});

// PUT /api/products/:id - Edit Product (Admin & Warehouse)
router.put('/:id', requireRoles(['Admin', 'Warehouse']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  return res.json({
    success: true,
    message: 'Product updated successfully.',
    product: updated
  });
});

// POST /api/products/:id/stock - Manual Stock Adjustment (IN/OUT)
router.post('/:id/stock', requireRoles(['Admin', 'Warehouse']), (req: AuthenticatedRequest, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const { quantityChanged, movementType, reason } = req.body;
  const qty = Number(quantityChanged);

  if (!qty || qty <= 0 || !['IN', 'OUT'].includes(movementType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input. quantityChanged must be > 0 and movementType must be IN or OUT.'
    });
  }

  let newStock = product.currentStock;
  if (movementType === 'IN') {
    newStock += qty;
  } else {
    if (product.currentStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock! Current stock is ${product.currentStock}, cannot remove ${qty}.`
      });
    }
    newStock -= qty;
  }

  const updatedProduct = db.updateProduct(product.id, { currentStock: newStock });

  const stockLog: StockLog = {
    id: `log-${Date.now()}`,
    productId: product.id,
    productName: product.name,
    quantityChanged: qty,
    movementType,
    reason: reason || 'Manual Stock Adjustment',
    createdBy: req.user?.name || 'Warehouse',
    createdAt: new Date().toISOString()
  };

  db.addStockLog(stockLog);

  return res.json({
    success: true,
    message: `Stock updated successfully (${movementType} ${qty} units).`,
    product: updatedProduct,
    stockLog
  });
});

export default router;
