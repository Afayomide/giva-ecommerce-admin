import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICartItem extends Document {
  product: Schema.Types.ObjectId;
  quantity: number;
  size?: string;
  color?: string;
}

export interface ICart extends Document {
  user: Schema.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
  createdAt: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    size: { type: String },
    color: { type: String },
  },
  { _id: true }
);

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

const Cart: Model<ICart> = mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
