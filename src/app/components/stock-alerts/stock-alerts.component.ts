import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/models';

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './stock-alerts.component.html'
})
export class StockAlertsComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  threshold = 10;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: (d) => { this.products = d; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get outOfStock(): Product[] {
    return this.products.filter(p => p.stockQuantity === 0);
  }

  get criticalStock(): Product[] {
    return this.products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5);
  }

  get lowStock(): Product[] {
    return this.products.filter(p => p.stockQuantity > 5 && p.stockQuantity <= this.threshold);
  }

  get healthyStock(): Product[] {
    return this.products.filter(p => p.stockQuantity > this.threshold);
  }

  getStockClass(qty: number): string {
    if (qty === 0) return 'bg-danger';
    if (qty <= 5) return 'bg-warning';
    if (qty <= this.threshold) return 'bg-info';
    return 'bg-success';
  }

  getStockLabel(qty: number): string {
    if (qty === 0) return 'Out of Stock';
    if (qty <= 5) return 'Critical';
    if (qty <= this.threshold) return 'Low';
    return 'Healthy';
  }
}