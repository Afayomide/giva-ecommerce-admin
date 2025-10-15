import mongoose, { Schema } from "mongoose";

// Sales Statistics Schema
export interface ISalesStats {
  date: Date;
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
  lastUpdated: Date;
}

const salesStatsSchema = new Schema<ISalesStats>({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dailyRevenue: {
    type: Number,
    default: 0,
  },
  weeklyRevenue: {
    type: Number,
    default: 0,
  },
  monthlyRevenue: {
    type: Number,
    default: 0,
  },
  yearlyRevenue: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  orderCount: {
    daily: {
      type: Number,
      default: 0,
    },
    weekly: {
      type: Number,
      default: 0,
    },
    monthly: {
      type: Number,
      default: 0,
    },
    yearly: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  averageOrderValue: {
    type: Number,
    default: 0,
  },
  salesByPaymentMethod: [
    {
      method: String,
      amount: Number,
      count: Number,
    },
  ],
  salesByCategory: [
    {
      category: String,
      amount: Number,
      count: Number,
    },
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Product Statistics Schema
export interface IProductStats {
  date: Date;
  totalProducts: number;
  productsByCategory: {
    category: string;
    count: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  }[];
  topSellingProducts: {
    productId: mongoose.Types.ObjectId;
    name: string;
    category: string;
    totalSold: number;
    revenue: number;
  }[];
  lowStockCount: number;
  outOfStockCount: number;
  lastUpdated: Date;
}

const productStatsSchema = new Schema<IProductStats>({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  totalProducts: {
    type: Number,
    default: 0,
  },
  productsByCategory: [
    {
      category: String,
      count: Number,
      inStock: Number,
      lowStock: Number,
      outOfStock: Number,
    },
  ],
  topSellingProducts: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
      name: String,
      category: String,
      totalSold: Number,
      revenue: Number,
    },
  ],
  lowStockCount: {
    type: Number,
    default: 0,
  },
  outOfStockCount: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Customer Statistics Schema
export interface ICustomerStats {
  date: Date;
  totalCustomers: number;
  newCustomers: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  activeCustomers: number;
  topCustomers: {
    customerId: mongoose.Types.ObjectId;
    name: string;
    email: string;
    totalSpent: number;
    orderCount: number;
  }[];
  customerRetentionRate: number;
  lastUpdated: Date;
}

const customerStatsSchema = new Schema<ICustomerStats>({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  totalCustomers: {
    type: Number,
    default: 0,
  },
  newCustomers: {
    daily: {
      type: Number,
      default: 0,
    },
    weekly: {
      type: Number,
      default: 0,
    },
    monthly: {
      type: Number,
      default: 0,
    },
    yearly: {
      type: Number,
      default: 0,
    },
  },
  activeCustomers: {
    type: Number,
    default: 0,
  },
  topCustomers: [
    {
      customerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      name: String,
      email: String,
      totalSpent: Number,
      orderCount: Number,
    },
  ],
  customerRetentionRate: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
});

// Monthly Sales History Schema
export interface IMonthlySales {
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

const monthlySalesSchema = new Schema<IMonthlySales>({
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  orderCount: {
    type: Number,
    default: 0,
  },
  averageOrderValue: {
    type: Number,
    default: 0,
  },
  salesByCategory: [
    {
      category: String,
      amount: Number,
      count: Number,
    },
  ],
});

// Create and export models
export const SalesStats = mongoose.model<ISalesStats>(
  "SalesStats",
  salesStatsSchema
);
export const ProductStats = mongoose.model<IProductStats>(
  "ProductStats",
  productStatsSchema
);
export const CustomerStats = mongoose.model<ICustomerStats>(
  "CustomerStats",
  customerStatsSchema
);
export const MonthlySales = mongoose.model<IMonthlySales>(
  "MonthlySales",
  monthlySalesSchema
);

// Export a combined type for convenience
export type DashboardStats = {
  sales: ISalesStats;
  products: IProductStats;
  customers: ICustomerStats;
  monthlySales: IMonthlySales[];
};
