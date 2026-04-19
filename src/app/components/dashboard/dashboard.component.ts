import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { SalesService } from '../../services/sales.service';
import { Product, Sale } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  products: Product[] = [];
  sales: Sale[] = [];
  isLoading = true;

  constructor(
    private productService: ProductService,
    private salesService: SalesService
  ) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe({ next: (d) => { this.products = d; this.checkLoading(); } });
    this.salesService.getAll().subscribe({ next: (d) => { this.sales = d; this.checkLoading(); } });
  }

  checkLoading(): void {
    if (this.products.length >= 0 && this.sales.length >= 0) this.isLoading = false;
  }

  get todaySales(): Sale[] {
    const today = new Date().toDateString();
    return this.sales.filter(s => new Date(s.saleDate).toDateString() === today);
  }

  get todayRevenue(): number {
    return this.todaySales.reduce((sum, s) => sum + s.netAmount, 0);
  }

  get totalRevenue(): number {
    return this.sales.reduce((sum, s) => sum + s.netAmount, 0);
  }

  get totalTax(): number {
    return this.sales.reduce((sum, s) => sum + s.taxAmount, 0);
  }

  get lowStockProducts(): Product[] {
    return this.products.filter(p => p.stockQuantity <= 5).slice(0, 5);
  }

  get outOfStock(): number {
    return this.products.filter(p => p.stockQuantity === 0).length;
  }

  get recentSales(): Sale[] {
    return this.sales.slice(0, 6);
  }

  get topProducts(): { name: string; count: number }[] {
    const map = new Map<string, number>();
    this.sales.forEach(s => {
      s.items?.forEach(i => {
        map.set(i.productName || '', (map.get(i.productName || '') || 0) + i.quantity);
      });
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }
}