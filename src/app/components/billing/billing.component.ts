import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { SalesService } from '../../services/sales.service';
import { Product, CartItem } from '../../models/models';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing.component.html'
})
export class BillingComponent implements OnInit {
  products: Product[] = [];
  cart: CartItem[] = [];

  selectedProductId: number | null = null;
  selectedQuantity: number = 1;
  searchText: string = '';

  isLoading = false;
  successMessage = '';
  errorMessage = '';
  lastSaleId: number | null = null;

  constructor(
    private productService: ProductService,
    private salesService: SalesService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getAll().subscribe({
      next: (data) => this.products = data,
      error: () => this.errorMessage = 'Failed to load products.'
    });
  }

  get filteredProducts(): Product[] {
    if (!this.searchText.trim()) return this.products;
    return this.products.filter(p =>
      p.productName.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  get selectedProduct(): Product | undefined {
    return this.products.find(p => p.productId === Number(this.selectedProductId));
  }

  addToCart(): void {
    this.clearMessages();
    const product = this.selectedProduct;
    if (!product) { this.errorMessage = 'Please select a product.'; return; }
    if (this.selectedQuantity < 1) { this.errorMessage = 'Quantity must be at least 1.'; return; }
    if (this.selectedQuantity > product.stockQuantity) {
      this.errorMessage = `Only ${product.stockQuantity} units in stock.`; return;
    }

    const existing = this.cart.find(c => c.product.productId === product.productId);
    if (existing) {
      const newQty = existing.quantity + this.selectedQuantity;
      if (newQty > product.stockQuantity) {
        this.errorMessage = `Cannot exceed stock of ${product.stockQuantity}.`; return;
      }
      existing.quantity = newQty;
      existing.total = existing.quantity * product.price;
      existing.taxAmount = existing.total * (product.taxPercentage / 100);
    } else {
      const total = this.selectedQuantity * product.price;
      const taxAmount = total * (product.taxPercentage / 100);
      this.cart.push({ product, quantity: this.selectedQuantity, total, taxAmount });
    }

    this.selectedProductId = null;
    this.selectedQuantity = 1;
    this.searchText = '';
  }

  removeFromCart(index: number): void {
    this.cart.splice(index, 1);
  }

  updateQuantity(item: CartItem, qty: number): void {
    if (qty < 1) return;
    if (qty > item.product.stockQuantity) {
      this.errorMessage = `Max stock: ${item.product.stockQuantity}`; return;
    }
    item.quantity = qty;
    item.total = qty * item.product.price;
    item.taxAmount = item.total * (item.product.taxPercentage / 100);
  }

  get subTotal(): number {
    return this.cart.reduce((sum, i) => sum + i.total, 0);
  }

  get totalTax(): number {
    return this.cart.reduce((sum, i) => sum + i.taxAmount, 0);
  }

  get grandTotal(): number {
    return this.subTotal + this.totalTax;
  }

  generateBill(): void {
    if (this.cart.length === 0) { this.errorMessage = 'Cart is empty.'; return; }
    this.isLoading = true;
    this.clearMessages();

    const payload = {
      totalAmount: this.subTotal,
      taxAmount: this.totalTax,
      netAmount: this.grandTotal,
      items: this.cart.map(c => ({
        productId: c.product.productId,
        quantity: c.quantity,
        price: c.product.price,
        total: c.total
      }))
    };

    this.salesService.create(payload).subscribe({
      next: (res) => {
        this.successMessage = `Bill generated! Sale ID: #${res.saleId}`;
        this.lastSaleId = res.saleId;
        this.cart = [];
        this.loadProducts(); // refresh stock
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to save sale. Please try again.';
        this.isLoading = false;
      }
    });
  }

  clearCart(): void {
    if (this.cart.length === 0) return;
    if (confirm('Clear all items from cart?')) this.cart = [];
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }
}
