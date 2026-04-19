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

  // Store last bill snapshot for reprint
  private lastBillSnapshot: { saleId: number; items: CartItem[]; subTotal: number; totalTax: number; grandTotal: number } | null = null;

  constructor(
    private productService: ProductService,
    private salesService: SalesService
  ) {}

  ngOnInit(): void { this.loadProducts(); }

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

  removeFromCart(index: number): void { this.cart.splice(index, 1); }

  updateQuantity(item: CartItem, qty: number): void {
    if (qty < 1) return;
    if (qty > item.product.stockQuantity) {
      this.errorMessage = `Max stock: ${item.product.stockQuantity}`; return;
    }
    item.quantity = qty;
    item.total = qty * item.product.price;
    item.taxAmount = item.total * (item.product.taxPercentage / 100);
  }

  get subTotal(): number { return this.cart.reduce((sum, i) => sum + i.total, 0); }
  get totalTax(): number { return this.cart.reduce((sum, i) => sum + i.taxAmount, 0); }
  get grandTotal(): number { return this.subTotal + this.totalTax; }

  generateBill(): void {
    if (this.cart.length === 0) { this.errorMessage = 'Cart is empty.'; return; }
    this.isLoading = true;
    this.clearMessages();

    // Snapshot before clearing cart
    const snapshot = {
      items: [...this.cart.map(c => ({ ...c }))],
      subTotal: this.subTotal,
      totalTax: this.totalTax,
      grandTotal: this.grandTotal
    };

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
        this.lastSaleId = res.saleId;
        this.lastBillSnapshot = { saleId: res.saleId, ...snapshot };
        this.successMessage = `Bill saved! Sale ID: #${res.saleId}`;
        this.cart = [];
        this.loadProducts();
        this.isLoading = false;
        // Auto print receipt
        setTimeout(() => this.printReceipt(this.lastBillSnapshot!), 300);
      },
      error: () => {
        this.errorMessage = 'Failed to save sale. Please try again.';
        this.isLoading = false;
      }
    });
  }

  reprintLast(): void {
    if (this.lastBillSnapshot) this.printReceipt(this.lastBillSnapshot);
  }

  printReceipt(bill: { saleId: number; items: CartItem[]; subTotal: number; totalTax: number; grandTotal: number }): void {
    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const itemsHTML = bill.items.map(item => `
      <tr>
        <td>${item.product.productName}</td>
        <td class="center">${item.quantity}</td>
        <td class="right">₹${item.product.price.toFixed(2)}</td>
        <td class="right">₹${item.total.toFixed(2)}</td>
      </tr>
      <tr class="tax-row">
        <td colspan="3" style="padding-top:0; padding-left:12px; color:#888; font-size:10px;">
          Tax (${item.product.taxPercentage}%): ₹${item.taxAmount.toFixed(2)}
        </td>
        <td></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt #${bill.saleId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #1a1a1a;
      width: 300px;
      margin: 0 auto;
      padding: 16px 12px;
    }
    .header { text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
    .header h2 { font-size: 16px; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
    .header p { font-size: 10px; color: #555; }
    .sale-info { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 10px; }
    .sale-info span { color: #555; }
    .sale-info strong { color: #1a1a1a; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th {
      font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;
      border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc;
      padding: 6px 4px; text-align: left;
    }
    td { padding: 5px 4px; font-size: 11px; }
    .center { text-align: center; }
    .right { text-align: right; }
    .tax-row td { color: #888; font-size: 10px; padding-top: 0; }
    .totals { border-top: 1px dashed #ccc; padding-top: 8px; margin-bottom: 10px; }
    .totals .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
    .totals .row.grand {
      font-size: 14px; font-weight: 700;
      border-top: 1px dashed #ccc;
      margin-top: 6px; padding-top: 6px;
    }
    .footer {
      text-align: center; font-size: 10px; color: #888;
      border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 4px;
    }
    .thank-you { text-align: center; font-size: 13px; font-weight: 700; margin: 8px 0; }
    @media print {
      body { width: 72mm; }
      @page { margin: 4mm; size: 72mm auto; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>🛒 SMART POS</h2>
    <p>Point of Sale System</p>
    <p style="margin-top:4px; font-size:10px; color:#888;">Tax Invoice</p>
  </div>

  <div class="sale-info">
    <div><span>Sale ID: </span><strong>#${bill.saleId}</strong></div>
    <div><strong>${now}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th class="center">Qty</th>
        <th class="right">Price</th>
        <th class="right">Total</th>
      </tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal:</span><span>₹${bill.subTotal.toFixed(2)}</span></div>
    <div class="row"><span>Tax:</span><span>₹${bill.totalTax.toFixed(2)}</span></div>
    <div class="row grand"><span>GRAND TOTAL:</span><span>₹${bill.grandTotal.toFixed(2)}</span></div>
  </div>

  <div class="thank-you">Thank You! Visit Again 🙏</div>

  <div class="footer">
    <p>Powered by Smart POS System</p>
    <p style="margin-top:3px;">${now}</p>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
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