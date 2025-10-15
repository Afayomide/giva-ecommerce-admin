export interface MonthlySales {
  year: number;
  month: number;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  salesByCategory: {
    category: string;
    amount: number;
    count: number;
  }[];
}

export interface SalesStats {
  date: string;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalRevenue: number;
  orderCount: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    total: number;
  };
  averageOrderValue: number;
  salesByPaymentMethod: {
    method: string;
    amount: number;
    count: number;
  }[];
  salesByCategory: {
    category: string;
    amount: number;
    count: number;
  }[];
  lastUpdated: string;
}

export interface ProductStats {
  date: string;
  totalProducts: number;
  productsByCategory: {
    category: string;
    count: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }[];
  topSellingProducts: {
    productId: string;
    name: string;
    category: string;
    totalSold: number;
    revenue: number;
  }[];
  lowStockCount: number;
  outOfStockCount: number;
  lastUpdated: string;
}

export interface CustomerStats {
  date: string;
  totalCustomers: number;
  newCustomers: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  activeCustomers: number;
  topCustomers: {
    customerId: string;
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
  }[];
  customerRetentionRate: number;
  lastUpdated: string;
}

export interface DashboardStats {
  sales: SalesStats;
  products: ProductStats;
  customers: CustomerStats;
  monthlySales: MonthlySales[];
}
