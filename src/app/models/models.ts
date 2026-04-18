export interface Product {
  productId: number;
  productName: string;
  price: number;
  taxPercentage: number;
  stockQuantity: number;
  createdDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
  taxAmount: number;
}

export interface SaleItem {
  saleItemId?: number;
  saleId?: number;
  productId: number;
  productName?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  saleId: number;
  saleDate: string;
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  items: SaleItem[];
}

export interface SaleCreateRequest {
  totalAmount: number;
  taxAmount: number;
  netAmount: number;
  items: {
    productId: number;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  fullName: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface UserSession {
  token: string;
  fullName: string;
  username: string;
  role: string;
  expiresAt: string;
}

export interface User {
  userId: number;
  fullName: string;
  username: string;
  role: string;
  isActive: boolean;
  createdDate: string;
}

export interface UserCreateRequest {
  fullName: string;
  username: string;
  password: string;
  role: string;
}

export interface UserUpdateRequest {
  userId: number;
  fullName: string;
  role: string;
  isActive: boolean;
}
