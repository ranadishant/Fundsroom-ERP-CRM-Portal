import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { Challan, ChallanItem, StockLog } from '../types';

const router = Router();

router.use(authenticateJWT);

// GET /api/challans - List & search sales challans
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { search, status } = req.query;
  let challans = db.getChallans();

  if (search) {
    const q = String(search).toLowerCase();
    challans = challans.filter(c =>
      c.challanNumber.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.createdBy.toLowerCase().includes(q)
    );
  }

  if (status) {
    challans = challans.filter(c => c.status === String(status));
  }

  return res.json({
    success: true,
    count: challans.length,
    challans
  });
});

// GET /api/challans/:id - Get Single Challan Detail
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const challan = db.getChallanById(req.params.id);
  if (!challan) {
    return res.status(404).json({ success: false, message: 'Sales Challan not found.' });
  }

  const customer = db.getCustomerById(challan.customerId);

  return res.json({
    success: true,
    challan,
    customer
  });
});

// POST /api/challans - Create Sales Challan (Admin & Sales)
router.post('/', requireRoles(['Admin', 'Sales']), (req: AuthenticatedRequest, res: Response) => {
  const { customerId, items, status } = req.body;

  if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input. customerId and at least one item are required.'
    });
  }

  const customer = db.getCustomerById(customerId);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  const challanStatus = status === 'Confirmed' ? 'Confirmed' : 'Draft';
  const preparedItems: ChallanItem[] = [];
  let totalAmount = 0;
  let totalQuantity = 0;

  // Validate all items and take SNAPSHOT data
  for (const rawItem of items) {
    const product = db.getProductById(rawItem.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product ID '${rawItem.productId}' not found.`
      });
    }

    const qty = Number(rawItem.quantity);
    if (!qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: `Quantity for product '${product.name}' must be greater than 0.`
      });
    }

    // CRITICAL BUSINESS LOGIC: Check Stock Availability if confirming
    if (challanStatus === 'Confirmed') {
      if (product.currentStock < qty) {
        return res.status(400).json({
          success: false,
          errorType: 'INSUFFICIENT_STOCK',
          message: `Cannot confirm challan! Insufficient stock for '${product.name}' (SKU: ${product.sku}). Available: ${product.currentStock}, Requested: ${qty}.`
        });
      }
    }

    const itemTotal = product.unitPrice * qty;

    // Snapshot data saved directly in item
    preparedItems.push({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.unitPrice,
      quantity: qty,
      total: itemTotal
    });

    totalAmount += itemTotal;
    totalQuantity += qty;
  }

  const challanNumber = db.getNextChallanNumber();

  const newChallan: Challan = {
    id: `ch-${Date.now()}`,
    challanNumber,
    customerId: customer.id,
    customerName: customer.businessName || customer.customerName,
    items: preparedItems,
    totalQuantity,
    totalAmount,
    status: challanStatus,
    createdBy: req.user?.name || 'Sales Agent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // If status is Confirmed, execute stock reduction and record stock logs
  if (challanStatus === 'Confirmed') {
    for (const item of preparedItems) {
      const product = db.getProductById(item.productId);
      if (product) {
        const newStock = product.currentStock - item.quantity;
        db.updateProduct(product.id, { currentStock: newStock });

        const log: StockLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId: product.id,
          productName: product.name,
          quantityChanged: item.quantity,
          movementType: 'OUT',
          reason: `Sales Challan Issued (${challanNumber})`,
          createdBy: req.user?.name || 'Sales Agent',
          createdAt: new Date().toISOString()
        };
        db.addStockLog(log);
      }
    }
  }

  db.addChallan(newChallan);

  return res.status(201).json({
    success: true,
    message: `Sales Challan ${challanNumber} created as ${challanStatus}.`,
    challan: newChallan
  });
});

// PUT /api/challans/:id/status - Update Challan Status (Draft -> Confirmed / Cancelled)
router.put('/:id/status', requireRoles(['Admin', 'Sales', 'Accounts']), (req: AuthenticatedRequest, res: Response) => {
  const challan = db.getChallanById(req.params.id);
  if (!challan) {
    return res.status(404).json({ success: false, message: 'Challan not found.' });
  }

  const { newStatus } = req.body;
  if (!['Confirmed', 'Cancelled'].includes(newStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid target status. Allowed: Confirmed, Cancelled.' });
  }

  if (challan.status === newStatus) {
    return res.json({ success: true, message: `Challan is already ${newStatus}.`, challan });
  }

  if (challan.status === 'Confirmed' && newStatus === 'Cancelled') {
    // If cancelling a confirmed challan, restock items
    for (const item of challan.items) {
      const product = db.getProductById(item.productId);
      if (product) {
        db.updateProduct(product.id, { currentStock: product.currentStock + item.quantity });
        const log: StockLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId: product.id,
          productName: product.name,
          quantityChanged: item.quantity,
          movementType: 'IN',
          reason: `Challan Cancelled Restock (${challan.challanNumber})`,
          createdBy: req.user?.name || 'User',
          createdAt: new Date().toISOString()
        };
        db.addStockLog(log);
      }
    }
  } else if (challan.status === 'Draft' && newStatus === 'Confirmed') {
    // Check stock for all items before confirming
    for (const item of challan.items) {
      const product = db.getProductById(item.productId);
      if (!product || product.currentStock < item.quantity) {
        const currentAvail = product ? product.currentStock : 0;
        return res.status(400).json({
          success: false,
          errorType: 'INSUFFICIENT_STOCK',
          message: `Cannot confirm! Insufficient stock for '${item.name}'. Available: ${currentAvail}, Required: ${item.quantity}.`
        });
      }
    }

    // Reduce stock
    for (const item of challan.items) {
      const product = db.getProductById(item.productId)!;
      db.updateProduct(product.id, { currentStock: product.currentStock - item.quantity });

      const log: StockLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: product.id,
        productName: product.name,
        quantityChanged: item.quantity,
        movementType: 'OUT',
        reason: `Sales Challan Confirmed (${challan.challanNumber})`,
        createdBy: req.user?.name || 'User',
        createdAt: new Date().toISOString()
      };
      db.addStockLog(log);
    }
  }

  const updated = db.updateChallan(challan.id, { status: newStatus });

  return res.json({
    success: true,
    message: `Challan status changed to ${newStatus}.`,
    challan: updated
  });
});

// GET /api/challans/:id/invoice-html - Printable Invoice HTML
router.get('/:id/invoice-html', (req: AuthenticatedRequest, res: Response) => {
  const challan = db.getChallanById(req.params.id);
  if (!challan) {
    return res.status(404).send('Challan not found');
  }

  const customer = db.getCustomerById(challan.customerId);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sales Challan - ${challan.challanNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; background-color: #fff; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; }
    .company { font-size: 24px; font-weight: bold; color: #0284c7; }
    .title { font-size: 22px; font-weight: bold; text-align: right; text-transform: uppercase; letter-spacing: 1px; color: #334155; }
    .meta-box { margin-top: 25px; display: flex; justify-content: space-between; }
    .box { width: 48%; background: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
    .box h4 { margin-top: 0; color: #0284c7; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th { background: #0f172a; color: white; padding: 10px; text-align: left; font-size: 13px; }
    td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .total-row td { font-weight: bold; font-size: 16px; background: #f1f5f9; }
    .status-stamp { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
    .status-Confirmed { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .status-Draft { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
    .status-Cancelled { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #64748b; }
    .signature { text-align: center; border-top: 1px solid #94a3b8; width: 200px; padding-top: 5px; }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px;">
    <button onclick="window.print()" style="background: #0284c7; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div>
      <div class="company">FUNDSROOM INFOTECH</div>
      <div>Wholesale & Distribution Portal</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">GSTIN: 27FUNDS1234F1Z9 | Phone: +91 22 4000 8888</div>
    </div>
    <div>
      <div class="title">SALES CHALLAN</div>
      <div style="text-align: right; margin-top: 5px;">
        <span class="status-stamp status-${challan.status}">${challan.status}</span>
      </div>
    </div>
  </div>

  <div class="meta-box">
    <div class="box">
      <h4>Customer Details (Billed To)</h4>
      <strong>${customer?.businessName || customer?.customerName || challan.customerName}</strong><br/>
      Contact Person: ${customer?.customerName || 'N/A'}<br/>
      Phone: ${customer?.mobile || 'N/A'} | Email: ${customer?.email || 'N/A'}<br/>
      GSTIN: ${customer?.gstNumber || 'N/A'}<br/>
      Address: ${customer?.address || 'N/A'}
    </div>
    <div class="box">
      <h4>Challan Summary</h4>
      <strong>Challan No:</strong> ${challan.challanNumber}<br/>
      <strong>Date:</strong> ${new Date(challan.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}<br/>
      <strong>Created By:</strong> ${challan.createdBy}<br/>
      <strong>Payment Status:</strong> Pending Invoice
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>SKU</th>
        <th>Product Description</th>
        <th style="text-align: right;">Unit Price (₹)</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Total Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${challan.items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><code>${item.sku}</code></td>
          <td><strong>${item.name}</strong></td>
          <td style="text-align: right;">₹${item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">₹${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="4" style="text-align: right;">Total Summary:</td>
        <td style="text-align: center;">${challan.totalQuantity} items</td>
        <td style="text-align: right;">₹${challan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <div>
      <p>Terms & Conditions:</p>
      <ul>
        <li>Goods once delivered as per confirmed sales challan are non-returnable.</li>
        <li>Subject to Mumbai Jurisdiction.</li>
      </ul>
    </div>
    <div class="signature">
      Authorized Signatory<br/>
      <strong>Fundsroom Infotech Pvt. Ltd.</strong>
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
});

export default router;
