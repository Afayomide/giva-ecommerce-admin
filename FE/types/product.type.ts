

export enum ProductGender {
  MALE = "Male",
  FEMALE = "Female",
  UNISEX = "Unisex",
}



export interface IProduct {
  _id: string;
  name: string;
  categories: string[];
  colors: string[];
  types: string[];
  gender: ProductGender;
  images: string[];
  new: boolean;
  price: number;
  discountPrice: number;
  quantity: number;
  description: string[];
  instructions: string[];
  reviews: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: string;
}
