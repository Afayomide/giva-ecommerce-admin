import type { Request, Response, NextFunction } from "express"
import { Product } from "../models/product.model"
import multer from "multer";
import path from "path";
import fs from "fs";


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "gods-wears/products");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
// Custom error class
class AppError extends Error {
  statusCode: number
  status: string
  isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// Helper function for API features
class APIFeatures {
  query: any
  queryString: any
  filterObj: any

  constructor(query: any, queryString: any) {
    this.query = query
    this.queryString = queryString
    this.filterObj = {}
  }

  filter() {
    const queryObj = { ...this.queryString }
    const excludedFields = ["page", "sort", "limit", "fields"]
    excludedFields.forEach((el) => delete queryObj[el])

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    this.filterObj = JSON.parse(queryStr)
    this.query = this.query.find(this.filterObj)

    return this
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ")
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort("-createdAt")
    }

    return this
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ")
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select("-__v")
    }

    return this
  }

  paginate() {
    const page = Number.parseInt(this.queryString.page, 10) || 1
    const limit = Number.parseInt(this.queryString.limit, 10) || 100
    const skip = (page - 1) * limit

    this.query = this.query.skip(skip).limit(limit)

    return this
  }
}

// @desc    Get all products
// @route   GET /api/products
// @access  Private/Admin
export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Execute query with features
    const features = new APIFeatures(Product.find(), req.query).filter().sort().limitFields().paginate()

    const products = await features.query
    const total = await Product.countDocuments(features.filterObj)

    // Send response
    res.status(200).json({
      status: "success",
      results: products.length,
      total,
      data: {
        products,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private/Admin
export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return next(new AppError("No product found with that ID", 404))
    }

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.create(req.body)
    console.log(req.body)

    res.status(201).json({
      status: "success",
      data: {
        product,
      },
    })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

// @desc    Update a product
// @route   PATCH /api/products/:id
// @access  Private/Admin

// --- Controller: Update Product ---
export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const productId = req.params.id;
    const existingProduct = await Product.findById(productId);

    if (!existingProduct) {
      return next(new AppError("No product found with that ID", 404));
    }

    // Update only other fields
    for (const key in req.body) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        try {
          // Handle possible JSON strings (arrays, objects)
          const parsed = JSON.parse(req.body[key]);
          (existingProduct as any)[key] = parsed;
        } catch {
          (existingProduct as any)[key] = req.body[key];
        }
      }
    }

    await existingProduct.save();

    res.status(200).json({
      status: "success",
      data: {
        product: existingProduct,
      },
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
      return next(new AppError("No product found with that ID", 404))
    }

    res.status(204).json({
      status: "success",
      data: null,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Private/Admin
export const getProductCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await Product.aggregate([
      // ✅ Unwind the categories array so each category is treated individually
      { $unwind: "$categories" },

      // ✅ Group by each unique category name
      {
        $group: {
          _id: "$categories",
          count: { $sum: 1 },
        },
      },

      // ✅ Format output: rename _id to name
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
        },
      },

      // ✅ Sort alphabetically
      { $sort: { name: 1 } },
    ]);

    res.status(200).json({
      status: "success",
      results: categories.length,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update product stock
// @route   PATCH /api/products/:id/stock
// @access  Private/Admin
export const updateProductStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stock } = req.body

    if (stock === undefined) {
      return next(new AppError("Please provide stock quantity", 400))
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!product) {
      return next(new AppError("No product found with that ID", 404))
    }

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    })
  } catch (error) {
    next(error)
  }
}

