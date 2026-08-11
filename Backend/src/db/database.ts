import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Customer, CustomerNote, Product, StockLog, Challan } from '../types';

interface DatabaseSchema {
  users: User[];
  customers: Customer[];
  customerNotes: CustomerNote[];
  products: Product[];
  stockLogs: StockLog[];
  challans: Challan[];
  challanCounter: number;
}

const DB_FILE = path.join(__dirname, '../../data.json');

const getInitialData = (): DatabaseSchema => {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);

  const initialUsers: User[] = [
    { id: 'usr-1', name: 'Admin User', email: 'admin@fundsroom.com', passwordHash: defaultPasswordHash, role: 'Admin' },
    { id: 'usr-2', name: 'Sales Agent', email: 'sales@fundsroom.com', passwordHash: defaultPasswordHash, role: 'Sales' },
    { id: 'usr-3', name: 'Warehouse Manager', email: 'warehouse@fundsroom.com', passwordHash: defaultPasswordHash, role: 'Warehouse' },
    { id: 'usr-4', name: 'Accounts Officer', email: 'accounts@fundsroom.com', passwordHash: defaultPasswordHash, role: 'Accounts' },
  ];

  const initialCustomers: Customer[] = [
    {
      id: 'cust-1',
      customerName: 'Rajesh Sharma',
      mobile: '+91 9876543210',
      email: 'rajesh@apexdistributors.com',
      businessName: 'Apex Distributors Pvt Ltd',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: 'Distributor',
      address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, MH - 400093',
      status: 'Active',
      followUpDate: '2026-08-15',
      notes: 'Key distributor for Western region. High monthly volume.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cust-2',
      customerName: 'Priya Patel',
      mobile: '+91 9812345678',
      email: 'priya@swastiktraders.in',
      businessName: 'Swastik Enterprise',
      gstNumber: '24BBBBA1111B2Z2',
      customerType: 'Wholesale',
      address: 'Shop 14, Grain Market, SG Highway, Ahmedabad, GJ - 380015',
      status: 'Active',
      followUpDate: '2026-08-12',
      notes: 'Interested in bulk purchase of electronic components.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'cust-3',
      customerName: 'Amit Verma',
      mobile: '+91 9765432109',
      email: 'amit@vermaretail.com',
      businessName: 'Verma Retail Store',
      gstNumber: '',
      customerType: 'Retail',
      address: '102 Commercial Complex, Connaught Place, New Delhi - 110001',
      status: 'Lead',
      followUpDate: '2026-08-14',
      notes: 'New lead received from trade fair. Requested quote for 50 units.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ];

  const initialNotes: CustomerNote[] = [
    {
      id: 'cnote-1',
      customerId: 'cust-1',
      note: 'Discussion completed regarding Q3 pricing. Agreed on 5% volume discount.',
      createdBy: 'Sales Agent',
      createdAt: new Date().toISOString()
    },
    {
      id: 'cnote-2',
      customerId: 'cust-3',
      note: 'Initial phone call. Sent product catalog via email.',
      createdBy: 'Sales Agent',
      createdAt: new Date().toISOString()
    }
  ];

  const initialProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Industrial Microcontroller Unit (MCU-V2)',
      sku: 'MCU-IND-001',
      category: 'Electronics',
      unitPrice: 1450.00,
      currentStock: 120,
      minStockAlert: 20,
      warehouseLocation: 'Rack A-12, Wh-1 (Mumbai)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-2',
      name: 'Heavy Duty Power Adapter 24V 5A',
      sku: 'PWR-ADP-24V',
      category: 'Power Supply',
      unitPrice: 850.00,
      currentStock: 15,
      minStockAlert: 25,
      warehouseLocation: 'Shelf B-04, Wh-1 (Mumbai)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-3',
      name: 'Digital Temperature Sensor Modbus',
      sku: 'SNS-TMP-MOD',
      category: 'Sensors',
      unitPrice: 620.00,
      currentStock: 80,
      minStockAlert: 15,
      warehouseLocation: 'Bin C-09, Wh-2 (Pune)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-4',
      name: 'Fiber Optic Transceiver Module 10G',
      sku: 'OPT-TRX-10G',
      category: 'Networking',
      unitPrice: 3200.00,
      currentStock: 45,
      minStockAlert: 10,
      warehouseLocation: 'Rack D-02, Wh-1 (Mumbai)',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const initialStockLogs: StockLog[] = [
    {
      id: 'log-1',
      productId: 'prod-1',
      productName: 'Industrial Microcontroller Unit (MCU-V2)',
      quantityChanged: 150,
      movementType: 'IN',
      reason: 'Initial Inward Shipment from Supplier',
      createdBy: 'Warehouse Manager',
      createdAt: new Date().toISOString()
    },
    {
      id: 'log-2',
      productId: 'prod-2',
      productName: 'Heavy Duty Power Adapter 24V 5A',
      quantityChanged: 35,
      movementType: 'IN',
      reason: 'Stock Inward Purchase Order PO-901',
      createdBy: 'Warehouse Manager',
      createdAt: new Date().toISOString()
    }
  ];

  const initialChallans: Challan[] = [
    {
      id: 'ch-1',
      challanNumber: 'CH-2026-0001',
      customerId: 'cust-1',
      customerName: 'Apex Distributors Pvt Ltd',
      items: [
        {
          productId: 'prod-1',
          sku: 'MCU-IND-001',
          name: 'Industrial Microcontroller Unit (MCU-V2)',
          unitPrice: 1450.00,
          quantity: 30,
          total: 43500.00
        },
        {
          productId: 'prod-2',
          sku: 'PWR-ADP-24V',
          name: 'Heavy Duty Power Adapter 24V 5A',
          unitPrice: 850.00,
          quantity: 20,
          total: 17000.00
        }
      ],
      totalQuantity: 50,
      totalAmount: 60500.00,
      status: 'Confirmed',
      createdBy: 'Sales Agent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return {
    users: initialUsers,
    customers: initialCustomers,
    customerNotes: initialNotes,
    products: initialProducts,
    stockLogs: initialStockLogs,
    challans: initialChallans,
    challanCounter: 2
  };
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse database file, resetting to initial data', e);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  public save(): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  // Customers
  public getCustomers(): Customer[] {
    return this.data.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find(c => c.id === id);
  }

  public addCustomer(customer: Customer): Customer {
    this.data.customers.unshift(customer);
    this.save();
    return customer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): Customer | null {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.customers[idx] = {
      ...this.data.customers[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.customers[idx];
  }

  public getCustomerNotes(customerId: string): CustomerNote[] {
    return this.data.customerNotes.filter(n => n.customerId === customerId);
  }

  public addCustomerNote(note: CustomerNote): CustomerNote {
    this.data.customerNotes.unshift(note);
    this.save();
    return note;
  }

  // Products
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public addProduct(product: Product): Product {
    this.data.products.unshift(product);
    this.save();
    return product;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = {
      ...this.data.products[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.products[idx];
  }

  public addStockLog(log: StockLog): StockLog {
    this.data.stockLogs.unshift(log);
    this.save();
    return log;
  }

  public getStockLogs(): StockLog[] {
    return this.data.stockLogs;
  }

  // Challans
  public getChallans(): Challan[] {
    return this.data.challans;
  }

  public getChallanById(id: string): Challan | undefined {
    return this.data.challans.find(c => c.id === id);
  }

  public getNextChallanNumber(): string {
    const num = this.data.challanCounter++;
    this.save();
    return `CH-2026-${String(num).padStart(4, '0')}`;
  }

  public addChallan(challan: Challan): Challan {
    this.data.challans.unshift(challan);
    this.save();
    return challan;
  }

  public updateChallan(id: string, updates: Partial<Challan>): Challan | null {
    const idx = this.data.challans.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.challans[idx] = {
      ...this.data.challans[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.challans[idx];
  }
}

export const db = new Database();
