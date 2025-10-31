import {Types} from "mongoose"

type MongoId = Types.ObjectId;


import { ICustomer } from "./customer.type"; 
import { IProduct } from "./product.type";

export interface IProductItem {
  product?: IProduct;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder {
  _id: string;
  user: ICustomer;
  items: IProductItem[];
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
  status: string;
  paymentStatus: string;
  paymentReference?: string;
  createdAt: Date;
  updatedAt: Date;
}