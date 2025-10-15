export interface ICustomer {
  _id: string;
  fullname: string;
  username: string;
  email: string;
  password: string;
  cart?: any;
  cartLength?: number;
  createdAt: Date;
  updatedAt: Date;
}
