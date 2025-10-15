import express from "express"
import {
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrdersByCustomer,
} from "../controllers/order.controller"
import { protect, restrictToAdmin } from "../middleware/auth.middleware"
import { validateOrderStatus } from "../middleware/validation.middleware"

const router = express.Router()

// Apply authentication middleware to all routes
router.use(protect)
router.use(restrictToAdmin)

// Get all orders
router.route("/").get(getAllOrders)

// Get orders by customer
router.get("/customer/:customerId", getOrdersByCustomer)

// Get, update, and delete order by ID
router.route("/:id").get(getOrderById).patch(updateOrder).delete(deleteOrder)

// Update order status
router.put("/:id/status", updateOrderStatus)

module.exports = router;

