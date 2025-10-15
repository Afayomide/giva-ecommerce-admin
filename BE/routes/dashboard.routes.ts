import express from "express"
import {
  getSalesStats,
  getProductStats,
  getOrderStats,
  getCustomerStats,
  getRecentOrders,
  getTopSellingProducts,
} from "../controllers/dashboard.controller"
import { protect, restrictToAdmin } from "../middleware/auth.middleware"

const router = express.Router()

// Apply authentication middleware to all routes
router.use(protect)
router.use(restrictToAdmin)

// Dashboard statistics routes
router.get("/sales", getSalesStats)
router.get("/products", getProductStats)
router.get("/orders", getOrderStats)
router.get("/customers", getCustomerStats)
router.get("/recent-orders", getRecentOrders)
router.get("/top-products", getTopSellingProducts)

module.exports = router;

