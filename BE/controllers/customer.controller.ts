import type { Request, Response, NextFunction } from "express";
import User  from "../models/user.model";
import { Order } from "../models/order.model";
import Cart from "../models/cart.model";
import { IProduct } from "../models/product.model";

// Custom error class
class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function for API features
class APIFeatures {
  query: any;
  queryString: any;
  filterObj: any;

  constructor(query: any, queryString: any) {
    this.query = query;
    this.queryString = queryString;
    this.filterObj = {};
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.filterObj = JSON.parse(queryStr);
    this.query = this.query.find(this.filterObj);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = Number.parseInt(this.queryString.page, 10) || 1;
    const limit = Number.parseInt(this.queryString.limit, 10) || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private/Admin
export const getAllCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Apply API filters, sorting, pagination, etc.
    const features = new APIFeatures(User.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Get all users with applied filters
    const users = await features.query;
    const total = await User.countDocuments();

    // For each user, get their cart count
    const usersWithCartCount = await Promise.all(
      users.map(async (user:IProduct) => {
        const cart = await Cart.findOne({ user: user._id });
        const cartLength = cart ? cart.items.length : 0;

        return {
          ...user.toObject(),
          cartLength,
        };
      })
    );

    // Send response
    res.status(200).json({
      status: "success",
      results: usersWithCartCount.length,
      total,
      data: {
        customers: usersWithCartCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private/Admin
export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return next(new AppError("No customer found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a customer
// @route   PATCH /api/customers/:id
// @access  Private/Admin
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Prevent role change
    if (req.body.role && req.body.role !== "customer") {
      return next(new AppError("Cannot change customer role", 400));
    }

    const customer = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return next(new AppError("No customer found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        customer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer orders
// @route   GET /api/customers/:id/orders
// @access  Private/Admin
export const getCustomerOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customer = await User.findById(req.params.id);

    if (!customer) {
      return next(new AppError("No customer found with that ID", 404));
    }

    const features = new APIFeatures(
      Order.find({ customer: req.params.id }).populate(
        "items.product",
        "name price images"
      ),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const orders = await features.query;
    const total = await Order.countDocuments({
      customer: req.params.id,
      ...features.filterObj,
    });

    res.status(200).json({
      status: "success",
      results: orders.length,
      total,
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};
