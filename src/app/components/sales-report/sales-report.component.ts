import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesService } from '../../services/sales.service';
import { Sale } from '../../models/models';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-report.component.html'
})
export class SalesReportComponent implements OnInit {
  sales: Sale[] = [];
  isLoading = false;
  errorMessage = '';
  expandedSaleId: number | null = null;
  searchDate: string = '';

  constructor(private salesService: SalesService) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.isLoading = true;
    this.salesService.getAll().subscribe({
      next: (data) => { this.sales = data; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load sales.'; this.isLoading = false; }
    });
  }

  get filteredSales(): Sale[] {
    if (!this.searchDate) return this.sales;
    return this.sales.filter(s => s.saleDate.startsWith(this.searchDate));
  }

  get totalRevenue(): number {
    return this.filteredSales.reduce((sum, s) => sum + s.netAmount, 0);
  }

  get totalTax(): number {
    return this.filteredSales.reduce((sum, s) => sum + s.taxAmount, 0);
  }

  get totalTransactions(): number {
    return this.filteredSales.length;
  }

  toggleExpand(saleId: number): void {
    this.expandedSaleId = this.expandedSaleId === saleId ? null : saleId;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
