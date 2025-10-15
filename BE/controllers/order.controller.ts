import type { Request, Response, NextFunction } from "express";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";

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

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Execute query with features
    const features = new APIFeatures(
      Order.find().populate("user", "fullname email"),
      req.query
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const orders = await features.query;
    const total = await Order.countDocuments(features.filterObj);

    // Send response
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

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private/Admin
export const getOrderById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "fullname email")
      .populate("items.product");

    if (!order) {
      return next(new AppError("No order found with that ID", 404));
    }
     console.log(order)
    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order
// @route   PATCH /api/orders/:id
// @access  Private/Admin
export const updateOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Don't allow updating items directly to avoid stock issues
    if (req.body.items) {
      return next(
        new AppError(
          "Cannot update order items directly. Please use dedicated endpoints.",
          400
        )
      );
    }

    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return next(new AppError("No order found with that ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return next(new AppError("No order found with that ID", 404));
    }

    // Restore product stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  {
    try {
      var orderId = req.params.id;
      var { status } = req.body;
      var updated = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      res.json({ success: true, order: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: "Update failed" });
    }
  }
};

// @desc    Get orders by customer
// @route   GET /api/orders/customer/:customerId
// @access  Private/Admin
export const getOrdersByCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const customerId = req.params.customerId;

    const features = new APIFeatures(
      Order.find({ customer: customerId }).populate(
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
      customer: customerId,
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
