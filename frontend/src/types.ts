export type UserRole = 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface CustomerNote {
  id: string;
  customerId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdBy: string;
  createdAt: string;
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName: string;
  items: ChallanItem[];
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  leadCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  totalChallans: number;
  confirmedChallansCount: number;
  draftChallansCount: number;
  totalRevenue: number;
}
