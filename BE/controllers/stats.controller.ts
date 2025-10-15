import type { Request, Response, NextFunction } from "express";
import {
  SalesStats,
  ProductStats,
  CustomerStats,
  MonthlySales,
} from "../models/stats.model";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import User  from "../models/user.model";

// @desc    Get all dashboard statistics
// @route   GET /api/dashboard-stats
// @access  Private/Admin
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the latest stats from each collection
    const [salesStats, productStats, customerStats] = await Promise.all([
      SalesStats.findOne().sort({ date: -1 }).lean(),
      ProductStats.findOne().sort({ date: -1 }).lean(),
      CustomerStats.findOne().sort({ date: -1 }).lean(),
    ]);

    // Get monthly sales for the last 12 months
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Calculate the year and month for 12 months ago
    let yearFrom = currentYear;
    let monthFrom = currentMonth - 11;
    if (monthFrom <= 0) {
      yearFrom--;
      monthFrom += 12;
    }

    const monthlySales = await MonthlySales.find({
      $or: [
        { year: yearFrom, month: { $gte: monthFrom } },
        { year: currentYear, month: { $lte: currentMonth } },
      ],
    })
      .sort({ year: 1, month: 1 })
      .lean();

    res.status(200).json({
      status: "success",
      data: {
        sales: salesStats || {},
        products: productStats || {},
        customers: customerStats || {},
        monthlySales: monthlySales || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update sales statistics
// @route   POST /api/dashboard-stats/sales
// @access  Private/Admin
export const updateSalesStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get current date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Calculate daily revenue
    const dailyRevenue = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: today } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate weekly revenue
    const weeklyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
          createdAt: { $gte: oneWeekAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
          createdAt: { $gte: oneMonthAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate yearly revenue
    const yearlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
          createdAt: { $gte: oneYearAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate total revenue
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate average order value
    const averageOrderValue =
      totalRevenue.length > 0 && totalRevenue[0].count > 0
        ? totalRevenue[0].total / totalRevenue[0].count
        : 0;

    // Get sales by payment method
    const salesByPaymentMethod = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$paymentMethod",
          amount: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          method: "$_id",
          amount: 1,
          count: 1,
        },
      },
    ]);

    // Get sales by category
    const salesByCategory = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          amount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          count: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          amount: 1,
          count: 1,
        },
      },
    ]);

    // Create or update sales stats
    const salesStats = await SalesStats.findOneAndUpdate(
      {}, // Find the first document
      {
        date: now,
        dailyRevenue: dailyRevenue.length > 0 ? dailyRevenue[0].total : 0,
        weeklyRevenue: weeklyRevenue.length > 0 ? weeklyRevenue[0].total : 0,
        monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
        yearlyRevenue: yearlyRevenue.length > 0 ? yearlyRevenue[0].total : 0,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        orderCount: {
          daily: dailyRevenue.length > 0 ? dailyRevenue[0].count : 0,
          weekly: weeklyRevenue.length > 0 ? weeklyRevenue[0].count : 0,
          monthly: monthlyRevenue.length > 0 ? monthlyRevenue[0].count : 0,
          yearly: yearlyRevenue.length > 0 ? yearlyRevenue[0].count : 0,
          total: totalRevenue.length > 0 ? totalRevenue[0].count : 0,
        },
        averageOrderValue,
        salesByPaymentMethod,
        salesByCategory,
        lastUpdated: now,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        salesStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product statistics
// @route   POST /api/dashboard-stats/products
// @access  Private/Admin
export const updateProductStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();

    // Get total products
    const totalProducts = await Product.countDocuments();

    // Get products by category
    const productsByCategory = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          inStock: {
            $sum: {
              $cond: [{ $gt: ["$stock", 10] }, 1, 0],
            },
          },
          lowStock: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] },
                1,
                0,
              ],
            },
          },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ["$stock", 0] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          count: 1,
          inStock: 1,
          lowStock: 1,
          outOfStock: 1,
        },
      },
    ]);

    // Get top selling products
    const topSellingProducts = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$productInfo.name",
          category: "$productInfo.category",
          totalSold: 1,
          revenue: 1,
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    // Get low stock and out of stock counts
    const lowStockCount = await Product.countDocuments({
      stock: { $gt: 0, $lte: 10 },
    });
    const outOfStockCount = await Product.countDocuments({ stock: 0 });

    // Create or update product stats
    const productStats = await ProductStats.findOneAndUpdate(
      {}, // Find the first document
      {
        date: now,
        totalProducts,
        productsByCategory,
        topSellingProducts,
        lowStockCount,
        outOfStockCount,
        lastUpdated: now,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        productStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer statistics
// @route   POST /api/dashboard-stats/customers
// @access  Private/Admin
export const updateCustomerStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Get total customers
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // Get new customers
    const newCustomersDaily = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: today },
    });
    const newCustomersWeekly = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: oneWeekAgo },
    });
    const newCustomersMonthly = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: oneMonthAgo },
    });
    const newCustomersYearly = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: oneYearAgo },
    });

    // Get active customers (placed an order in the last 30 days)
    const activeCustomers = await Order.aggregate([
      { $match: { createdAt: { $gte: oneMonthAgo } } },
      { $group: { _id: "$customer" } },
      { $count: "active" },
    ]);

    // Get top customers
    const topCustomers = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: "$customer",
          totalSpent: { $sum: "$totalPrice" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: "$customerInfo" },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: "$customerInfo.name",
          email: "$customerInfo.email",
          totalSpent: 1,
          orderCount: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    // Calculate customer retention rate (simplified)
    const customerRetentionRate =
      activeCustomers.length > 0
        ? (activeCustomers[0].active / totalCustomers) * 100
        : 0;

    // Create or update customer stats
    const customerStats = await CustomerStats.findOneAndUpdate(
      {}, // Find the first document
      {
        date: now,
        totalCustomers,
        newCustomers: {
          daily: newCustomersDaily,
          weekly: newCustomersWeekly,
          monthly: newCustomersMonthly,
          yearly: newCustomersYearly,
        },
        activeCustomers:
          activeCustomers.length > 0 ? activeCustomers[0].active : 0,
        topCustomers,
        customerRetentionRate,
        lastUpdated: now,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        customerStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update monthly sales history
// @route   POST /api/dashboard-stats/monthly-sales
// @access  Private/Admin
export const updateMonthlySales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get current month and year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

    // Check if we already have data for the current month
    const existingRecord = await MonthlySales.findOne({
      year: currentYear,
      month: currentMonth,
    });

    if (existingRecord) {
      // We already have a record for this month, no need to update
      res.status(200).json({
        status: "success",
        message: "Monthly sales record already exists for the current month",
        data: {
          monthlySales: existingRecord,
        },
      });
    }

    // Get start and end of the previous month
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const startDate = new Date(previousYear, previousMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth - 1, 0);

    // Calculate monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate average order value
    const averageOrderValue =
      monthlyRevenue.length > 0 && monthlyRevenue[0].count > 0
        ? monthlyRevenue[0].total / monthlyRevenue[0].count
        : 0;

    // Get sales by category
    const salesByCategory = await Order.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          amount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          count: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          amount: 1,
          count: 1,
        },
      },
    ]);

    // Create monthly sales record
    const monthlySales = await MonthlySales.create({
      year: previousYear,
      month: previousMonth,
      revenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
      orderCount: monthlyRevenue.length > 0 ? monthlyRevenue[0].count : 0,
      averageOrderValue,
      salesByCategory,
    });

    res.status(201).json({
      status: "success",
      data: {
        monthlySales,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update all dashboard statistics
// @route   POST /api/dashboard-stats/update-all
// @access  Private/Admin
export const updateAllStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Update all stats in parallel
    const [salesStats, productStats, customerStats] = await Promise.all([
      updateSalesStatsInternal(),
      updateProductStatsInternal(),
      updateCustomerStatsInternal(),
    ]);

    // Try to update monthly sales (this might not do anything if the record already exists)
    try {
      await updateMonthlySalesInternal();
    } catch (error) {
      console.error("Error updating monthly sales:", error);
      // Continue even if monthly sales update fails
    }

    res.status(200).json({
      status: "success",
      message: "All dashboard statistics updated successfully",
      data: {
        salesStats,
        productStats,
        customerStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Internal functions for updating stats (not exposed as routes)
async function updateSalesStatsInternal() {
  // Get current date
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Calculate daily revenue
  const dailyRevenue = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: today } } },
    {
      $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } },
    },
  ]);

  // Calculate weekly revenue
  const weeklyRevenue = await Order.aggregate([
    {
      $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: oneWeekAgo } },
    },
    {
      $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } },
    },
  ]);

  // Calculate monthly revenue
  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        status: { $ne: "Cancelled" },
        createdAt: { $gte: oneMonthAgo },
      },
    },
    {
      $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } },
    },
  ]);

  // Calculate yearly revenue
  const yearlyRevenue = await Order.aggregate([
    {
      $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: oneYearAgo } },
    },
    {
      $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } },
    },
  ]);

  // Calculate total revenue
  const totalRevenue = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    {
      $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } },
    },
  ]);

  // Calculate average order value
  const averageOrderValue =
    totalRevenue.length > 0 && totalRevenue[0].count > 0
      ? totalRevenue[0].total / totalRevenue[0].count
      : 0;

  // Get sales by payment method
  const salesByPaymentMethod = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: "$paymentMethod",
        amount: { $sum: "$totalPrice" },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        method: "$_id",
        amount: 1,
        count: 1,
      },
    },
  ]);

  // Get sales by category
  const salesByCategory = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $group: {
        _id: "$productInfo.category",
        amount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        count: { $sum: "$items.quantity" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        amount: 1,
        count: 1,
      },
    },
  ]);

  // Create or update sales stats
  return await SalesStats.findOneAndUpdate(
    {}, // Find the first document
    {
      date: now,
      dailyRevenue: dailyRevenue.length > 0 ? dailyRevenue[0].total : 0,
      weeklyRevenue: weeklyRevenue.length > 0 ? weeklyRevenue[0].total : 0,
      monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
      yearlyRevenue: yearlyRevenue.length > 0 ? yearlyRevenue[0].total : 0,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      orderCount: {
        daily: dailyRevenue.length > 0 ? dailyRevenue[0].count : 0,
        weekly: weeklyRevenue.length > 0 ? weeklyRevenue[0].count : 0,
        monthly: monthlyRevenue.length > 0 ? monthlyRevenue[0].count : 0,
        yearly: yearlyRevenue.length > 0 ? yearlyRevenue[0].count : 0,
        total: totalRevenue.length > 0 ? totalRevenue[0].count : 0,
      },
      averageOrderValue,
      salesByPaymentMethod,
      salesByCategory,
      lastUpdated: now,
    },
    { upsert: true, new: true }
  );
}

async function updateProductStatsInternal() {
  const now = new Date();

  // Get total products
  const totalProducts = await Product.countDocuments();

  // Get products by category
  const productsByCategory = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        inStock: {
          $sum: {
            $cond: [{ $gt: ["$stock", 10] }, 1, 0],
          },
        },
        lowStock: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ["$stock", 0] }, { $lte: ["$stock", 10] }] },
              1,
              0,
            ],
          },
        },
        outOfStock: {
          $sum: {
            $cond: [{ $eq: ["$stock", 0] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        count: 1,
        inStock: 1,
        lowStock: 1,
        outOfStock: 1,
      },
    },
  ]);

  // Get top selling products
  const topSellingProducts = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        totalSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $project: {
        _id: 0,
        productId: "$_id",
        name: "$productInfo.name",
        category: "$productInfo.category",
        totalSold: 1,
        revenue: 1,
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
  ]);

  // Get low stock and out of stock counts
  const lowStockCount = await Product.countDocuments({
    stock: { $gt: 0, $lte: 10 },
  });
  const outOfStockCount = await Product.countDocuments({ stock: 0 });

  // Create or update product stats
  return await ProductStats.findOneAndUpdate(
    {}, // Find the first document
    {
      date: now,
      totalProducts,
      productsByCategory,
      topSellingProducts,
      lowStockCount,
      outOfStockCount,
      lastUpdated: now,
    },
    { upsert: true, new: true }
  );
}

async function updateCustomerStatsInternal() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Get total customers
  const totalCustomers = await User.countDocuments({ role: "customer" });

  // Get new customers
  const newCustomersDaily = await User.countDocuments({
    role: "customer",
    createdAt: { $gte: today },
  });
  const newCustomersWeekly = await User.countDocuments({
    role: "customer",
    createdAt: { $gte: oneWeekAgo },
  });
  const newCustomersMonthly = await User.countDocuments({
    role: "customer",
    createdAt: { $gte: oneMonthAgo },
  });
  const newCustomersYearly = await User.countDocuments({
    role: "customer",
    createdAt: { $gte: oneYearAgo },
  });

  // Get active customers (placed an order in the last 30 days)
  const activeCustomers = await Order.aggregate([
    { $match: { createdAt: { $gte: oneMonthAgo } } },
    { $group: { _id: "$customer" } },
    { $count: "active" },
  ]);

  // Get top customers
  const topCustomers = await Order.aggregate([
    { $match: { status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: "$customer",
        totalSpent: { $sum: "$totalPrice" },
        orderCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customerInfo",
      },
    },
    { $unwind: "$customerInfo" },
    {
      $project: {
        _id: 0,
        customerId: "$_id",
        name: "$customerInfo.name",
        email: "$customerInfo.email",
        totalSpent: 1,
        orderCount: 1,
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 },
  ]);

  // Calculate customer retention rate (simplified)
  const customerRetentionRate =
    activeCustomers.length > 0
      ? (activeCustomers[0].active / totalCustomers) * 100
      : 0;

  // Create or update customer stats
  return await CustomerStats.findOneAndUpdate(
    {}, // Find the first document
    {
      date: now,
      totalCustomers,
      newCustomers: {
        daily: newCustomersDaily,
        weekly: newCustomersWeekly,
        monthly: newCustomersMonthly,
        yearly: newCustomersYearly,
      },
      activeCustomers:
        activeCustomers.length > 0 ? activeCustomers[0].active : 0,
      topCustomers,
      customerRetentionRate,
      lastUpdated: now,
    },
    { upsert: true, new: true }
  );
}

async function updateMonthlySalesInternal() {
  // Get current month and year
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

  // Check if we already have data for the current month
  const existingRecord = await MonthlySales.findOne({
    year: currentYear,
    month: currentMonth,
  });

  if (existingRecord) {
    // We already have a record for this month, no need to update
    return existingRecord;
  }

  // Get start and end of the previous month
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const startDate = new Date(previousYear, previousMonth - 1, 1);
  const endDate = new Date(currentYear, currentMonth - 1, 0);

  // Calculate monthly revenue
  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        status: { $ne: "Cancelled" },
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: { _id: null, total: { $sum: "$totalPrice" }, count: { $sum: 1 } },
    },
  ]);

  // Calculate average order value
  const averageOrderValue =
    monthlyRevenue.length > 0 && monthlyRevenue[0].count > 0
      ? monthlyRevenue[0].total / monthlyRevenue[0].count
      : 0;

  // Get sales by category
  const salesByCategory = await Order.aggregate([
    {
      $match: {
        status: { $ne: "Cancelled" },
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productInfo",
      },
    },
    { $unwind: "$productInfo" },
    {
      $group: {
        _id: "$productInfo.category",
        amount: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        count: { $sum: "$items.quantity" },
      },
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        amount: 1,
        count: 1,
      },
    },
  ]);

  // Create monthly sales record
  return await MonthlySales.create({
    year: previousYear,
    month: previousMonth,
    revenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
    orderCount: monthlyRevenue.length > 0 ? monthlyRevenue[0].count : 0,
    averageOrderValue,
    salesByCategory,
  });
}
