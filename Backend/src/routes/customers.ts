import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateJWT, AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { Customer, CustomerNote } from '../types';

const router = Router();

// Apply JWT auth to all customer routes
router.use(authenticateJWT);

// GET /api/customers - List, search & filter customers
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const { search, status, type } = req.query;
  let customers = db.getCustomers();

  if (search) {
    const q = String(search).toLowerCase();
    customers = customers.filter(c =>
      c.customerName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      c.businessName.toLowerCase().includes(q)
    );
  }

  if (status) {
    customers = customers.filter(c => c.status === String(status));
  }

  if (type) {
    customers = customers.filter(c => c.customerType === String(type));
  }

  return res.json({
    success: true,
    count: customers.length,
    customers
  });
});

// GET /api/customers/:id - Customer Detail with Notes
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const customer = db.getCustomerById(req.params.id);

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  const notes = db.getCustomerNotes(customer.id);

  return res.json({
    success: true,
    customer,
    notes
  });
});

// POST /api/customers - Create New Customer (Admin & Sales)
router.post('/', requireRoles(['Admin', 'Sales']), (req: AuthenticatedRequest, res: Response) => {
  const { customerName, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;

  if (!customerName || !mobile || !email || !businessName || !customerType || !address) {
    return res.status(400).json({
      success: false,
      message: 'Required fields missing: customerName, mobile, email, businessName, customerType, address.'
    });
  }

  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    customerName,
    mobile,
    email,
    businessName,
    gstNumber: gstNumber || '',
    customerType: customerType || 'Retail',
    address,
    status: status || 'Lead',
    followUpDate: followUpDate || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addCustomer(newCustomer);

  if (notes) {
    const initialNote: CustomerNote = {
      id: `cnote-${Date.now()}`,
      customerId: newCustomer.id,
      note: `Initial Note: ${notes}`,
      createdBy: req.user?.name || 'System',
      createdAt: new Date().toISOString()
    };
    db.addCustomerNote(initialNote);
  }

  return res.status(201).json({
    success: true,
    message: 'Customer created successfully.',
    customer: newCustomer
  });
});

// PUT /api/customers/:id - Edit Customer (Admin & Sales)
router.put('/:id', requireRoles(['Admin', 'Sales']), (req: AuthenticatedRequest, res: Response) => {
  const updated = db.updateCustomer(req.params.id, req.body);

  if (!updated) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  return res.json({
    success: true,
    message: 'Customer updated successfully.',
    customer: updated
  });
});

// POST /api/customers/:id/notes - Add follow-up note
router.post('/:id/notes', (req: AuthenticatedRequest, res: Response) => {
  const customer = db.getCustomerById(req.params.id);

  if (!customer) {
    return res.status(404).json({ success: false, message: 'Customer not found.' });
  }

  const { note } = req.body;

  if (!note || !note.trim()) {
    return res.status(400).json({ success: false, message: 'Note content cannot be empty.' });
  }

  const newNote: CustomerNote = {
    id: `cnote-${Date.now()}`,
    customerId: customer.id,
    note,
    createdBy: req.user?.name || 'User',
    createdAt: new Date().toISOString()
  };

  db.addCustomerNote(newNote);

  return res.status(201).json({
    success: true,
    message: 'Follow-up note added.',
    note: newNote
  });
});

export default router;
