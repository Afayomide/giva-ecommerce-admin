import mongoose, { Document, Model, Schema } from "mongoose";
import mongooseAutoPopulate from "mongoose-autopopulate";

export interface IOrderItem {
  product: Schema.Types.ObjectId;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface IOrder extends Document {
  user: Schema.Types.ObjectId;
  items: IOrderItem[];
  total: number;
  email: string;
  address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  status: "pending" | "paid" | "failed" | "shipped" | "delivered";
  paymentReference?: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, autopopulate: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    size: { type: String },
    color: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    email: { type: String, required: true },
    address: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "shipped", "delivered"],
      default: "pending",
      index: true,
    },
    paymentReference: { type: String },
    paymentStatus: {type: String, default: "not paid" },
  },
  { timestamps: true }
);

OrderItemSchema.plugin(mongooseAutoPopulate);

export const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);


